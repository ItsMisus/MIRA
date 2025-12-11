<?php
/**
 * MISUSTECH - Send Contact Form
 * Riceve i dati del form contatto e li invia via email
 */

// Configurazione
$to_email = "francesco.minutiello08@gmail.com";
$subject_prefix = "[MISUSTECH] Nuovo messaggio da ";

// Headers CORS per richieste AJAX
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Solo richieste POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Metodo non permesso']);
    exit;
}

// Ottieni dati JSON o form
$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    $data = $_POST;
}

// Validazione campi obbligatori
$required = ['nome', 'email', 'messaggio'];
foreach ($required as $field) {
    if (empty($data[$field])) {
        echo json_encode(['success' => false, 'message' => "Campo '$field' obbligatorio"]);
        exit;
    }
}

// Sanitizza i dati
$nome = htmlspecialchars(strip_tags($data['nome']));
$cognome = htmlspecialchars(strip_tags($data['cognome'] ?? ''));
$email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
$messaggio = htmlspecialchars(strip_tags($data['messaggio']));

// Valida email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email non valida']);
    exit;
}

// Costruisci l'email
$email_subject = $subject_prefix . $nome . " " . $cognome;
$email_body = "
===========================================
NUOVO MESSAGGIO DAL SITO WEB
===========================================

DATI MITTENTE:
- Nome: $nome $cognome
- Email: $email

MESSAGGIO:
-------------------------------------------
$messaggio
-------------------------------------------

Inviato il: " . date('d/m/Y H:i:s') . "
IP: " . $_SERVER['REMOTE_ADDR'] . "
";

// Headers email
$headers = "From: $email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Invia email
$sent = mail($to_email, $email_subject, $email_body, $headers);

if ($sent) {
    echo json_encode(['success' => true, 'message' => 'Messaggio inviato con successo!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Errore nell\'invio. Riprova più tardi.']);
}
?>
