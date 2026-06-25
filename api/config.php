<?php
/**
 * Public endpoint — application config values.
 *
 * GET /api/config.php
 *   Returns all rows from the config table as a flat key→value object.
 *
 * @package TLevelQuiz\API
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$pdo  = getDB();
$rows = $pdo->query("SELECT key_name, key_value FROM config")->fetchAll();

$out = [];
foreach ($rows as $row) {
    $out[$row['key_name']] = $row['key_value'];
}

jsonResponse($out);
