<?php
// One-time setup script — creates config.php then deletes itself.
// Visit this page once, fill in the form, then it's gone.

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = trim($_POST['password'] ?? '');
    $api_key  = trim($_POST['api_key'] ?? '');
    $errors   = [];

    if (!$password) $errors[] = 'Admin password is required.';
    if (!$api_key)  $errors[] = 'Anthropic API key is required.';
    if ($api_key && !str_starts_with($api_key, 'sk-ant-')) $errors[] = 'API key should start with sk-ant-';

    if (empty($errors)) {
        $config = "<?php\n// Admin configuration — created by setup.php\ndefine('ADMIN_PASSWORD', " . var_export($password, true) . ");\ndefine('ANTHROPIC_API_KEY', " . var_export($api_key, true) . ");\n";

        if (file_put_contents(__DIR__ . '/config.php', $config) === false) {
            $errors[] = 'Could not write config.php — check folder permissions.';
        } else {
            // Self-destruct
            unlink(__FILE__);
            header('Location: admin.php');
            exit;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Site Setup</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0d1117; color: #e6edf3; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .box { background: #161b22; border: 1px solid #30363d; border-radius: 12px; padding: 40px; width: 100%; max-width: 420px; }
    h1 { font-size: 22px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    p { font-size: 14px; color: #8b949e; margin-bottom: 28px; line-height: 1.6; }
    label { display: block; font-size: 13px; font-weight: 600; color: #8b949e; margin-bottom: 6px; margin-top: 18px; }
    input { width: 100%; padding: 10px 14px; background: #0d1117; border: 1px solid #30363d; border-radius: 6px; color: #e6edf3; font-size: 15px; outline: none; transition: border-color 0.2s; }
    input:focus { border-color: #388bfd; }
    button { width: 100%; margin-top: 24px; padding: 11px; background: #238636; border: none; border-radius: 6px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
    button:hover { background: #2ea043; }
    .errors { margin-top: 16px; padding: 12px 14px; background: rgba(248,81,73,0.1); border: 1px solid rgba(248,81,73,0.4); border-radius: 6px; font-size: 13px; color: #f85149; }
    .errors li { margin-left: 16px; margin-top: 4px; }
    .notice { margin-top: 20px; padding: 10px 14px; background: rgba(56,139,253,0.1); border: 1px solid rgba(56,139,253,0.4); border-radius: 6px; font-size: 12px; color: #79c0ff; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="box">
    <h1>One-Time Setup</h1>
    <p>Creates your <code>config.php</code> on the server, then this page deletes itself.</p>
    <form method="POST">
      <label for="password">Admin Password</label>
      <input type="password" id="password" name="password" placeholder="Choose a strong password" value="<?= htmlspecialchars($_POST['password'] ?? '') ?>" />

      <label for="api_key">Anthropic API Key</label>
      <input type="text" id="api_key" name="api_key" placeholder="sk-ant-..." value="<?= htmlspecialchars($_POST['api_key'] ?? '') ?>" />

      <button type="submit">Create Config &amp; Go to Admin</button>

      <?php if (!empty($errors)): ?>
        <div class="errors">
          <ul><?php foreach ($errors as $e): ?><li><?= htmlspecialchars($e) ?></li><?php endforeach; ?></ul>
        </div>
      <?php endif; ?>

      <div class="notice">
        Your API key is written only to the server — it never touches git or any external service.
        This page will self-destruct after setup.
      </div>
    </form>
  </div>
</body>
</html>
