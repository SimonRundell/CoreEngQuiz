<?php
/**
 * Admin logout endpoint.
 *
 * POST /api/admin/logout.php
 *   Destroys the admin session and returns { ok: true }.
 *
 * @package TLevelQuiz\API\Admin
 * @license CC BY-NC-SA 4.0
 */

require_once __DIR__ . '/../cors.php';
require_once __DIR__ . '/../db.php';

$cfg = getConfig();
session_name($cfg['session_name']);
session_start();
session_destroy();

jsonResponse(['ok' => true]);
