<?php
require_once __DIR__ . '/db.php';

function getClientByKey(string $key): ?array {
    if (!$key) return null;
    $stmt = getDB()->prepare(
        'SELECT * FROM clients WHERE hub_api_key = ? AND status = "active" LIMIT 1'
    );
    $stmt->execute([trim($key)]);
    return $stmt->fetch() ?: null;
}

function requireClientAuth(): array {
    $key    = $_SERVER['HTTP_X_HUB_KEY'] ?? '';
    $client = getClientByKey($key);
    if (!$client) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or inactive hub key']);
        exit;
    }
    return $client;
}

function requireAdminAuth(): void {
    if (!isset($_SESSION['hub_admin'])) {
        header('Location: /hub/admin/login.php');
        exit;
    }
}

function generateHubKey(): string {
    return bin2hex(random_bytes(32)); // 64-char hex string
}
