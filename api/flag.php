<?php
/**
 * Public endpoint — student question flagging.
 *
 * POST /api/flag.php
 *   Body: { question_id, reason }
 *   Marks a question as flagged with the student's reason.
 *
 * @package TLevelQuiz\API
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$body       = json_decode(file_get_contents('php://input'), true) ?? [];
$questionId = (int)($body['question_id'] ?? 0);
$reason     = trim($body['reason'] ?? '');

if ($questionId === 0) {
    jsonResponse(['error' => 'question_id required'], 400);
}

$pdo  = getDB();
$stmt = $pdo->prepare(
    "UPDATE questions SET flagged=1, flag_reason=? WHERE id=? AND active=1"
);
$stmt->execute([$reason ?: null, $questionId]);

jsonResponse(['flagged' => $stmt->rowCount() > 0]);
