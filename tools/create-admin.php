<?php
/**
 * Crea un amministratore, o reimposta la password di uno esistente.
 * Solo da riga di comando:  php tools/create-admin.php admin@mira.com
 * La password si digita a terminale e non finisce nella cronologia della shell.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$email = $argv[1] ?? '';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Uso: php tools/create-admin.php <email>\n");
    exit(1);
}

$secrets = require __DIR__ . '/../api/secrets.php';
$db = new PDO(
    "mysql:host={$secrets['db_host']};dbname={$secrets['db_name']};charset=utf8mb4",
    $secrets['db_user'],
    $secrets['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

fwrite(STDOUT, "Nuova password (almeno 12 caratteri): ");
$password = trim((string)fgets(STDIN));
if (mb_strlen($password) < 12) {
    fwrite(STDERR, "Password troppo corta.\n");
    exit(1);
}
$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
$id = $stmt->fetchColumn();

if ($id) {
    // Nuova password e token_version +1: le sessioni aperte con la vecchia muoiono.
    $db->prepare('UPDATE users SET password = ?, is_admin = 1, token_version = token_version + 1 WHERE id = ?')
       ->execute([$hash, $id]);
    echo "Password aggiornata, $email e' amministratore.\n";
} else {
    $db->prepare("INSERT INTO users (email, password, first_name, last_name, is_admin) VALUES (?, ?, 'Admin', 'MIRA', 1)")
       ->execute([$email, $hash]);
    $db->prepare('INSERT IGNORE INTO carts (user_id) VALUES (?)')->execute([$db->lastInsertId()]);
    echo "Amministratore $email creato.\n";
}
