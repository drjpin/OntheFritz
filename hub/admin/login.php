<?php
session_start();

if (isset($_SESSION['hub_admin'])) {
    header('Location: /hub/admin/');
    exit;
}

require_once __DIR__ . '/../config.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $password = $_POST['password'] ?? '';
    if (password_verify($password, HUB_ADMIN_PASSWORD)) {
        session_regenerate_id(true);
        $_SESSION['hub_admin'] = true;
        header('Location: /hub/admin/');
        exit;
    }
    $error = 'Invalid password.';
    // Brief delay to slow brute-force
    sleep(1);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hub Admin Login</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0;
         display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px;
          padding: 2.5rem; width: 100%; max-width: 380px; }
  h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 1.75rem; color: #f1f5f9; }
  label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem; }
  input[type=password] { width: 100%; padding: 0.6rem 0.85rem; background: #0f172a;
                         border: 1px solid #334155; border-radius: 6px; color: #f1f5f9;
                         font-size: 1rem; outline: none; }
  input[type=password]:focus { border-color: #6366f1; }
  button { margin-top: 1.25rem; width: 100%; padding: 0.7rem;
           background: #6366f1; color: #fff; border: none; border-radius: 6px;
           font-size: 1rem; cursor: pointer; font-weight: 500; }
  button:hover { background: #4f46e5; }
  .error { margin-top: 1rem; padding: 0.6rem 0.85rem; background: #450a0a;
           border: 1px solid #7f1d1d; border-radius: 6px; color: #fca5a5;
           font-size: 0.875rem; }
</style>
</head>
<body>
<div class="card">
  <h1>Hub Admin</h1>
  <form method="POST">
    <label for="password">Password</label>
    <input type="password" id="password" name="password" autofocus required>
    <?php if ($error): ?>
      <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <button type="submit">Sign in</button>
  </form>
</div>
</body>
</html>
