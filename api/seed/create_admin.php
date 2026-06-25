<?php
/**
 * One-time admin user creation script.
 *
 * Usage:
 *   php api/seed/create_admin.php <username> <password>
 *
 * Example:
 *   php api/seed/create_admin.php admin changeme
 *
 * @package TLevelQuiz\Seed
 * @license CC BY-NC-SA 4.0
 */

define('ROOT', dirname(__DIR__, 2));
require_once ROOT . '/api/db.php';

$username = $argv[1] ?? 'admin';
$password = $argv[2] ?? 'changeme';

$hash = password_hash($password, PASSWORD_BCRYPT);
$pdo  = getDB();

$stmt = $pdo->prepare(
    "INSERT INTO admin_users (username, password_hash) VALUES (?,?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)"
);
$stmt->execute([$username, $hash]);

echo "Admin user '{$username}' created/updated.\n";
