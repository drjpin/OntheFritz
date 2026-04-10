<?php
set_time_limit(0);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';
require_once __DIR__ . '/../lib/claude.php';

// ── Authenticate client ────────────────────────────────────────────────────────
$client = requireClientAuth();

// ── Check monthly token limit ──────────────────────────────────────────────────
$db   = getDB();
$ym   = date('Y-m');
$stmt = $db->prepare(
    'SELECT tokens_used FROM usage WHERE client_id = ? AND year_month = ?'
);
$stmt->execute([$client['id'], $ym]);
$tokens_used = (int)($stmt->fetchColumn() ?: 0);

if ($tokens_used >= $client['monthly_token_limit']) {
    $reset = date('M j', strtotime('first day of next month'));
    http_response_code(429);
    echo json_encode(['error' => "Monthly AI budget reached — resets $reset."]);
    exit;
}

// ── Parse and validate request body ───────────────────────────────────────────
$body = json_decode(file_get_contents('php://input'), true);
if (!$body || empty($body['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit;
}

// Force the model to whatever is configured for this client
$body['model'] = $client['claude_model'];

// Cap max_tokens — clients can't exceed 4096 regardless of what they request
$body['max_tokens'] = min((int)($body['max_tokens'] ?? 4096), 4096);

// ── Call Claude ────────────────────────────────────────────────────────────────
$result = callClaude($body);

if (isset($result['error'])) {
    http_response_code(502);
    echo json_encode(['error' => $result['error']]);
    exit;
}

$data = $result['body'];
if ($result['code'] !== 200 || empty($data['content'][0]['text'])) {
    $msg = $data['error']['message'] ?? 'Unknown API error';
    http_response_code(502);
    echo json_encode(['error' => "API error ({$result['code']}): $msg"]);
    exit;
}

// ── Track usage ────────────────────────────────────────────────────────────────
$new_tokens = ($data['usage']['input_tokens'] ?? 0) + ($data['usage']['output_tokens'] ?? 0);

$db->prepare(
    'INSERT INTO usage (client_id, year_month, tokens_used, requests_count)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       tokens_used     = tokens_used     + VALUES(tokens_used),
       requests_count  = requests_count  + 1'
)->execute([$client['id'], $ym, $new_tokens]);

$stmt2 = $db->prepare('SELECT tokens_used FROM usage WHERE client_id = ? AND year_month = ?');
$stmt2->execute([$client['id'], $ym]);
$monthly_used = (int)($stmt2->fetchColumn() ?: $tokens_used + $new_tokens);

// ── Return response (same shape as Anthropic + usage extras) ───────────────────
echo json_encode([
    'content'       => $data['content'],
    'usage'         => $data['usage'],
    'monthly_used'  => (int)$monthly_used,
    'monthly_limit' => (int)$client['monthly_token_limit'],
    'reset_date'    => date('M j', strtotime('first day of next month')),
]);
