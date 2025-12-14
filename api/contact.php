<?php
/**
 * MIRA E-Commerce API
 * Contact Form Endpoint - api/contact.php
 * Richiede autenticazione
 */

require_once 'config.php';
require_once 'email_helper.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Verifica autenticazione
$user = JWT::verify();

if ($method !== 'POST') {
    Response::error('Solo richieste POST sono permesse', 405);
}

$data = json_decode(file_get_contents('php://input'), true);

// Validazione
$errors = [];

if ($error = Validator::required($data['first_name'] ?? '', 'Nome')) $errors[] = $error;
if ($error = Validator::required($data['last_name'] ?? '', 'Cognome')) $errors[] = $error;
if ($error = Validator::required($data['email'] ?? '', 'Email')) $errors[] = $error;
if ($error = Validator::email($data['email'] ?? '')) $errors[] = $error;
if ($error = Validator::required($data['message'] ?? '', 'Messaggio')) $errors[] = $error;

if (!empty($errors)) {
    Response::error('Validazione fallita', 400, $errors);
}

try {
    // Save to database
    $sql = "INSERT INTO contact_messages (first_name, last_name, email, message, ip_address)
            VALUES (?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['first_name'],
        $data['last_name'],
        $data['email'],
        $data['message'],
        $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ]);
    
    $messageId = $db->lastInsertId();
    
    // Log: messaggio salvato
    error_log("MIRA Contact: Messaggio #{$messageId} salvato nel database");
    
    // Prepara dati per email
    $emailData = [
        'first_name' => $data['first_name'],
        'last_name' => $data['last_name'],
        'email' => $data['email'],
        'message' => $data['message'],
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    // Log: tentativo invio email
    error_log("MIRA Contact: Tentativo invio email per messaggio #{$messageId}");
    
    // Invia notifica al team MIRA
    try {
        $notificationSent = EmailHelper::sendContactNotification($emailData);
        if ($notificationSent) {
            error_log("MIRA Contact: ✅ Notifica inviata al team");
        } else {
            error_log("MIRA Contact: ❌ Errore invio notifica al team");
        }
    } catch (Exception $e) {
        error_log("MIRA Contact: ❌ Exception notifica: " . $e->getMessage());
    }
    
    // Invia conferma al mittente
    try {
        $confirmationSent = EmailHelper::sendContactConfirmation($emailData);
        if ($confirmationSent) {
            error_log("MIRA Contact: ✅ Conferma inviata al mittente");
        } else {
            error_log("MIRA Contact: ❌ Errore invio conferma");
        }
    } catch (Exception $e) {
        error_log("MIRA Contact: ❌ Exception conferma: " . $e->getMessage());
    }
    
    Response::success([
        'message_id' => $messageId
    ], 'Messaggio inviato con successo! Ti risponderemo al più presto.');
    
} catch (Exception $e) {
    error_log("Contact form error: " . $e->getMessage());
    Response::error('Errore nell\'invio del messaggio. Riprova più tardi.', 500);
}
?>