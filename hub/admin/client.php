<?php
session_start();
require_once __DIR__ . '/../lib/auth.php';
requireAdminAuth();

require_once __DIR__ . '/../lib/db.php';

$db = getDB();
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$client = null;
$errors = [];
$saved = false;
$newKey = null;

// Load existing client if editing
if ($id) {
    $stmt = $db->prepare('SELECT * FROM clients WHERE id = ?');
    $stmt->execute([$id]);
    $client = $stmt->fetch();
    if (!$client) {
        header('Location: /hub/admin/');
        exit;
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? 'save';

    // Regenerate key action
    if ($action === 'regen_key' && $id) {
        $newKey = generateHubKey();
        $db->prepare('UPDATE clients SET hub_api_key = ? WHERE id = ?')->execute([$newKey, $id]);
        $stmt = $db->prepare('SELECT * FROM clients WHERE id = ?');
        $stmt->execute([$id]);
        $client = $stmt->fetch();
    } else {
        // Save / create
        $name    = trim($_POST['name'] ?? '');
        $domain  = trim($_POST['domain'] ?? '');
        $model   = $_POST['claude_model'] ?? 'claude-sonnet-4-6';
        $limit   = max(1, (int)($_POST['monthly_token_limit'] ?? 150000));
        $status  = $_POST['status'] ?? 'active';
        $stripeC = trim($_POST['stripe_customer_id'] ?? '');
        $stripeS = trim($_POST['stripe_subscription_id'] ?? '');
        $notes   = trim($_POST['notes'] ?? '');

        $allowed_models = ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'];
        $allowed_statuses = ['active', 'suspended', 'cancelled'];

        if (!$name)   $errors[] = 'Name is required.';
        if (!$domain) $errors[] = 'Domain is required.';
        if (!in_array($model, $allowed_models, true))  $errors[] = 'Invalid model.';
        if (!in_array($status, $allowed_statuses, true)) $errors[] = 'Invalid status.';

        if (empty($errors)) {
            if ($id) {
                $db->prepare(
                    'UPDATE clients SET name=?, domain=?, claude_model=?, monthly_token_limit=?,
                     status=?, stripe_customer_id=?, stripe_subscription_id=?, notes=? WHERE id=?'
                )->execute([$name, $domain, $model, $limit, $status,
                             $stripeC ?: null, $stripeS ?: null, $notes ?: null, $id]);
                $saved = true;
                $stmt = $db->prepare('SELECT * FROM clients WHERE id = ?');
                $stmt->execute([$id]);
                $client = $stmt->fetch();
            } else {
                $key = generateHubKey();
                $db->prepare(
                    'INSERT INTO clients (name, domain, hub_api_key, claude_model,
                     monthly_token_limit, status, stripe_customer_id, stripe_subscription_id, notes)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
                )->execute([$name, $domain, $key, $model, $limit, $status,
                             $stripeC ?: null, $stripeS ?: null, $notes ?: null]);
                $newId = $db->lastInsertId();
                $newKey = $key;
                header("Location: /hub/admin/client.php?id=$newId&created=1");
                exit;
            }
        } else {
            // Re-populate form on error
            $client = compact('name', 'domain', 'model', 'limit', 'status',
                              'stripeC', 'stripeS', 'notes');
            $client['claude_model'] = $model;
            $client['monthly_token_limit'] = $limit;
            $client['stripe_customer_id'] = $stripeC;
            $client['stripe_subscription_id'] = $stripeS;
        }
    }
}

