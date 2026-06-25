<?php
/**
 * One-time seed script.
 *
 * Imports all topics and questions from questions_data.php into the database.
 * Skips duplicates (IGNORE on INSERT). Run once via CLI:
 *
 *   php api/seed/import.php
 *
 * Delete or move this directory after confirming the import.
 *
 * @package TLevelQuiz\Seed
 * @license CC BY-NC-SA 4.0
 */

// Resolve paths relative to project root (two levels up from seed/)
define('ROOT', dirname(__DIR__, 2));
require_once ROOT . '/api/db.php';

$pdo  = getDB();
$data = require __DIR__ . '/questions_data.php';

$topicStmt = $pdo->prepare(
    "INSERT IGNORE INTO topics (code, title, paper, sort_order) VALUES (?,?,?,?)"
);
$qStmt = $pdo->prepare(
    "INSERT IGNORE INTO questions
     (topic_id, question_text, option_a, option_b, option_c, option_d, correct_index)
     VALUES (?,?,?,?,?,?,?)"
);

$topicsInserted    = 0;
$questionsInserted = 0;
$questionsDupe     = 0;

foreach ($data as $topicData) {
    $topicStmt->execute([
        $topicData['code'],
        $topicData['title'],
        $topicData['paper'],
        $topicData['sort_order'],
    ]);

    // Retrieve topic id (whether just inserted or pre-existing)
    $topicId = null;
    if ($topicStmt->rowCount() > 0) {
        $topicId = (int)$pdo->lastInsertId();
        $topicsInserted++;
    } else {
        $row     = $pdo->prepare("SELECT id FROM topics WHERE code = ?");
        $row->execute([$topicData['code']]);
        $topicId = (int)$row->fetchColumn();
    }

    foreach ($topicData['questions'] as $q) {
        $qStmt->execute([
            $topicId,
            $q['question_text'],
            $q['option_a'],
            $q['option_b'],
            $q['option_c'],
            $q['option_d'],
            $q['correct_index'],
        ]);
        if ($qStmt->rowCount() > 0) {
            $questionsInserted++;
        } else {
            $questionsDupe++;
        }
    }
}

echo "Topics inserted : {$topicsInserted}\n";
echo "Questions inserted : {$questionsInserted}\n";
echo "Duplicates skipped : {$questionsDupe}\n";
echo "Done.\n";
