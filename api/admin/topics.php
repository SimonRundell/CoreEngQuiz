<?php
/**
 * Admin CRUD endpoint for topics.
 *
 * GET   /api/admin/topics.php         — all topics
 * POST  /api/admin/topics.php         — create topic (sort_order auto-assigned)
 * PUT   /api/admin/topics.php?id=N    — update topic fields
 * PATCH /api/admin/topics.php         — bulk reorder { order: [{id, sort_order}] }
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
         ORDER BY t.sort_order, t.paper, t.id"
    )->fetchAll();
    jsonResponse($rows);
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST') {
    $code  = trim($body['code']   ?? '');
    $title = trim($body['title']  ?? '');
    $paper = (int)($body['paper'] ?? 0);

    if ($code === '' || $title === '' || !in_array($paper, [1, 2], true)) {
        jsonResponse(['error' => 'code, title and paper (1 or 2) required'], 422);
    }

    $maxSort = (int)$pdo->query("SELECT COALESCE(MAX(sort_order), 0) FROM topics")->fetchColumn();

    $stmt = $pdo->prepare(
        "INSERT INTO topics (code, title, paper, sort_order) VALUES (?,?,?,?)"
    );
    $stmt->execute([$code, $title, $paper, $maxSort + 1]);
    jsonResponse(['id' => (int)$pdo->lastInsertId()], 201);
}

if ($method === 'PATCH') {
    $order = $body['order'] ?? [];
    if (!is_array($order) || empty($order)) {
        jsonResponse(['error' => 'order array required'], 422);
    }

    $stmt = $pdo->prepare("UPDATE topics SET sort_order = ? WHERE id = ?");
    foreach ($order as $item) {
        $id   = (int)($item['id']         ?? 0);
        $sort = (int)($item['sort_order'] ?? 0);
        if ($id > 0) {
            $stmt->execute([$sort, $id]);
        }
    }
    jsonResponse(['updated' => count($order)]);
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