$isNew = !$id;
$title = $isNew ? 'New Client' : 'Edit Client';
$justCreated = isset($_GET['created']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title><?= $title ?> — Hub Admin</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0;
         padding: 2rem; min-height: 100vh; }
  header { display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem; }
  header a { color: #6366f1; text-decoration: none; font-size: 0.875rem; }
  header a:hover { text-decoration: underline; }
  header h1 { font-size: 1.3rem; font-weight: 700; color: #f1f5f9; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px;
          padding: 2rem; max-width: 700px; }
  .field { margin-bottom: 1.25rem; }
  label { display: block; font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.4rem; }
  input[type=text], input[type=number], select, textarea {
    width: 100%; padding: 0.6rem 0.85rem; background: #0f172a;
    border: 1px solid #334155; border-radius: 6px; color: #f1f5f9;
    font-size: 0.9rem; outline: none; font-family: inherit; }
  input:focus, select:focus, textarea:focus { border-color: #6366f1; }
  textarea { resize: vertical; min-height: 80px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  .actions { display: flex; gap: 0.75rem; margin-top: 1.5rem; flex-wrap: wrap; }
  button.primary { padding: 0.6rem 1.25rem; background: #6366f1; color: #fff;
                   border: none; border-radius: 6px; font-size: 0.9rem; cursor: pointer; font-weight: 500; }
  button.primary:hover { background: #4f46e5; }
  button.danger { padding: 0.6rem 1.25rem; background: transparent;
                  border: 1px solid #7f1d1d; color: #fca5a5; border-radius: 6px;
                  font-size: 0.9rem; cursor: pointer; }
  button.danger:hover { background: #450a0a; }
  .key-box { background: #0f172a; border: 1px solid #334155; border-radius: 6px;
             padding: 0.75rem 1rem; font-family: monospace; font-size: 0.85rem;
             word-break: break-all; color: #a5f3fc; margin-top: 0.5rem; }
  .notice { padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.875rem;
            margin-bottom: 1.5rem; }
  .notice.success { background: #052e16; border: 1px solid #166534; color: #86efac; }
  .notice.warning { background: #431407; border: 1px solid #9a3412; color: #fdba74; }
  .error-list { background: #450a0a; border: 1px solid #7f1d1d; border-radius: 6px;
                padding: 0.75rem 1rem; margin-bottom: 1.5rem; color: #fca5a5; font-size: 0.875rem; }
  .error-list li { margin-left: 1rem; }
  .divider { border: none; border-top: 1px solid #334155; margin: 1.5rem 0; }
  .section-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;
                   color: #64748b; margin-bottom: 1rem; }
</style>
</head>
<body>
<header>
  <a href="/hub/admin/">&larr; Dashboard</a>
  <h1><?= $title ?></h1>
</header>

<div class="card">
<?php if (!empty($errors)): ?>
  <div class="error-list"><ul><?php foreach ($errors as $e): ?><li><?= htmlspecialchars($e) ?></li><?php endforeach; ?></ul></div>
<?php endif; ?>

<?php if ($saved): ?>
  <div class="notice success">Client updated.</div>
<?php endif; ?>

<?php if ($justCreated || $newKey): ?>
  <div class="notice warning">
    <strong>Save this hub key now</strong> — it won't be shown again.
    <div class="key-box"><?= htmlspecialchars($newKey ?? $client['hub_api_key'] ?? '') ?></div>
  </div>
<?php endif; ?>

<form method="POST">
  <input type="hidden" name="action" value="save">

  <p class="section-title">Client Info</p>
  <div class="row">
    <div class="field">
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required value="<?= htmlspecialchars($client['name'] ?? '') ?>">
    </div>
    <div class="field">
      <label for="domain">Domain</label>
      <input type="text" id="domain" name="domain" required placeholder="example.com" value="<?= htmlspecialchars($client['domain'] ?? '') ?>">
    </div>
  </div>

  <div class="row">
    <div class="field">
      <label for="status">Status</label>
      <select id="status" name="status">
        <?php foreach (['active', 'suspended', 'cancelled'] as $s): ?>
          <option value="<?= $s ?>" <?= ($client['status'] ?? 'active') === $s ? 'selected' : '' ?>><?= ucfirst($s) ?></option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="field">
      <label for="claude_model">Model</label>
      <select id="claude_model" name="claude_model">
        <?php foreach (['claude-sonnet-4-6', 'claude-haiku-4-5-20251001', 'claude-opus-4-6'] as $m): ?>
          <option value="<?= $m ?>" <?= ($client['claude_model'] ?? 'claude-sonnet-4-6') === $m ? 'selected' : '' ?>><?= $m ?></option>
        <?php endforeach; ?>
      </select>
    </div>
  </div>

  <div class="field">
    <label for="monthly_token_limit">Monthly Token Limit</label>
    <input type="number" id="monthly_token_limit" name="monthly_token_limit" min="1000" step="1000"
           value="<?= (int)($client['monthly_token_limit'] ?? 150000) ?>">
  </div>

  <hr class="divider">
  <p class="section-title">Stripe (optional)</p>
  <div class="row">
    <div class="field">
      <label for="stripe_customer_id">Customer ID</label>
      <input type="text" id="stripe_customer_id" name="stripe_customer_id" placeholder="cus_..."
             value="<?= htmlspecialchars($client['stripe_customer_id'] ?? '') ?>">
    </div>
    <div class="field">
      <label for="stripe_subscription_id">Subscription ID</label>
      <input type="text" id="stripe_subscription_id" name="stripe_subscription_id" placeholder="sub_..."
             value="<?= htmlspecialchars($client['stripe_subscription_id'] ?? '') ?>">
    </div>
  </div>

  <div class="field">
    <label for="notes">Notes</label>
    <textarea id="notes" name="notes"><?= htmlspecialchars($client['notes'] ?? '') ?></textarea>
  </div>

  <div class="actions">
    <button type="submit" class="primary">Save Client</button>
    <a href="/hub/admin/" style="color:#64748b;font-size:0.875rem;padding:0.6rem">Cancel</a>
  </div>
</form>

<?php if ($id): ?>
  <hr class="divider">
  <p class="section-title">Hub API Key</p>
  <?php if (!$newKey): ?>
    <p style="color:#64748b;font-size:0.875rem;margin-bottom:1rem">
      The key is stored hashed — to reveal a new one, regenerate it below.
      The client's <code>config.php</code> will need updating.
    </p>
  <?php endif; ?>
  <form method="POST" onsubmit="return confirm('This will invalidate the current key. Continue?')">
    <input type="hidden" name="action" value="regen_key">
    <button type="submit" class="danger">Regenerate Key</button>
  </form>
<?php endif; ?>
</div>
</body>
</html>
