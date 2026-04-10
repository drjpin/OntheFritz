<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/auth.php';

$client = requireClientAuth();

$db  = getDB();
$ym  = date('Y-m');

$stmt = $db->prepare(
    'SELECT tokens_used, requests_count FROM usage WHERE client_id = ? AND year_month = ?'
);
$stmt->execute([$client['id'], $ym]);
$row = $stmt->fetch() ?: ['tokens_used' => 0, 'requests_count' => 0];

echo json_encode([
    'monthly_used'    => (int)$row['tokens_used'],
    'monthly_limit'   => (int)$client['monthly_token_limit'],
    'requests_count'  => (int)$row['requests_count'],
    'reset_date'      => date('M j', strtotime('first day of next month')),
    'year_month'      => $ym,
]);
