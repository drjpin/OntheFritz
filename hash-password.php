<?php
// One-time password hasher — self-destructs after use.
// Visit this page, enter your current admin password, and it will
// hash it and update config.php automatically, then delete itself.

$config_file = __DIR__ . '/config.php';
$done  = false;
$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pw = $_POST['password'] ?? '';
    if (strlen($pw) < 6) {
        $error = 'Password must be at least 6 characters.';
    } elseif (!file_exists($config_file)) {
        $error = 'config.php not found.';
    } else {
        $hash    = password_hash($pw, PASSWORD_DEFAULT);
        $config  = file_get_contents($config_file);
        // Replace the ADMIN_PASSWORD value whether it's currently plaintext or a previous hash
        $updated = preg_replace(
            "/define\s*\(\s*'ADMIN_PASSWORD'\s*,\s*'[^']*'\s*\)/",
            "define('ADMIN_PASSWORD', '" . addslashes($hash) . "')",
            $config
        );
        if ($updated === $config) {
            $error = 'Could not find ADMIN_PASSWORD in config.php — check the file format.';
        } else {
            file_put_contents($config_file, $updated);
            $done = true;
            unlink(__FILE__); // self-destruct
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Upgrade Admin Password</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0d1117; color: #e6edf3;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .box { background: #161b22; border: 1px solid #30363d; border-radius: 12px;
           padding: 36px; width: 100%; max-width: 400px; }
    h1  { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
    p   { font-size: 14px; color: #8b949e; margin-bottom: 24px; line-height: 1.55; }
    label { display: block; font-size: 13px; font-weight: 600; color: #8b949e; margin-bottom: 6px; }
    input { width: 100%; padding: 10px 14px; background: #0d1117; border: 1px solid #30363d;
            border-radius: 6px; color: #e6edf3; font-size: 15px; outline: none; }
    input:focus { border-color: #388bfd; }
    button { width: 100%; margin-top: 16px; padding: 11px; background: #238636; border: none;
             border-radius: 6px; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
    button:hover { background: #2ea043; }
    .error { margin-top: 14px; padding: 10px 14px; background: rgba(248,81,73,0.1);
             border: 1px solid rgba(248,81,73,0.4); border-radius: 6px; font-size: 13px; color: #f85149; }
    .success { text-align: center; }
    .success .icon { font-size: 48px; margin-bottom: 16px; }
    .success h1 { color: #3fb950; margin-bottom: 10px; }
    .success p  { margin-bottom: 0; }
    .success a  { color: #388bfd; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
<div class="box">
<?php if ($done): ?>
  <div class="success">
    <div class="icon">✅</div>
    <h1>Password upgraded!</h1>
    <p>config.php has been updated with a secure bcrypt hash, and this file has deleted itself.<br><br>
    <a href="admin.php">Go to admin →</a></p>
  </div>
<?php else: ?>
  <h1>Upgrade Admin Password</h1>
  <p>Enter your current admin password. It will be hashed and saved to config.php automatically. This page deletes itself when done.</p>
  <form method="POST">
    <label for="pw">Current admin password</label>
    <input type="password" id="pw" name="password" autofocus autocomplete="current-password" />
    <button type="submit">Hash &amp; Save</button>
    <?php if ($error): ?>
      <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
  </form>
<?php endif; ?>
</div>
</body>
</html>
