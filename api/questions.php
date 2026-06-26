<?php
/**
 * Public endpoint — question retrieval.
 *
 * GET /api/questions.php?topic_id=N&n=10
 *   Returns N random active questions from a single topic.
 *
 * GET /api/questions.php?paper=1&n=30
 *   Returns a balanced set of N questions drawn proportionally from all
 *   active topics in the given paper.
 *
 * @package TLevelQuiz\API
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo = getDB();

$n = max(1, (int)($_GET['n'] ?? 10));

// --- Single-topic quiz ---
if (isset($_GET['topic_id'])) {
    $topicId = (int)$_GET['topic_id'];

    $rows = $pdo->prepare(
        "SELECT id, question_text, option_a, option_b, option_c, option_d,
                correct_index, formula_hint, formula_note, explanation
         FROM questions
         WHERE topic_id = ? AND active = 1
         ORDER BY RAND()
         LIMIT ?"
    );
    $rows->execute([$topicId, $n]);
    jsonResponse($rows->fetchAll());
}

// --- Balanced mock paper ---
if (isset($_GET['paper'])) {
    $paper = (int)$_GET['paper'];

    // Get all active topics for this paper with question counts
    $topics = $pdo->prepare(
        "SELECT t.id, COUNT(q.id) AS cnt
         FROM topics t
         JOIN questions q ON q.topic_id = t.id AND q.active = 1
         WHERE t.paper = ? AND t.active = 1
         GROUP BY t.id
         HAVING cnt > 0
         ORDER BY t.sort_order, t.paper, t.id"
    );
    $topics->execute([$paper]);
    $topics = $topics->fetchAll();

    if (empty($topics)) {
        jsonResponse([], 200);
    }

    $numTopics = count($topics);
    // Base allocation
    $base      = (int)floor($n / $numTopics);
    $remainder = $n - ($base * $numTopics);

    // Distribute remainder to topics with the most questions
    usort($topics, fn($a, $b) => $b['cnt'] - $a['cnt']);
    $allotments = [];
    foreach ($topics as $i => $t) {
        $allotments[$t['id']] = $base + ($i < $remainder ? 1 : 0);
    }

    $questions = [];
    foreach ($allotments as $topicId => $qty) {
        $stmt = $pdo->prepare(
            "SELECT id, question_text, option_a, option_b, option_c, option_d,
                    correct_index, formula_hint, formula_note, explanation
             FROM questions
             WHERE topic_id = ? AND active = 1
             ORDER BY RAND()
             LIMIT ?"
        );
        $stmt->execute([$topicId, $qty]);
        $questions = array_merge($questions, $stmt->fetchAll());
    }

    // Fisher-Yates shuffle of the merged set
    $len = count($questions);
    for ($i = $len - 1; $i > 0; $i--) {
        $j = random_int(0, $i);
        [$questions[$i], $questions[$j]] = [$questions[$j], $questions[$i]];
    }

    jsonResponse(array_values($questions));
}

jsonResponse(['error' => 'Missing topic_id or paper parameter'], 400);
