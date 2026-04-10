<?php
session_start();
require_once __DIR__ . '/../lib/auth.php';
requireAdminAuth();

require_once __DIR__ . '/../lib/db.php';
require_once __DIR__ . '/../lib/claude.php';

$db = getDB();
$ym = date('Y-m');

// Handle suspend/activate/cancel toggle
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'], $_POST['client_id'])) {
    $allowed = ['active', 'suspended', 'cancelled'];
    $newStatus = $_POST['action'];
    if (in_array($newStatus, $allowed, true)) {
        $db->prepare('UPDATE clients SET status = ? WHERE id = ?')
           ->execute([$newStatus, (int)$_POST['client_id']]);
    }
    header('Location: /hub/admin/');
    exit;
}

// Fetch all clients + this-month usage
$clients = $db->query(
    "SELECT c.*, COALESCE(u.tokens_used, 0) AS tokens_used,
                 COALESCE(u.requests_count, 0) AS requests_count
     FROM clients c
     LEFT JOIN usage u ON u.client_id = c.id AND u.year_month = '$ym'
     ORDER BY c.name"
)->fetchAll();

// Aggregate totals
$totalTokens   = array_sum(array_column($clients, 'tokens_used'));
$totalRequests = array_sum(array_column($clients, 'requests_count'));

$statusColors = ['active' => '#22c55e', 'suspended' => '#f59e0b', 'cancelled' => '#ef4444'];

