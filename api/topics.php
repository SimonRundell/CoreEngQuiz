<?php
/**
 * Public endpoint — topics list.
 *
 * GET /api/topics.php
 *   Returns all active topics with their question counts.
 *
 * @package TLevelQuiz\API
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDB();

$rows = $pdo->query(
    "SELECT t.id, t.code, t.title, t.paper, t.sort_order,
            COUNT(q.id) AS question_count
     FROM topics t
     LEFT JOIN questions q ON q.topic_id = t.id AND q.active = 1
     WHERE t.active = 1
     GROUP BY t.id
     ORDER BY t.paper, t.sort_order, t.id"
)->fetchAll();

jsonResponse($rows);
