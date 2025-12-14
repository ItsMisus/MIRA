<?php
/**
 * MIRA E-Commerce - Email Helper
 * api/email_helper.php
 * Gestisce l'invio di email tramite PHPMailer
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Carica PHPMailer (assicurati di installarlo con composer require phpmailer/phpmailer)
require_once __DIR__ . '/../vendor/autoload.php';

class EmailHelper {
    private static $smtp_host = 'smtp.gmail.com';
    private static $smtp_port = 587;
    private static $smtp_user = 'preventivimira1@gmail.com';
    private static $smtp_pass = 'utss tfvy ecbm bpzh'; // Usa App Password di Gmail
    private static $from_email = 'preventivimira1@gmail.com';
    private static $from_name = 'MIRA E-Commerce';
    
    /**
     * Invia email di benvenuto al nuovo utente
     */
    public static function sendWelcomeEmail($userEmail, $userName) {
        $mail = new PHPMailer(true);
        
        try {
            // Configurazione Server
            $mail->isSMTP();
            $mail->Host = self::$smtp_host;
            $mail->SMTPAuth = true;
            $mail->Username = self::$smtp_user;
            $mail->Password = self::$smtp_pass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = self::$smtp_port;
            $mail->CharSet = 'UTF-8';
            
            // Mittente
            $mail->setFrom(self::$from_email, self::$from_name);
            
            // Destinatario
            $mail->addAddress($userEmail, $userName);
            
            // Contenuto
            $mail->isHTML(true);
            $mail->Subject = 'Benvenuto in MIRA - Account Attivato';
            
            $siteUrl = SITE_URL;
            
            $mail->Body = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: #fff; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 36px; letter-spacing: 3px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .content h2 { color: #000; font-size: 24px; margin-bottom: 20px; font-weight: 600; }
        .content p { color: #555; margin-bottom: 15px; line-height: 1.8; }
        .benefits { background: #f9fafb; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #9b59b6; }
        .benefits ul { margin: 10px 0; padding-left: 20px; }
        .benefits li { margin: 8px 0; color: #555; }
        .button { display: inline-block; padding: 16px 40px; background: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 25px 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .button:hover { background: #333; }
        .footer { background: #f9fafb; text-align: center; padding: 30px; color: #666; font-size: 13px; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 5px 0; }
        .footer a { color: #9b59b6; text-decoration: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>MIRA</h1>
        </div>
        <div class='content'>
            <h2>Benvenuto, {$userName}</h2>
            <p><strong>Il tuo account è stato attivato con successo.</strong></p>
            <p>Grazie per esserti registrato su MIRA. Ora puoi accedere al tuo account per un'esperienza di acquisto veloce e personalizzata.</p>
            
            <div class='benefits'>
                <p><strong>Vantaggi del tuo account:</strong></p>
                <ul>
                    <li>Gestione completa dei tuoi ordini</li>
                    <li>Salvataggio indirizzi di spedizione</li>
                    <li>Accesso anticipato a offerte esclusive</li>
                    <li>Aggiornamenti sui nuovi prodotti</li>
                </ul>
            </div>
            
            <center>
                <a href='{$siteUrl}' class='button'>Visita il Negozio</a>
            </center>
            
            <p>Per qualsiasi domanda o necessità di assistenza, non esitare a rispondere a questa email. Il nostro team è a tua disposizione.</p>
            
            <p style='margin-top: 30px; color: #999; font-size: 13px;'>
                Cordiali saluti,<br>
                <strong>Team MIRA</strong>
            </p>
        </div>
        <div class='footer'>
            <p><strong>MIRA E-Commerce</strong></p>
            <p>PC Gaming di Alta Qualità</p>
            <p><a href='{$siteUrl}'>{$siteUrl}</a></p>
            <p style='margin-top: 15px;'>© 2025 MIRA. Tutti i diritti riservati.</p>
        </div>
    </div>
</body>
</html>
            ";
            
            // Testo alternativo
            $mail->AltBody = "Benvenuto, {$userName}\n\n"
                . "Il tuo account MIRA è stato attivato con successo.\n\n"
                . "Hai attivato con successo il tuo account cliente. Per i tuoi prossimi acquisti, accedi per un check-out più veloce.\n\n"
                . "Vantaggi del tuo account:\n"
                . "- Gestione completa dei tuoi ordini\n"
                . "- Salvataggio indirizzi di spedizione\n"
                . "- Accesso anticipato a offerte esclusive\n"
                . "- Aggiornamenti sui nuovi prodotti\n\n"
                . "Visita il negozio: {$siteUrl}\n\n"
                . "Per assistenza, rispondi a questa email.\n\n"
                . "Cordiali saluti,\n"
                . "Team MIRA";
            
            $mail->send();
            return true;
            
        } catch (Exception $e) {
            error_log("Email error: {$mail->ErrorInfo}");
            return false;
        }
    }
    
    /**
     * Invia notifica al team MIRA per nuovo messaggio contatti
     */
    public static function sendContactNotification($contactData) {
        $mail = new PHPMailer(true);
        
        try {
            // Configurazione Server
            $mail->isSMTP();
            $mail->Host = self::$smtp_host;
            $mail->SMTPAuth = true;
            $mail->Username = self::$smtp_user;
            $mail->Password = self::$smtp_pass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = self::$smtp_port;
            $mail->CharSet = 'UTF-8';
            
            // Mittente
            $mail->setFrom(self::$from_email, self::$from_name);
            $mail->addReplyTo($contactData['email'], $contactData['first_name'] . ' ' . $contactData['last_name']);
            
            // Destinatario (team MIRA)
            $mail->addAddress(self::$from_email, 'Team MIRA');
            
            // Contenuto
            $mail->isHTML(true);
            $mail->Subject = "[MIRA] Nuovo messaggio da {$contactData['first_name']} {$contactData['last_name']}";
            
            $date = date('d/m/Y H:i:s');
            
            $mail->Body = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: #fff; padding: 30px; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 30px; }
        .info-section { background: #f9fafb; padding: 20px; border-radius: 6px; margin-bottom: 20px; }
        .info-row { margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .info-row:last-child { border-bottom: none; }
        .label { font-weight: 600; color: #666; display: inline-block; width: 80px; }
        .value { color: #000; }
        .message-box { background: #fff; border-left: 4px solid #9b59b6; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .message-box h3 { margin-top: 0; color: #000; font-size: 16px; }
        .reply-info { background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Nuovo Messaggio - MIRA</h1>
        </div>
        <div class='content'>
            <div class='info-section'>
                <h3 style='margin-top: 0; color: #000;'>Informazioni Mittente</h3>
                <div class='info-row'>
                    <span class='label'>Nome:</span>
                    <span class='value'>{$contactData['first_name']} {$contactData['last_name']}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>Email:</span>
                    <span class='value'><a href='mailto:{$contactData['email']}'>{$contactData['email']}</a></span>
                </div>
                <div class='info-row'>
                    <span class='label'>Data:</span>
                    <span class='value'>{$date}</span>
                </div>
                <div class='info-row'>
                    <span class='label'>IP:</span>
                    <span class='value'>{$contactData['ip']}</span>
                </div>
            </div>
            
            <div class='message-box'>
                <h3>Messaggio</h3>
                " . nl2br(htmlspecialchars($contactData['message'])) . "
            </div>
            
            <div class='reply-info'>
                <strong>Per rispondere:</strong> Clicca su \"Rispondi\" in questa email oppure invia un messaggio a 
                <a href='mailto:{$contactData['email']}'>{$contactData['email']}</a>
            </div>
        </div>
    </div>
</body>
</html>
            ";
            
            $mail->AltBody = "NUOVO MESSAGGIO DAL SITO MIRA\n\n"
                . "INFORMAZIONI MITTENTE:\n"
                . "Nome: {$contactData['first_name']} {$contactData['last_name']}\n"
                . "Email: {$contactData['email']}\n"
                . "Data: {$date}\n"
                . "IP: {$contactData['ip']}\n\n"
                . "MESSAGGIO:\n"
                . "{$contactData['message']}\n\n"
                . "---\n"
                . "Per rispondere, invia un'email a: {$contactData['email']}";
            
            $mail->send();
            return true;
            
        } catch (Exception $e) {
            error_log("Email error: {$mail->ErrorInfo}");
            return false;
        }
    }
    
    /**
     * Invia copia del messaggio al mittente
     */
    public static function sendContactConfirmation($contactData) {
        $mail = new PHPMailer(true);
        
        try {
            // Configurazione Server
            $mail->isSMTP();
            $mail->Host = self::$smtp_host;
            $mail->SMTPAuth = true;
            $mail->Username = self::$smtp_user;
            $mail->Password = self::$smtp_pass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = self::$smtp_port;
            $mail->CharSet = 'UTF-8';
            
            // Mittente
            $mail->setFrom(self::$from_email, self::$from_name);
            
            // Destinatario
            $mail->addAddress($contactData['email'], $contactData['first_name'] . ' ' . $contactData['last_name']);
            
            // Contenuto
            $mail->isHTML(true);
            $mail->Subject = 'Conferma Ricezione Messaggio - MIRA';
            
            $siteUrl = SITE_URL;
            
            $mail->Body = "
<!DOCTYPE html>
<html>
<head>
    <meta charset='UTF-8'>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); color: #fff; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 36px; letter-spacing: 3px; font-weight: 700; }
        .content { padding: 40px 30px; }
        .content h2 { color: #000; font-size: 22px; margin-bottom: 20px; font-weight: 600; }
        .content p { color: #555; margin-bottom: 15px; line-height: 1.8; }
        .message-box { background: #f9fafb; border-left: 4px solid #9b59b6; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .contact-info { background: #f0f9ff; padding: 20px; border-radius: 6px; margin: 25px 0; }
        .contact-info ul { list-style: none; padding: 0; margin: 10px 0; }
        .contact-info li { margin: 8px 0; color: #555; }
        .footer { background: #f9fafb; text-align: center; padding: 30px; color: #666; font-size: 13px; border-top: 1px solid #e5e7eb; }
        .footer p { margin: 5px 0; }
        .footer a { color: #9b59b6; text-decoration: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>MIRA</h1>
        </div>
        <div class='content'>
            <h2>Messaggio Ricevuto</h2>
            <p>Gentile {$contactData['first_name']},</p>
            <p>Grazie per averci contattato. Confermiamo di aver ricevuto il tuo messaggio e ti risponderemo nel più breve tempo possibile.</p>
            
            <div class='message-box'>
                <p><strong>Il tuo messaggio:</strong></p>
                " . nl2br(htmlspecialchars($contactData['message'])) . "
            </div>
            
            <p>Ti risponderemo entro 24-48 ore all'indirizzo email: <strong>{$contactData['email']}</strong></p>
            
            <div class='contact-info'>
                <p><strong>Per assistenza immediata, puoi contattarci tramite:</strong></p>
                <ul>
                    <li>Email: preventivimira1@gmail.com</li>
                    <li>Telefono/WhatsApp: +39 377 590 0298</li>
                    <li>Discord: <a href='https://discord.gg/NrdB2AmFYB' style='color: #9b59b6;'>Unisciti al server</a></li>
                </ul>
            </div>
            
            <p style='margin-top: 30px; color: #999; font-size: 13px;'>
                Cordiali saluti,<br>
                <strong>Team MIRA</strong>
            </p>
        </div>
        <div class='footer'>
            <p><strong>MIRA E-Commerce</strong></p>
            <p>PC Gaming di Alta Qualità</p>
            <p><a href='{$siteUrl}'>{$siteUrl}</a></p>
            <p style='margin-top: 15px;'>© 2025 MIRA. Tutti i diritti riservati.</p>
        </div>
    </div>
</body>
</html>
            ";
            
            $mail->send();
            return true;
            
        } catch (Exception $e) {
            error_log("Email error: {$mail->ErrorInfo}");
            return false;
        }
    }
}
?>