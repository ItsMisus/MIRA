<?php
/**
 * MIRA E-Commerce API
 * Contact Form Endpoint - api/contact.php
 */

require_once 'config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

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
    
    // Send email notification
    $to = SMTP_USER;
    $subject = "[MIRA] Nuovo messaggio da {$data['first_name']} {$data['last_name']}";
    
    $emailBody = "
===========================================
NUOVO MESSAGGIO DAL SITO MIRA
===========================================

DATI MITTENTE:
- Nome: {$data['first_name']} {$data['last_name']}
- Email: {$data['email']}
- IP: {$_SERVER['REMOTE_ADDR']}

MESSAGGIO:
-------------------------------------------
{$data['message']}
-------------------------------------------

Data: " . date('d/m/Y H:i:s') . "
ID Messaggio: {$messageId}
    ";
    
    $headers = "From: {$data['email']}\r\n";
    $headers .= "Reply-To: {$data['email']}\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    // Send email (funziona solo se server ha SMTP configurato)
    @mail($to, $subject, $emailBody, $headers);
    
    Response::success([
        'message_id' => $messageId
    ], 'Messaggio inviato con successo! Ti risponderemo al più presto.');
    
} catch (Exception $e) {
    error_log("Contact form error: " . $e->getMessage());
    Response::error('Errore nell\'invio del messaggio. Riprova più tardi.', 500);
}
?>