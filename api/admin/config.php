<?php
/**
 * Admin endpoint — update config values.
 *
 * PUT /api/admin/config.php
 *   Body: { exam_date_paper1, exam_date_paper2, quiz_size, mock_size }
 *   Updates specified keys in the config table.
 *
 * @package TLevelQuiz\API\Admin
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth.php';

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body    = json_decode(file_get_contents('php://input'), true) ?? [];
$allowed = ['exam_date_paper1', 'exam_date_paper2', 'quiz_size', 'mock_size'];
$updated = 0;

$stmt = $pdo->prepare(
    "INSERT INTO config (key_name, key_value) VALUES (?,?)
     ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)"
);

foreach ($allowed as $key) {
    if (array_key_exists($key, $body)) {
        $stmt->execute([$key, (string)$body[$key]]);
        $updated++;
    }
}

jsonResponse(['updated' => $updated]);
