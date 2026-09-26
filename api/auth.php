<?php
/**
 * MIRA E-Commerce API
 * Authentication Endpoint - api/auth.php
 * FIX #5: creazione carrello atomica con INSERT IGNORE (no duplicati)
 */

require_once 'config.php';
require_once 'email_helper.php';

/** Lunghezza minima della password alla registrazione. */
const MIN_PASSWORD_LENGTH = 10;

$db     = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    Response::error('Solo richieste POST sono permesse', 405);
}

$data   = readJsonBody();
$action = $data['action'] ?? '';

switch ($action) {
    case 'register': registerUser($db, $data); break;
    case 'login':    loginUser($db, $data);    break;
    case 'verify':   verifyToken();            break;
    case 'logout':   logoutUser($db);          break;
    default:         Response::error('Action non valida. Usa: register, login, verify, logout', 400);
}

/**
 * Token firmato per l'utente. `ver` lega il token alla token_version corrente:
 * al logout la versione sale e il token smette di valere.
 */
function issueToken($user) {
    return JWT::encode([
        'id'       => (int)$user['id'],
        'email'    => $user['email'],
        'is_admin' => (bool)$user['is_admin'],
        'ver'      => (int)$user['token_version'],
        'exp'      => time() + TOKEN_TTL
    ]);
}

/**
 * Register new user
 * FIX #5: tutto in transazione, INSERT IGNORE per il carrello
 */
function registerUser($db, $data) {
    rateLimit($db, 'register:' . clientIp(), 5, 3600);

    $errors = [];

    if ($error = Validator::required($data['email']      ?? '', 'Email'))    $errors[] = $error;
    if ($error = Validator::email($data['email']         ?? ''))             $errors[] = $error;
    if ($error = Validator::required($data['password']   ?? '', 'Password')) $errors[] = $error;
    if ($error = Validator::minLength($data['password']  ?? '', MIN_PASSWORD_LENGTH, 'Password')) $errors[] = $error;
    if ($error = Validator::maxLength($data['password']  ?? '', 200, 'Password')) $errors[] = $error;
    if ($error = Validator::required($data['first_name'] ?? '', 'Nome'))     $errors[] = $error;
    if ($error = Validator::maxLength($data['first_name'] ?? '', 60, 'Nome')) $errors[] = $error;
    if ($error = Validator::required($data['last_name']  ?? '', 'Cognome'))  $errors[] = $error;
    if ($error = Validator::maxLength($data['last_name'] ?? '', 60, 'Cognome')) $errors[] = $error;

    if (!empty($errors)) {
        Response::error('Validazione fallita', 400, $errors);
    }

    $email     = trim($data['email']);
    $firstName = trim($data['first_name']);
    $lastName  = trim($data['last_name']);

    try {
        $checkStmt = $db->prepare("SELECT id FROM users WHERE email = ?");
        $checkStmt->execute([$email]);
        if ($checkStmt->fetch()) {
            Response::error('Email già registrata', 400);
        }

        $db->beginTransaction();

        $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);

        $sql  = "INSERT INTO users (email, password, first_name, last_name, phone, is_admin)
                 VALUES (?, ?, ?, ?, ?, 0)";
        $stmt = $db->prepare($sql);
        $stmt->execute([
            $email,
            $hashedPassword,
            $firstName,
            $lastName,
            $data['phone'] ?? null
        ]);

        $userId = $db->lastInsertId();

        // FIX #5: INSERT IGNORE evita duplicati se esiste già un carrello (UNIQUE KEY su user_id)
        $db->prepare("INSERT IGNORE INTO carts (user_id) VALUES (?)")->execute([$userId]);

        $db->commit();

        $token = issueToken([
            'id' => $userId, 'email' => $email, 'is_admin' => 0, 'token_version' => 0
        ]);

        // Email di benvenuto: non blocca la registrazione se fallisce. Throwable,
        // non Exception: anche una libreria mancante (Error) non deve far
        // fallire una registrazione gia' salvata.
        try {
            EmailHelper::sendWelcomeEmail($email, $firstName . ' ' . $lastName);
        } catch (\Throwable $e) {
            error_log("Errore invio email benvenuto: " . $e->getMessage());
        }

        Response::success([
            'token' => $token,
            'user'  => [
                'id'         => (int)$userId,
                'email'      => $email,
                'first_name' => $firstName,
                'last_name'  => $lastName,
                'is_admin'   => false
            ]
        ], 'Registrazione completata con successo', 201);

    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log("Registration error: " . $e->getMessage());
        Response::error('Errore durante la registrazione', 500);
    }
}

/**
 * Login user
 */
function loginUser($db, $data) {
    $errors = [];
    if ($error = Validator::required($data['email']    ?? '', 'Email'))    $errors[] = $error;
    if ($error = Validator::required($data['password'] ?? '', 'Password')) $errors[] = $error;

    if (!empty($errors)) {
        Response::error('Validazione fallita', 400, $errors);
    }

    // Due freni: per indirizzo (chi prova molti account) e per account (chi
    // prova molte password sullo stesso account da indirizzi diversi).
    rateLimit($db, 'login-ip:' . clientIp(), 20, 900);
    rateLimit($db, 'login-user:' . strtolower(trim($data['email'])), 10, 900);

    try {
        $stmt = $db->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([trim($data['email'])]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($data['password'], $user['password'])) {
            Response::error('Email o password non validi', 401);
        }

        // Hash calcolato con parametri vecchi: si aggiorna ora che la password e' nota.
        if (password_needs_rehash($user['password'], PASSWORD_DEFAULT)) {
            $db->prepare("UPDATE users SET password = ? WHERE id = ?")
               ->execute([password_hash($data['password'], PASSWORD_DEFAULT), $user['id']]);
        }

        $token = issueToken($user);

        // Assicura carrello esistente
        $db->prepare("INSERT IGNORE INTO carts (user_id) VALUES (?)")->execute([$user['id']]);

        Response::success([
            'token' => $token,
            'user'  => [
                'id'         => (int)$user['id'],
                'email'      => $user['email'],
                'first_name' => $user['first_name'],
                'last_name'  => $user['last_name'],
                'phone'      => $user['phone'],
                'is_admin'   => (bool)$user['is_admin']
            ]
        ], 'Login effettuato con successo');

    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        Response::error('Errore durante il login', 500);
    }
}

/**
 * Logout: invalida tutti i token dell'utente, non solo quello in questo browser.
 */
function logoutUser($db) {
    $user = JWT::verify();
    $db->prepare("UPDATE users SET token_version = token_version + 1 WHERE id = ?")
       ->execute([$user['id']]);
    Response::success(null, 'Logout effettuato con successo');
}

/**
 * Verify token validity
 */
function verifyToken() {
    $user = JWT::verify();
    Response::success(['user' => $user, 'valid' => true], 'Token valido');
}
