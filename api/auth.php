<?php
/**
 * Admin session guard.
 *
 * Require this file at the top of every admin endpoint.
 * Starts the named session and aborts with 401 if no valid admin session exists.
 *
 * @package TLevelQuiz\API\Admin
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/db.php';

$cfg = getConfig();
session_name($cfg['session_name']);
session_start();

if (empty($_SESSION['admin_id'])) {
    jsonResponse(['error' => 'Unauthorised'], 401);
}
