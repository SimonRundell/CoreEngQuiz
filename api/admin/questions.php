<?php
/**
 * Admin CRUD endpoint for questions.
 *
 * GET    /api/admin/questions.php?topic_id=N   — all questions (inc inactive) for topic
 * POST   /api/admin/questions.php              — create question
 * PUT    /api/admin/questions.php?id=N         — update question
 * DELETE /api/admin/questions.php?id=N         — soft-delete (active = 0)
 *
 * @package TLevelQuiz\API\Admin
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../auth.php';

$pdo    = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// --- GET: list questions for a topic ---
if ($method === 'GET') {
    $topicId = (int)($_GET['topic_id'] ?? 0);
    if ($topicId === 0) {
        jsonResponse(['error' => 'topic_id required'], 400);
    }
    $stmt = $pdo->prepare(
        "SELECT * FROM questions WHERE topic_id = ? ORDER BY active DESC, id ASC"
    );
    $stmt->execute([$topicId]);
    jsonResponse($stmt->fetchAll());
}

// --- Shared body parse ---
$body = json_decode(file_get_contents('php://input'), true) ?? [];

/** Validate and extract question fields from request body. */
function extractFields(array $body): array|false {
    $required = ['topic_id', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_index'];
    foreach ($required as $f) {
        if (!isset($body[$f]) || (string)$body[$f] === '') return false;
    }
    return [
        'topic_id'      => (int)$body['topic_id'],
        'question_text' => trim($body['question_text']),
        'option_a'      => trim($body['option_a']),
        'option_b'      => trim($body['option_b']),
        'option_c'      => trim($body['option_c']),
        'option_d'      => trim($body['option_d']),
        'correct_index' => (int)$body['correct_index'],
        'formula_hint'  => trim($body['formula_hint']  ?? '') ?: null,
        'formula_note'  => trim($body['formula_note']  ?? '') ?: null,
        'explanation'   => trim($body['explanation']   ?? '') ?: null,
        'active'        => isset($body['active']) ? (int)$body['active'] : 1,
    ];
}

// --- POST: create ---
if ($method === 'POST') {
    $f = extractFields($body);
    if (!$f) {
        jsonResponse(['error' => 'Missing required fields'], 422);
    }

    try {
        $stmt = $pdo->prepare(
            "INSERT INTO questions
             (topic_id, question_text, option_a, option_b, option_c, option_d,
              correct_index, formula_hint, formula_note, explanation, active)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)"
        );
        $stmt->execute([
            $f['topic_id'], $f['question_text'],
            $f['option_a'], $f['option_b'], $f['option_c'], $f['option_d'],
            $f['correct_index'], $f['formula_hint'], $f['formula_note'],
            $f['explanation'], $f['active'],
        ]);
        jsonResponse(['id' => (int)$pdo->lastInsertId()], 201);
    } catch (PDOException $e) {
        // Duplicate key on unique constraint
        if ($e->getCode() === '23000') {
            jsonResponse(['error' => 'Duplicate question text in this topic'], 409);
        }
        throw $e;
    }
}

// --- PUT: update ---
if ($method === 'PUT') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonResponse(['error' => 'id required'], 400);
    }
    $f = extractFields($body);
    if (!$f) {
        jsonResponse(['error' => 'Missing required fields'], 422);
    }

    try {
        $stmt = $pdo->prepare(
            "UPDATE questions SET
             topic_id=?, question_text=?, option_a=?, option_b=?, option_c=?, option_d=?,
             correct_index=?, formula_hint=?, formula_note=?, explanation=?, active=?
             WHERE id=?"
        );
        $stmt->execute([
            $f['topic_id'], $f['question_text'],
            $f['option_a'], $f['option_b'], $f['option_c'], $f['option_d'],
            $f['correct_index'], $f['formula_hint'], $f['formula_note'],
            $f['explanation'], $f['active'], $id,
        ]);
        jsonResponse(['updated' => $stmt->rowCount() > 0]);
    } catch (PDOException $e) {
        if ($e->getCode() === '23000') {
            jsonResponse(['error' => 'Duplicate question text in this topic'], 409);
        }
        throw $e;
    }
}

// --- DELETE: hard delete ---
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id === 0) {
        jsonResponse(['error' => 'id required'], 400);
    }
    $stmt = $pdo->prepare("DELETE FROM questions WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(['deleted' => $stmt->rowCount() > 0]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