function pct(int $used, int $limit): string {
    if ($limit <= 0) return '0';
    return min(100, round($used / $limit * 100)) . '%';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hub Admin Dashboard</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0;
         padding: 2rem; min-height: 100vh; }
  header { display: flex; align-items: center; justify-content: space-between;
           margin-bottom: 2rem; }
  header h1 { font-size: 1.4rem; font-weight: 700; color: #f1f5f9; }
  .actions { display: flex; gap: 0.75rem; align-items: center; }
  a.btn { padding: 0.5rem 1rem; background: #6366f1; color: #fff; border-radius: 6px;
          text-decoration: none; font-size: 0.875rem; font-weight: 500; }
  a.btn:hover { background: #4f46e5; }
  a.btn-ghost { background: transparent; border: 1px solid #334155; color: #94a3b8; }
  a.btn-ghost:hover { background: #1e293b; color: #e2e8f0; }

  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
           gap: 1rem; margin-bottom: 2rem; }
  .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px;
               padding: 1.25rem; }
  .stat-card .label { font-size: 0.75rem; color: #64748b; text-transform: uppercase;
                      letter-spacing: 0.05em; margin-bottom: 0.4rem; }
  .stat-card .value { font-size: 1.75rem; font-weight: 700; color: #f1f5f9; }
  .stat-card .sub { font-size: 0.75rem; color: #64748b; margin-top: 0.25rem; }

  table { width: 100%; border-collapse: collapse; }
  thead th { text-align: left; font-size: 0.75rem; text-transform: uppercase;
             letter-spacing: 0.05em; color: #64748b; padding: 0.6rem 1rem;
             border-bottom: 1px solid #1e293b; }
  tbody tr { border-bottom: 1px solid #1e293b; }
  tbody tr:hover { background: #1e293b; }
  td { padding: 0.85rem 1rem; font-size: 0.875rem; vertical-align: middle; }

  .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 999px;
           font-size: 0.7rem; font-weight: 600; text-transform: capitalize; }

  .bar-wrap { width: 120px; background: #0f172a; border-radius: 4px; height: 6px;
              display: inline-block; vertical-align: middle; }
  .bar { height: 6px; border-radius: 4px; background: #6366f1; }
  .bar.warn { background: #f59e0b; }
  .bar.danger { background: #ef4444; }

  .row-actions form { display: inline; }
  .row-actions button { padding: 0.25rem 0.6rem; font-size: 0.75rem; border-radius: 4px;
                        border: 1px solid #334155; background: transparent;
                        color: #94a3b8; cursor: pointer; }
  .row-actions button:hover { background: #1e293b; color: #e2e8f0; }
  .row-actions a { color: #6366f1; text-decoration: none; font-size: 0.75rem;
                   padding: 0.25rem 0.6rem; border: 1px solid #334155;
                   border-radius: 4px; }
  .row-actions a:hover { background: #1e293b; }

  .month-label { color: #64748b; font-size: 0.875rem; margin-bottom: 1rem; }
  .table-wrap { background: #1e293b; border: 1px solid #334155; border-radius: 10px;
                overflow: hidden; }
  .logout { color: #64748b; font-size: 0.8rem; text-decoration: none; }
  .logout:hover { color: #94a3b8; }
</style>
</head>
<body>
<header>
  <h1>Hub Admin</h1>
  <div class="actions">
    <a href="/hub/admin/client.php" class="btn">+ New Client</a>
    <a href="/hub/admin/logout.php" class="logout">Sign out</a>
  </div>
</header>

<div class="stats">
  <div class="stat-card">
    <div class="label">Active Clients</div>
    <div class="value"><?= count(array_filter($clients, fn($c) => $c['status'] === 'active')) ?></div>
    <div class="sub"><?= count($clients) ?> total</div>
  </div>
  <div class="stat-card">
    <div class="label">Tokens This Month</div>
    <div class="value"><?= number_format($totalTokens) ?></div>
    <div class="sub"><?= number_format($totalRequests) ?> requests</div>
  </div>
  <div class="stat-card">
    <div class="label">Est. Cost This Month</div>
    <div class="value">$<?= number_format(array_sum(array_map(
        fn($c) => estimateCost((int)$c['tokens_used'], $c['claude_model'] ?? 'claude-sonnet-4-6'),
        $clients
    )), 2) ?></div>
    <div class="sub">across all clients</div>
  </div>
  <div class="stat-card">
    <div class="label">Resets</div>
    <div class="value" style="font-size:1.2rem"><?= date('M j') ?></div>
    <div class="sub">next: <?= date('M j', strtotime('first day of next month')) ?></div>
  </div>
</div>

<p class="month-label"><?= date('F Y') ?> usage</p>
<div class="table-wrap">
<table>
  <thead>
    <tr>
      <th>Client</th>
      <th>Domain</th>
      <th>Status</th>
      <th>Model</th>
      <th>Tokens Used</th>
      <th>Est. Cost</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
  <?php foreach ($clients as $c):
    $pct = $c['monthly_token_limit'] > 0
        ? min(100, round($c['tokens_used'] / $c['monthly_token_limit'] * 100))
        : 0;
    $barClass = $pct >= 90 ? 'danger' : ($pct >= 70 ? 'warn' : '');
    $statusColor = $statusColors[$c['status']] ?? '#64748b';
    $cost = estimateCost((int)$c['tokens_used'], $c['claude_model'] ?? 'claude-sonnet-4-6');
  ?>
  <tr>
    <td><strong><?= htmlspecialchars($c['name']) ?></strong></td>
    <td style="color:#64748b"><?= htmlspecialchars($c['domain']) ?></td>
    <td>
      <span class="badge" style="background:<?= $statusColor ?>22;color:<?= $statusColor ?>">
        <?= $c['status'] ?>
      </span>
    </td>
    <td style="color:#64748b;font-size:0.75rem"><?= htmlspecialchars($c['claude_model'] ?? '') ?></td>
    <td>
      <?= number_format($c['tokens_used']) ?> / <?= number_format($c['monthly_token_limit']) ?>
      <br>
      <span class="bar-wrap" style="margin-top:4px">
        <span class="bar <?= $barClass ?>" style="width:<?= $pct ?>%"></span>
      </span>
      <span style="color:#64748b;font-size:0.7rem;margin-left:4px"><?= $pct ?>%</span>
    </td>
    <td>$<?= number_format($cost, 4) ?></td>
    <td class="row-actions">
      <a href="/hub/admin/client.php?id=<?= $c['id'] ?>">Edit</a>
      <?php if ($c['status'] === 'active'): ?>
        <form method="POST">
          <input type="hidden" name="client_id" value="<?= $c['id'] ?>">
          <input type="hidden" name="action" value="suspended">
          <button type="submit">Suspend</button>
        </form>
      <?php elseif ($c['status'] === 'suspended'): ?>
        <form method="POST">
          <input type="hidden" name="client_id" value="<?= $c['id'] ?>">
          <input type="hidden" name="action" value="active">
          <button type="submit" style="color:#22c55e">Activate</button>
        </form>
      <?php endif; ?>
    </td>
  </tr>
  <?php endforeach; ?>
  <?php if (empty($clients)): ?>
  <tr><td colspan="7" style="text-align:center;color:#64748b;padding:2rem">
    No clients yet — <a href="/hub/admin/client.php" style="color:#6366f1">add one</a>.
  </td></tr>
  <?php endif; ?>
  </tbody>
</table>
</div>
</body>
</html>
