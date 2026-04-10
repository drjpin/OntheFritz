<?php
require_once __DIR__ . '/../config.php';

function callClaude(array $payload): array {
    $ch = curl_init('https://api.anthropic.com/v1/messages');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_TIMEOUT        => 180,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-api-key: '          . ANTHROPIC_API_KEY,
            'anthropic-version: 2023-06-01',
        ],
    ]);
    $resp     = curl_exec($ch);
    $code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err = curl_error($ch);
    curl_close($ch);

    if (!$resp) return ['error' => 'Request failed: ' . $curl_err, 'code' => 0];
    return ['body' => json_decode($resp, true), 'code' => $code];
}

// Blended token cost estimate per model ($/token, very approximate)
function estimateCost(int $tokens, string $model): float {
    $rates = [
        'claude-sonnet-4-6'          => 0.000006,
        'claude-haiku-4-5-20251001'  => 0.0000008,
        'claude-opus-4-6'            => 0.000040,
    ];
    $rate = $rates[$model] ?? 0.000006;
    return round($tokens * $rate, 4);
}
