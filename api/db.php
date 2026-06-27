<?php
/**
 * Database connection singleton.
 *
 * Reads credentials from .config.json in the same directory.
 * Returns a PDO instance configured for MySQL with exceptions enabled.
 *
 * @package TLevelQuiz\API
 * @license CC BY-NC-SA 4.0
 */

/**
 * Returns the parsed .config.json as an associative array.
 *
 * @return array{db_host:string, db_name:string, db_user:string, db_pass:string, session_name:string}
 */
function getConfig(): array {
    static $cfg = null;
    if ($cfg === null) {
        $path = __DIR__ . '/.config.json';
        $cfg  = json_decode(file_get_contents($path), true);
    }
    return $cfg;
}

/**
 * Returns a shared PDO connection (lazy-initialised).
 *
 * @return PDO
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $cfg = getConfig();
        $dsn = "mysql:host={$cfg['db_host']};dbname={$cfg['db_name']};charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (\PDOException $e) {
            http_response_code(503);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['error' => 'Database unavailable', 'detail' => $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

/**
 * Sends a JSON response and exits.
 *
 * @param mixed $data    Data to encode.
 * @param int   $status  HTTP status code.
 */
function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}
