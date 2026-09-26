<?php
/**
 * MIRA E-Commerce API
 * Contact Form Endpoint - api/contact.php
 * FIX #6: aggiunto minLength(10) sul messaggio lato backend
 */

require_once 'config.php';
require_once 'email_helper.php';

$db     = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$user = JWT::verify();

if ($method !== 'POST') {
    Response::error('Solo richieste POST sono permesse', 405);
}

// Ogni messaggio fa partire due email dall'account Gmail del negozio.
rateLimit($db, 'contact:' . $user['id'], 3, 3600);

$data = readJsonBody();

$errors = [];
if ($error = Validator::required($data['first_name'] ?? '', 'Nome'))     $errors[] = $error;
if ($error = Validator::maxLength($data['first_name'] ?? '', 60, 'Nome')) $errors[] = $error;
if ($error = Validator::required($data['last_name']  ?? '', 'Cognome'))  $errors[] = $error;
if ($error = Validator::maxLength($data['last_name'] ?? '', 60, 'Cognome')) $errors[] = $error;
if ($error = Validator::required($data['email']      ?? '', 'Email'))    $errors[] = $error;
if ($error = Validator::email($data['email']         ?? ''))             $errors[] = $error;
if ($error = Validator::required($data['message']    ?? '', 'Messaggio')) $errors[] = $error;
// FIX #6: validazione minLength coerente con il frontend (contact.js controlla >= 10)
if ($error = Validator::minLength($data['message']   ?? '', 10, 'Messaggio')) $errors[] = $error;
if ($error = Validator::maxLength($data['message']   ?? '', 5000, 'Messaggio')) $errors[] = $error;

if (!empty($errors)) {
    Response::error('Validazione fallita', 400, $errors);
}

// La conferma va all'email dell'account, non a quella scritta nel form:
// altrimenti chiunque potrebbe far arrivare email del negozio a un terzo.
$accountStmt = $db->prepare('SELECT email FROM users WHERE id = ?');
$accountStmt->execute([$user['id']]);
$accountEmail = $accountStmt->fetchColumn();

try {
    $sql  = "INSERT INTO contact_messages (first_name, last_name, email, message, ip_address)
             VALUES (?, ?, ?, ?, ?)";
    $stmt = $db->prepare($sql);
    $stmt->execute([
        trim($data['first_name']),
        trim($data['last_name']),
        trim($data['email']),
        $data['message'],
        clientIp()
    ]);

    $messageId = $db->lastInsertId();
    error_log("MIRA Contact: Messaggio #{$messageId} salvato nel database");

    $emailData = [
        'first_name' => trim($data['first_name']),
        'last_name'  => trim($data['last_name']),
        'email'      => trim($data['email']),
        'message'    => $data['message'],
        'ip'         => clientIp()
    ];

    // Throwable: un problema con le email non deve trasformare in errore un
    // messaggio gia' salvato.
    try {
        EmailHelper::sendContactNotification($emailData);
    } catch (\Throwable $e) {
        error_log("MIRA Contact: Errore notifica team — " . $e->getMessage());
    }

    if ($accountEmail) {
        try {
            EmailHelper::sendContactConfirmation(['email' => $accountEmail] + $emailData);
        } catch (\Throwable $e) {
            error_log("MIRA Contact: Errore conferma mittente — " . $e->getMessage());
        }
    }

    Response::success(
        ['message_id' => (int)$messageId],
        'Messaggio inviato con successo! Ti risponderemo al più presto.'
    );

} catch (PDOException $e) {
    error_log("Contact form error: " . $e->getMessage());
    Response::error('Errore nell\'invio del messaggio. Riprova più tardi.', 500);
}
