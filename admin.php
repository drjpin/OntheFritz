<?php
session_start();

// Load config
$config_file = __DIR__ . '/config.php';
if (!file_exists($config_file)) {
    die('<pre style="font-family:monospace;padding:20px;background:#111;color:#f88">config.php not found.
Create it with:

&lt;?php
define(\'ADMIN_PASSWORD\', \'your-password\');
define(\'ANTHROPIC_API_KEY\', \'sk-ant-...\');
</pre>');
}
require_once $config_file;

define('CORE_FILES', ['index.php', 'nav.php', 'footer.php', 'style.css', 'script.js']);
define('BACKUP_DIR', __DIR__ . '/backups');

// Dynamically include any extra .php page files and leftover .html files
function getSiteFiles() {
    $files   = CORE_FILES;
    $exclude = ['admin.php', 'config.php', 'setup.php', 'nav.php', 'footer.php', 'index.php'];
    // Extra .php pages
    foreach (glob(__DIR__ . '/*.php') as $f) {
        $name = basename($f);
        if (!in_array($name, $exclude, true) && !in_array($name, $files, true)) $files[] = $name;
    }
    // Any remaining .html files
    foreach (glob(__DIR__ . '/*.html') as $f) {
        $name = basename($f);
        if (!in_array($name, $files, true)) $files[] = $name;
    }
    return $files;
}
define('SITE_FILES', getSiteFiles());

// ── Auth ──────────────────────────────────────────────────────────────────────

if (isset($_POST['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

if (isset($_POST['password'])) {
    if ($_POST['password'] === ADMIN_PASSWORD) {
        $_SESSION['admin_auth'] = true;
        header('Location: admin.php');
        exit;
    }
    $login_error = 'Invalid password.';
}

// ── Login page ────────────────────────────────────────────────────────────────

if (!($_SESSION['admin_auth'] ?? false)) { ?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Login</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0d1117; color: #e6edf3; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .login-box { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 40px; width: 100%; max-width: 380px; }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 6px; color: #fff; }
    p { font-size: 14px; color: #8b949e; margin-bottom: 28px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #8b949e; margin-bottom: 6px; }
    input[type="password"] { width: 100%; padding: 10px 14px; background: #0d1117; border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 15px; outline: none; transition: border-color 0.2s; }
    input[type="password"]:focus { border-color: #388bfd; }
    button { width: 100%; margin-top: 16px; padding: 11px; background: #238636; border: none; border-radius: 6px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #2ea043; }
    .error { margin-top: 14px; padding: 10px 14px; background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.4); border-radius: 6px; font-size: 13px; color: #f85149; }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>Site Admin</h1>
    <p>Sign in to edit your chiropractic website with AI.</p>
    <form method="POST">
      <label for="pw">Password</label>
      <input type="password" id="pw" name="password" autofocus autocomplete="current-password" />
      <button type="submit">Sign In</button>
      <?php if (!empty($login_error)): ?>
        <div class="error"><?= htmlspecialchars($login_error) ?></div>
      <?php endif; ?>
    </form>
  </div>
</body>
</html>
<?php
    exit;
}

// ── AJAX handlers ─────────────────────────────────────────────────────────────

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    header('Content-Type: application/json; charset=utf-8');
    $action = $_POST['action'];

    // get_file
    if ($action === 'get_file') {
        $file = $_POST['file'] ?? '';
        if (!in_array($file, SITE_FILES, true)) { echo json_encode(['error' => 'Invalid file']); exit; }
        $path = __DIR__ . '/' . $file;
        echo json_encode(['content' => file_exists($path) ? file_get_contents($path) : '']);
        exit;
    }

    // save
    if ($action === 'save') {
        $file    = $_POST['file']    ?? '';
        $content = $_POST['content'] ?? '';
        if (!in_array($file, SITE_FILES, true)) { echo json_encode(['error' => 'Invalid file']); exit; }

        // Create timestamped backup of ALL site files before saving
        if (!is_dir(BACKUP_DIR)) mkdir(BACKUP_DIR, 0755, true);
        $ts = date('Y-m-d-His');
        $bpath = BACKUP_DIR . '/' . $ts;
        mkdir($bpath, 0755, true);
        foreach (SITE_FILES as $f) {
            $src = __DIR__ . '/' . $f;
            if (file_exists($src)) copy($src, $bpath . '/' . $f);
        }

        file_put_contents(__DIR__ . '/' . $file, $content);
        echo json_encode(['ok' => true, 'backup' => $ts]);
        exit;
    }

    // ai_edit
    if ($action === 'ai_edit') {
        set_time_limit(0); // Remove PHP execution time limit for AI requests
        $file    = $_POST['file']    ?? '';
        $content = $_POST['content'] ?? '';
        $request = trim($_POST['request'] ?? '');
        if (!in_array($file, SITE_FILES, true) || !$request) {
            echo json_encode(['error' => 'Missing file or request']);
            exit;
        }

        $ext  = pathinfo($file, PATHINFO_EXTENSION);
        $lang = match($ext) { 'html' => 'HTML', 'css' => 'CSS', 'js' => 'JavaScript', default => $ext };

        // Give AI context about the full site structure
        $other_files = array_filter(SITE_FILES, fn($f) => $f !== $file);
        $file_list   = implode(', ', array_values($other_files));
        $is_new      = empty(trim($content));

        $system_prompt = "You are an expert web developer editing a chiropractic practice website. "
            . "The site uses PHP includes: nav.php contains the navigation, footer.php contains the footer. "
            . "Every page already has <?php include 'nav.php'; ?> and <?php include 'footer.php'; ?> — do NOT add or duplicate these. "
            . "The site files are: $file_list, plus the file you are editing: $file. "
            . "Rules you MUST follow:\n"
            . "1. Return ONLY the raw file content — no explanation, no markdown fences, no commentary.\n"
            . "2. You are editing ONLY $file. Do not modify any other file.\n"
            . "3. When editing nav.php or footer.php, your changes will automatically apply to every page on the site.\n"
            . "4. Page files (.php) already include nav.php and footer.php — only edit the content between those includes.\n"
            . "5. All internal links use .php extensions (e.g. index.php, blog.php).\n"
            . "6. Match the existing site's fonts (Playfair Display, Inter), colors (#1a4f72 primary, #2980b9 accent), and layout conventions.";

        $context      = $is_new
            ? "This is a brand new empty file. Create it from scratch, matching the site's existing style."
            : "Current content of $file:\n\n$content";

        $user_message = "$context\n\n---\nRequest: $request\n\nReturn ONLY the complete $lang content for $file.";

        $payload = json_encode([
            'model'      => 'claude-opus-4-5',
            'max_tokens' => 8192,
            'system'     => $system_prompt,
            'messages'   => [['role' => 'user', 'content' => $user_message]],
        ]);

        $ch = curl_init('https://api.anthropic.com/v1/messages');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => 180,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-api-key: ' . ANTHROPIC_API_KEY,
                'anthropic-version: 2023-06-01',
            ],
        ]);

        $resp      = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_err  = curl_error($ch);
        curl_close($ch);

        if (!$resp) {
            echo json_encode(['error' => 'API request failed: ' . $curl_err]);
            exit;
        }

        $data = json_decode($resp, true);
        if ($http_code !== 200 || empty($data['content'][0]['text'])) {
            $msg = $data['error']['message'] ?? $resp;
            echo json_encode(['error' => "API error ($http_code): $msg"]);
            exit;
        }

        // Strip any accidental markdown fences Claude might have added
        $result = trim($data['content'][0]['text']);
        $result = preg_replace('/^```[a-z]*\n?/i', '', $result);
        $result = preg_replace('/\n?```$/i', '', $result);

        echo json_encode(['content' => trim($result)]);
        exit;
    }

    // list_backups
    if ($action === 'list_backups') {
        if (!is_dir(BACKUP_DIR)) { echo json_encode(['backups' => []]); exit; }
        $dirs = array_filter(glob(BACKUP_DIR . '/*'), 'is_dir');
        $names = array_map('basename', $dirs);
        rsort($names);
        echo json_encode(['backups' => array_values($names)]);
        exit;
    }

    // get_backup_file — preview a file from a specific backup
    if ($action === 'get_backup_file') {
        $backup = $_POST['backup'] ?? '';
        $file   = $_POST['file']   ?? '';
        if (!preg_match('/^\d{4}-\d{2}-\d{2}-\d{6}$/', $backup)) { echo json_encode(['error' => 'Invalid backup']); exit; }
        if (!in_array($file, SITE_FILES, true)) { echo json_encode(['error' => 'Invalid file']); exit; }
        $src = BACKUP_DIR . '/' . $backup . '/' . $file;
        echo json_encode(['content' => file_exists($src) ? file_get_contents($src) : '(file not in this backup)']);
        exit;
    }

    // restore — load a backup file into the editor (doesn't save automatically)
    if ($action === 'restore') {
        $backup = $_POST['backup'] ?? '';
        $file   = $_POST['file']   ?? '';
        if (!preg_match('/^\d{4}-\d{2}-\d{2}-\d{6}$/', $backup)) { echo json_encode(['error' => 'Invalid backup']); exit; }
        if (!in_array($file, SITE_FILES, true)) { echo json_encode(['error' => 'Invalid file']); exit; }
        $src = BACKUP_DIR . '/' . $backup . '/' . $file;
        if (!file_exists($src)) { echo json_encode(['error' => 'Backup file not found']); exit; }
        echo json_encode(['content' => file_get_contents($src), 'ok' => true]);
        exit;
    }

    // new_page — create a pre-scaffolded html file with nav/footer already in place
    if ($action === 'new_page') {
        $raw  = strtolower(trim($_POST['name'] ?? ''));
        $name = preg_replace('/[\s_]+/', '-', $raw);        // spaces/underscores → dashes
        $name = preg_replace('/[^a-z0-9\-]/', '', $name);  // strip everything else
        $name = trim($name, '-');                           // clean leading/trailing dashes
        if (!$name) { echo json_encode(['error' => 'Invalid page name']); exit; }
        $filename = $name . '.php';
        if (in_array($filename, CORE_FILES, true)) { echo json_encode(['error' => 'Cannot overwrite a core file']); exit; }
        $path = __DIR__ . '/' . $filename;
        if (!file_exists($path)) {
            $title    = ucwords(str_replace('-', ' ', $name));
            $scaffold = <<<PHP
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{$title} | Sunrise Chiropractic</title>
  <meta name="description" content="" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

<?php include 'nav.php'; ?>

<!-- PAGE CONTENT: The AI will write everything between here and the footer -->
<main class="section">
  <div class="container">
    <div class="section-header">
      <div class="section-label">Sunrise Chiropractic</div>
      <h1 class="section-title">{$title}</h1>
      <p class="section-sub">Page content goes here.</p>
    </div>
  </div>
</main>
<!-- END PAGE CONTENT -->

<?php include 'footer.php'; ?>

<script src="script.js"></script>
</body>
</html>
PHP;
            file_put_contents($path, $scaffold);
        }
        echo json_encode(['ok' => true, 'file' => $filename]);
        exit;
    }

    echo json_encode(['error' => 'Unknown action']);
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site Admin — AI Editor</title>
  <style>
    /* ── Reset & base ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; overflow: hidden; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0d1117; color: #e6edf3; display: flex; flex-direction: column; }

    /* ── Top bar ── */
    .topbar { display: flex; align-items: center; justify-content: space-between; padding: 0 20px; height: 52px; background: #161b22; border-bottom: 1px solid #30363d; flex-shrink: 0; gap: 16px; }
    .topbar-title { font-weight: 700; font-size: 15px; color: #fff; white-space: nowrap; }
    .topbar-title span { color: #3fb950; }
    .tabs { display: flex; gap: 4px; }
    .tab { padding: 5px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid transparent; color: #8b949e; background: none; transition: all 0.15s; white-space: nowrap; }
    .tab:hover { color: #e6edf3; background: #21262d; }
    .tab.active { color: #fff; background: #21262d; border-color: #388bfd; }
    .tab-new { color: #3fb950 !important; border-color: transparent !important; }
    .tab-new:hover { background: rgba(63,185,80,0.1) !important; border-color: #3fb950 !important; }
    .topbar-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .btn-logout { padding: 5px 12px; background: none; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; font-size: 13px; cursor: pointer; }
    .btn-logout:hover { color: #f85149; border-color: #f85149; }

    /* ── Main layout ── */
    .main { display: grid; grid-template-columns: 340px 1fr; flex: 1; overflow: hidden; min-height: 0; }

    /* ── AI Panel ── */
    .ai-panel { border-right: 1px solid #30363d; display: flex; flex-direction: column; overflow: hidden; background: #0d1117; }
    .panel-header { padding: 14px 16px 12px; border-bottom: 1px solid #30363d; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #8b949e; flex-shrink: 0; }
    .chat-log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
    .msg { padding: 10px 14px; border-radius: 8px; font-size: 14px; line-height: 1.55; max-width: 100%; }
    .msg-user { background: #1f3a5c; color: #cae3ff; align-self: flex-end; border-radius: 8px 8px 2px 8px; }
    .msg-ai { background: #161b22; border: 1px solid #30363d; color: #e6edf3; align-self: flex-start; border-radius: 8px 8px 8px 2px; }
    .msg-ai.success { border-color: #238636; color: #3fb950; }
    .msg-ai.error { border-color: rgba(248,81,73,0.4); color: #f85149; }
    .msg-thinking { color: #8b949e; font-style: italic; }
    .ai-input-area { padding: 14px 16px; border-top: 1px solid #30363d; flex-shrink: 0; }
    .ai-input-row { display: flex; gap: 8px; }
    .ai-input { flex: 1; padding: 9px 12px; background: #161b22; border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 14px; resize: none; outline: none; font-family: inherit; line-height: 1.5; transition: border-color 0.2s; }
    .ai-input:focus { border-color: #388bfd; }
    .btn-ask { padding: 9px 16px; background: #1f6feb; border: none; border-radius: 6px; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
    .btn-ask:hover { background: #388bfd; }
    .btn-ask:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
    .ai-hint { font-size: 11px; color: #8b949e; margin-top: 8px; line-height: 1.5; }
    .ai-hint strong { color: #e6edf3; }

    /* ── Editor Panel ── */
    .editor-panel { display: flex; flex-direction: column; overflow: hidden; }
    .editor-toolbar { padding: 10px 16px; border-bottom: 1px solid #30363d; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; background: #161b22; gap: 10px; }
    .editor-file-label { font-size: 13px; font-weight: 600; color: #8b949e; font-family: monospace; }
    .editor-actions { display: flex; gap: 8px; align-items: center; }
    .btn-history { padding: 6px 12px; background: none; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn-history:hover { color: #e6edf3; border-color: #8b949e; }
    .btn-toggle-code { padding: 6px 12px; background: none; border: 1px solid #30363d; border-radius: 6px; color: #8b949e; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
    .btn-toggle-code:hover { color: #e6edf3; border-color: #8b949e; }
    .btn-toggle-code.active { color: #e6edf3; border-color: #388bfd; background: #1f3a5c; }
    .btn-save { padding: 7px 20px; background: #238636; border: none; border-radius: 6px; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    .btn-save:hover { background: #2ea043; }
    .btn-save:disabled { background: #21262d; color: #8b949e; cursor: not-allowed; }
    .editor-area { flex: 1; overflow: hidden; position: relative; }
    .preview-iframe { width: 100%; height: 100%; border: none; background: #fff; }
    .code-editor { display: none; width: 100%; height: 100%; padding: 16px; background: #0d1117; color: #e6edf3; font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace; font-size: 13px; line-height: 1.65; border: none; outline: none; resize: none; tab-size: 2; }
    .preview-pending { position: absolute; bottom: 16px; right: 16px; background: #1f6feb; color: #fff; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; opacity: 0; transition: opacity 0.2s; pointer-events: none; }
    .preview-pending.show { opacity: 1; }

    /* ── History Modal ── */
    .modal-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 1000; align-items: center; justify-content: center; }
    .modal-overlay.open { display: flex; }
    .modal { background: #161b22; border: 1px solid #30363d; border-radius: 12px; width: 680px; max-width: 95vw; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
    .modal-header { padding: 16px 20px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; }
    .modal-header h2 { font-size: 16px; font-weight: 700; }
    .modal-close { background: none; border: none; color: #8b949e; font-size: 22px; cursor: pointer; line-height: 1; padding: 0 4px; }
    .modal-close:hover { color: #e6edf3; }
    .modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .backup-list { display: flex; flex-direction: column; gap: 8px; }
    .backup-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #0d1117; border: 1px solid #30363d; border-radius: 8px; gap: 12px; }
    .backup-label { font-size: 14px; font-family: monospace; color: #e6edf3; }
    .backup-label small { display: block; font-size: 11px; color: #8b949e; margin-top: 2px; font-family: system-ui; }
    .backup-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn-restore { padding: 5px 12px; background: #1f6feb; border: none; border-radius: 5px; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
    .btn-restore:hover { background: #388bfd; }
    .no-backups { color: #8b949e; font-size: 14px; text-align: center; padding: 32px 0; }

    /* ── Status toast ── */
    .toast { position: fixed; bottom: 20px; right: 20px; padding: 10px 18px; border-radius: 8px; font-size: 14px; font-weight: 600; z-index: 2000; opacity: 0; transform: translateY(8px); transition: all 0.25s; pointer-events: none; }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast.ok { background: #238636; color: #fff; }
    .toast.err { background: #da3633; color: #fff; }

    /* ── Scrollbar ── */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #484f58; }
  </style>
</head>
<body>

<!-- Top bar -->
<div class="topbar">
  <div class="topbar-title">Site Admin <span>●</span> AI Editor</div>
  <div class="tabs" id="tab-list">
    <?php foreach (SITE_FILES as $i => $f): ?>
    <button class="tab <?= $i === 0 ? 'active' : '' ?>" data-file="<?= htmlspecialchars($f) ?>"><?= htmlspecialchars($f) ?></button>
    <?php endforeach; ?>
    <button class="tab tab-new" onclick="newPage()" title="Add a new page">+ Page</button>
  </div>
  <div class="topbar-right">
    <a href="../" target="_blank" style="font-size:13px;color:#8b949e;text-decoration:none;padding:5px 10px;border:1px solid #30363d;border-radius:6px;">View Site ↗</a>
    <form method="POST" style="margin:0">
      <button type="submit" name="logout" value="1" class="btn-logout">Log Out</button>
    </form>
  </div>
</div>

<!-- Main -->
<div class="main">

  <!-- AI Panel -->
  <div class="ai-panel">
    <div class="panel-header">AI Assistant</div>
    <div class="chat-log" id="chat-log">
      <div class="msg msg-ai">Hi! I'm your AI editor. Tell me what you'd like to change on the site and I'll update the file for you. Hit <strong>Save</strong> when you're happy with the result.</div>
    </div>
    <div class="ai-input-area">
      <div class="ai-input-row">
        <textarea class="ai-input" id="ai-input" rows="3" placeholder="e.g. Change the practice name to Smith Chiropractic and update the phone number to (555) 123-4567"></textarea>
        <button class="btn-ask" id="btn-ask" onclick="askAI()">Ask AI</button>
      </div>
      <div class="ai-hint">Changes will appear in the editor. <strong>Review then Save.</strong></div>
    </div>
  </div>

  <!-- Editor Panel -->
  <div class="editor-panel">
    <div class="editor-toolbar">
      <span class="editor-file-label" id="editor-file-label">Live Preview</span>
      <div class="editor-actions">
        <button class="btn-toggle-code" id="btn-toggle-code" onclick="toggleCode()">&#60;/&#62; View Code</button>
        <button class="btn-history" onclick="openHistory()">⟳ Version History</button>
        <button class="btn-save" id="btn-save" onclick="saveFile()">Save to Server</button>
      </div>
    </div>
    <div class="editor-area">
      <iframe class="preview-iframe" id="preview-iframe" src="/index.php"></iframe>
      <textarea class="code-editor" id="code-editor" spellcheck="false"></textarea>
      <div class="preview-pending" id="preview-pending">Preview updated — save to go live</div>
    </div>
  </div>

</div>

<!-- Version History Modal -->
<div class="modal-overlay" id="history-modal">
  <div class="modal">
    <div class="modal-header">
      <h2>Version History</h2>
      <button class="modal-close" onclick="closeHistory()">×</button>
    </div>
    <div class="modal-body">
      <p style="font-size:13px;color:#8b949e;margin-bottom:16px;">Each save creates a snapshot of all files. Click <em>Restore to Editor</em> to load a backup — then hit Save to apply it.</p>
      <div class="backup-list" id="backup-list">
        <div class="no-backups">Loading...</div>
      </div>
    </div>
  </div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
let currentFile = 'index.html';
let isBusy = false;
let showingCode = false;

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab:not(.tab-new)').forEach(tab => {
  tab.addEventListener('click', () => switchTab(tab, tab.dataset.file));
});

// ── Toggle code view ─────────────────────────────────────────────────────────
function toggleCode() {
  showingCode = !showingCode;
  const editor = document.getElementById('code-editor');
  const iframe = document.getElementById('preview-iframe');
  const btn = document.getElementById('btn-toggle-code');
  const label = document.getElementById('editor-file-label');
  if (showingCode) {
    editor.style.display = 'block';
    iframe.style.display = 'none';
    btn.classList.add('active');
    btn.textContent = '⊠ Hide Code';
    label.textContent = currentFile;
  } else {
    editor.style.display = 'none';
    iframe.style.display = 'block';
    btn.classList.remove('active');
    btn.innerHTML = '<\/> View Code';
    label.textContent = 'Live Preview';
  }
}

// ── Load file ─────────────────────────────────────────────────────────────────
async function loadFile(file) {
  const editor = document.getElementById('code-editor');
  editor.value = 'Loading…';
  const data = await api({ action: 'get_file', file });
  editor.value = data.content ?? '';
  if (showingCode) {
    document.getElementById('editor-file-label').textContent = file;
  }
}

// ── Update live preview ───────────────────────────────────────────────────────
async function updatePreview(updatedFile, updatedContent) {
  const iframe  = document.getElementById('preview-iframe');
  const badge   = document.getElementById('preview-pending');
  const isPhpPage = updatedFile.endsWith('.php') && !['nav.php','footer.php'].includes(updatedFile);

  // PHP page files can't be previewed via srcdoc (PHP won't execute inside it)
  // Just update the badge and let the save reload the live iframe
  if (isPhpPage) {
    badge.textContent = 'Changes ready — save to preview';
    badge.classList.add('show');
    setTimeout(() => badge.classList.remove('show'), 4000);
    return;
  }

  // For CSS: inject into the live index.php HTML
  // For nav.php, footer.php, style.css, script.js: preview against index.php
  let html = '';
  const data = await api({ action: 'get_file', file: 'index.php' });
  html = data.content ?? '';

  // Strip PHP tags so srcdoc doesn't show them as text
  html = html.replace(/<\?php[^?]*\?>/g, '');

  const base = `<base href="${window.location.origin}/">`;
  if (updatedFile === 'style.css') {
    html = html.replace(/<link[^>]*stylesheet[^>]*>/i, `<style>${updatedContent}</style>`);
  }
  html = html.replace('<head>', `<head>\n  ${base}`);
  iframe.srcdoc = html;

  badge.textContent = 'Preview updated — save to go live';
  badge.classList.add('show');
  setTimeout(() => badge.classList.remove('show'), 3000);
}

// ── Ask AI ────────────────────────────────────────────────────────────────────
async function askAI() {
  const input = document.getElementById('ai-input');
  const request = input.value.trim();
  if (!request || isBusy) return;

  setBusy(true);
  addMsg(request, 'user');
  const thinking = addMsg('Thinking…', 'ai thinking');
  input.value = '';

  const content = document.getElementById('code-editor').value;
  const data = await api({ action: 'ai_edit', file: currentFile, content, request });

  thinking.remove();
  if (data.error) {
    addMsg('Error: ' + data.error, 'ai error');
  } else {
    document.getElementById('code-editor').value = data.content;
    await updatePreview(currentFile, data.content);
    addMsg('Done! Preview updated — hit Save to push it live.', 'ai success');
  }
  setBusy(false);
}

document.getElementById('ai-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) askAI();
});

// ── Save file ─────────────────────────────────────────────────────────────────
async function saveFile() {
  if (isBusy) return;
  setBusy(true);
  const content = document.getElementById('code-editor').value;
  const data = await api({ action: 'save', file: currentFile, content });
  setBusy(false);
  if (data.ok) {
    showToast('Saved! Going live…', 'ok');
    // Reload iframe from live server after a brief delay
    setTimeout(() => {
      const iframe = document.getElementById('preview-iframe');
      iframe.removeAttribute('srcdoc');
      iframe.src = '/' + getPreviewFile(currentFile) + '?' + Date.now();
    }, 800);
  } else {
    showToast('Save failed: ' + (data.error ?? 'Unknown error'), 'err');
  }
}

// ── Version history ───────────────────────────────────────────────────────────
async function openHistory() {
  document.getElementById('history-modal').classList.add('open');
  const list = document.getElementById('backup-list');
  list.innerHTML = '<div class="no-backups">Loading…</div>';
  const data = await api({ action: 'list_backups' });
  if (!data.backups || data.backups.length === 0) {
    list.innerHTML = '<div class="no-backups">No backups yet. Every time you save, a snapshot is created here.</div>';
    return;
  }
  list.innerHTML = '';
  data.backups.forEach(b => {
    const nice = formatBackupDate(b);
    const item = document.createElement('div');
    item.className = 'backup-item';
    item.innerHTML = `
      <div class="backup-label">
        ${nice}
        <small>${b}</small>
      </div>
      <div class="backup-actions">
        <button class="btn-restore" onclick="restoreBackup('${b}')">Restore to Editor</button>
      </div>`;
    list.appendChild(item);
  });
}

function closeHistory() {
  document.getElementById('history-modal').classList.remove('open');
}

async function restoreBackup(backup) {
  const data = await api({ action: 'restore', backup, file: currentFile });
  if (data.error) {
    showToast('Restore failed: ' + data.error, 'err');
    return;
  }
  document.getElementById('code-editor').value = data.content;
  await updatePreview(currentFile, data.content);
  closeHistory();
  showToast('Backup loaded — preview updated. Hit Save to apply.', 'ok');
}

document.getElementById('history-modal').addEventListener('click', e => {
  if (e.target === document.getElementById('history-modal')) closeHistory();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
async function api(params) {
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  try {
    const res = await fetch('admin.php', { method: 'POST', body: form });
    return await res.json();
  } catch (e) {
    return { error: e.message };
  }
}

function addMsg(text, cls) {
  const log = document.getElementById('chat-log');
  const div = document.createElement('div');
  div.className = 'msg msg-' + cls.replace('ai ', 'ai ').replace(' ', ' msg-');
  // Normalize classes
  const parts = cls.split(' ');
  div.className = 'msg';
  parts.forEach(p => div.classList.add('msg-' + p));
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  return div;
}

function setBusy(busy) {
  isBusy = busy;
  document.getElementById('btn-ask').disabled = busy;
  document.getElementById('btn-save').disabled = busy;
  document.getElementById('btn-ask').textContent = busy ? '...' : 'Ask AI';
}

function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type + ' show';
  setTimeout(() => t.classList.remove('show'), 3500);
}

function formatBackupDate(b) {
  // Format: YYYY-MM-DD-HHmmss
  const m = b.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})(\d{2})$/);
  if (!m) return b;
  const d = new Date(+m[1], +m[2]-1, +m[3], +m[4], +m[5], +m[6]);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// ── Get preview file for a given editable file ────────────────────────────────
// nav.php, footer.php, style.css, script.js all preview as the home page
function getPreviewFile(file) {
  const shared = ['nav.php', 'footer.php', 'style.css', 'script.js'];
  return shared.includes(file) ? 'index.php' : file;
}

// ── New page ──────────────────────────────────────────────────────────────────
async function newPage() {
  const name = prompt('Page name — use words or phrases, spaces are fine:\ne.g. "back pain", "herniated disc", "about us"');
  if (!name) return;
  const clean = name.toLowerCase().trim().replace(/[\s_]+/g, '-').replace(/[^a-z0-9\-]/g, '').replace(/^-+|-+$/g, '');
  if (!clean) { showToast('Invalid name', 'err'); return; }
  const data = await api({ action: 'new_page', name: clean });
  if (data.error) { showToast(data.error, 'err'); return; }
  // Add tab and switch to it
  const tabs = document.getElementById('tab-list');
  const newTab = document.createElement('button');
  newTab.className = 'tab active';
  newTab.dataset.file = data.file;
  newTab.textContent = data.file;
  newTab.addEventListener('click', () => switchTab(newTab, data.file));
  tabs.insertBefore(newTab, tabs.querySelector('.tab-new'));
  document.querySelectorAll('.tab:not(.tab-new)').forEach(t => { if (t !== newTab) t.classList.remove('active'); });
  currentFile = data.file;
  document.getElementById('code-editor').value = '';
  document.getElementById('editor-file-label').textContent = 'Live Preview';
  addMsg(`New page "${data.file}" created with nav and footer already in place! Just tell me what content to put on it — I only need to write the middle section.`, 'ai');
}

function switchTab(tab, file) {
  if (isBusy) return;
  document.querySelectorAll('.tab:not(.tab-new)').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  currentFile = file;
  loadFile(file);
  if (!showingCode) {
    document.getElementById('editor-file-label').textContent = 'Live Preview';
  } else {
    document.getElementById('editor-file-label').textContent = file;
  }
  // Point preview at the correct page
  const iframe = document.getElementById('preview-iframe');
  iframe.removeAttribute('srcdoc');
  iframe.src = '/' + getPreviewFile(file) + '?' + Date.now();
}

// ── Init ──────────────────────────────────────────────────────────────────────
// Pre-load the current file into the hidden editor so AI has content to work with
loadFile('index.html');
// Hide code editor by default (preview iframe is shown)
document.getElementById('code-editor').style.display = 'none';
</script>
</body>
</html>
