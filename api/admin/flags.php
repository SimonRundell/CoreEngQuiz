<?php
/**
 * Admin endpoint — flagged question review.
 *
 * GET /api/admin/flags.php
 *   Returns all questions where flagged = 1, with topic title.
 *
 * PUT /api/admin/flags.php?id=N
 *   Body: { action: 'dismiss' | 'deactivate' }
 *   Clears the flag, optionally deactivating the question.
 *
 * @package TLevelQuiz\API\Admin
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $rows = $pdo->query(
        "SELECT q.*, t.title AS topic_title
         FROM questions q
         JOIN topics t ON t.id = q.topic_id
         WHERE q.flagged = 1
         ORDER BY q.id DESC"
    )->fetchAll();
    jsonResponse($rows);
}

if ($method === 'PUT') {
    $id   = (int)($_GET['id'] ?? 0);
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $body['action'] ?? 'dismiss';

    if ($id === 0) {
        jsonResponse(['error' => 'id required'], 400);
    }

    if ($action === 'deactivate') {
        $stmt = $pdo->prepare(
            "UPDATE questions SET flagged=0, flag_reason=NULL, active=0 WHERE id=?"
        );
    } else {
        $stmt = $pdo->prepare(
            "UPDATE questions SET flagged=0, flag_reason=NULL WHERE id=?"
        );
    }
    $stmt->execute([$id]);
    jsonResponse(['updated' => $stmt->rowCount() > 0]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
