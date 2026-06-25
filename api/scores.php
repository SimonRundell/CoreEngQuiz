<?php
/**
 * Public endpoint — score persistence.
 *
 * GET  /api/scores.php?session=UUID&quiz=topic1
 *   Returns the best (highest pct) score for this session/quiz combination.
 *
 * POST /api/scores.php
 *   Body: { session_key, quiz_key, correct, total, pct, elapsed_seconds, practice_mode }
 *   Stores the score. Only replaces a previous best if pct is higher.
 *
 * @package TLevelQuiz\API
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $session  = trim($_GET['session'] ?? '');
    $quizKey  = trim($_GET['quiz'] ?? '');

    if ($session === '' || $quizKey === '') {
        jsonResponse(['error' => 'Missing session or quiz'], 400);
    }

    $stmt = $pdo->prepare(
        "SELECT correct, total, pct, elapsed_seconds, practice_mode, created_at
         FROM scores
         WHERE session_key = ? AND quiz_key = ?
         ORDER BY pct DESC, created_at DESC
         LIMIT 1"
    );
    $stmt->execute([$session, $quizKey]);
    $row = $stmt->fetch();

    jsonResponse($row ?: null);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $session       = trim($body['session_key']    ?? '');
    $quizKey       = trim($body['quiz_key']       ?? '');
    $correct       = (int)($body['correct']       ?? 0);
    $total         = (int)($body['total']         ?? 0);
    $pct           = (int)($body['pct']           ?? 0);
    $elapsed       = (int)($body['elapsed_seconds'] ?? 0);
    $practiceMode  = (int)($body['practice_mode'] ?? 1);

    if ($session === '' || $quizKey === '' || $total === 0) {
        jsonResponse(['error' => 'Invalid payload'], 400);
    }

    // Only insert if this beats the current best
    $best = $pdo->prepare(
        "SELECT pct FROM scores WHERE session_key = ? AND quiz_key = ? ORDER BY pct DESC LIMIT 1"
    );
    $best->execute([$session, $quizKey]);
    $currentBest = (int)($best->fetchColumn() ?? -1);

    if ($pct >= $currentBest) {
        $ins = $pdo->prepare(
            "INSERT INTO scores (session_key, quiz_key, correct, total, pct, elapsed_seconds, practice_mode)
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $ins->execute([$session, $quizKey, $correct, $total, $pct, $elapsed, $practiceMode]);
    }

    jsonResponse(['stored' => true, 'best_pct' => max($pct, $currentBest)]);
}

jsonResponse(['error' => 'Method not allowed'], 405);
