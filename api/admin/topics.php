<?php
/**
 * Admin CRUD endpoint for topics.
 *
 * GET  /api/admin/topics.php         — all topics
 * POST /api/admin/topics.php         — create topic
 * PUT  /api/admin/topics.php?id=N    — update topic
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
        "SELECT t.*, COUNT(q.id) AS question_count
         FROM topics t
         LEFT JOIN questions q ON q.topic_id = t.id AND q.active = 1
         GROUP BY t.id
         ORDER BY t.paper, t.sort_order, t.id"
    )->fetchAll();
    jsonResponse($rows);
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST') {
    $code  = trim($body['code']   ?? '');
    $title = trim($body['title']  ?? '');
    $paper = (int)($body['paper'] ?? 0);
    $sort  = (int)($body['sort_order'] ?? 0);

    if ($code === '' || $title === '' || !in_array($paper, [1, 2], true)) {
        jsonResponse(['error' => 'code, title and paper (1 or 2) required'], 422);
    }

    $stmt = $pdo->prepare(
        "INSERT INTO topics (code, title, paper, sort_order) VALUES (?,?,?,?)"
    );
    $stmt->execute([$code, $title, $paper, $sort]);
    jsonResponse(['id' => (int)$pdo->lastInsertId()], 201);
}

if ($method === 'PUT') {
    $id    = (int)($_GET['id'] ?? 0);
    $title = trim($body['title']      ?? '');
    $paper = (int)($body['paper']     ?? 0);
    $sort  = (int)($body['sort_order'] ?? 0);
    $active = isset($body['active']) ? (int)$body['active'] : 1;

    if ($id === 0 || $title === '') {
        jsonResponse(['error' => 'id and title required'], 422);
    }

    $stmt = $pdo->prepare(
        "UPDATE topics SET title=?, paper=?, sort_order=?, active=? WHERE id=?"
    );
    $stmt->execute([$title, $paper, $sort, $active, $id]);
    jsonResponse(['updated' => $stmt->rowCount() > 0]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
