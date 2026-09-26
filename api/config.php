<?php
/**
 * MIRA E-Commerce Backend
 * Database Configuration
 * FIX #1: SMTP corretto | FIX #2: JWT verify compatibile Nginx
 */

// Gli errori non devono mai finire nella risposta: percorsi e query restano nei log.
ini_set('display_errors', '0');

// Segreti fuori dal codice: api/secrets.php non e' su git (modello: secrets.example.php).
$secretsFile = __DIR__ . '/secrets.php';
if (!is_file($secretsFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    error_log('MIRA: manca api/secrets.php (copia api/secrets.example.php)');
    echo json_encode(['success' => false, 'message' => 'Configurazione del server incompleta']);
    exit;
}
$secrets = require $secretsFile;

// Configurazione Database
define('DB_HOST', $secrets['db_host']);
define('DB_NAME', $secrets['db_name']);
define('DB_USER', $secrets['db_user']);
define('DB_PASS', $secrets['db_pass']);

// Configurazione Email
define('SMTP_HOST', $secrets['smtp_host']);
define('SMTP_PORT', (int)$secrets['smtp_port']);
define('SMTP_USER', $secrets['smtp_user']);
define('SMTP_PASS', $secrets['smtp_pass']);

// Configurazione Generale
define('SITE_URL', rtrim($secrets['site_url'], '/'));
define('JWT_SECRET', $secrets['jwt_secret']);

// Durata dei token di accesso.
define('TOKEN_TTL', 7 * 86400);

// Timezone
date_default_timezone_set('Europe/Rome');

// CORS: solo i domini del sito, non qualsiasi pagina web.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $secrets['allowed_origins'] ?? [], true)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}
unset($secrets, $secretsFile, $origin);

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Cache-Control: no-store');

// Qualsiasi errore non gestito diventa una risposta JSON, non una pagina HTML.
set_exception_handler(function (Throwable $e) {
    error_log('MIRA: ' . $e);
    if (!headers_sent()) {
        http_response_code(500);
    }
    echo json_encode(['success' => false, 'message' => 'Errore interno del server', 'errors' => []]);
});

// Gestisci preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Database Connection Class
 */
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $this->connection = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    private function __clone() {}

    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * Response Helper
 */
class Response {
    public static function success($data = [], $message = '', $code = 200) {
        http_response_code($code);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data'    => $data
        ]);
        exit;
    }

    public static function error($message, $code = 400, $errors = []) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors'  => $errors
        ]);
        exit;
    }
}

/**
 * JWT Token Helper
 * FIX #2: verify() ora legge il token anche da $_SERVER per compatibilità Nginx
 */
class JWT {
    /** La chiave arriva da api/secrets.php: senza una chiave robusta non si firma niente. */
    private static function secret() {
        if (!defined('JWT_SECRET') || strlen(JWT_SECRET) < 32) {
            error_log('MIRA: jwt_secret mancante o piu\' corto di 32 caratteri');
            Response::error('Configurazione del server incompleta', 500);
        }
        return JWT_SECRET;
    }

    public static function encode($payload) {
        $header  = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);

        $base64UrlHeader  = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature          = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::secret(), true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;

        $signature              = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::secret(), true);
        $base64UrlSignatureCheck = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if (!hash_equals($base64UrlSignature, $base64UrlSignatureCheck)) {
            return null;
        }

        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload));
        $decoded = json_decode($payload, true);

        // Un token senza scadenza o senza utente non vale: non scadrebbe mai.
        if (!is_array($decoded) || !isset($decoded['exp'], $decoded['id']) || $decoded['exp'] < time()) {
            return null;
        }

        return $decoded;
    }

    /**
     * FIX #2: Legge Authorization sia da getallheaders() (Apache) che da
     * $_SERVER['HTTP_AUTHORIZATION'] (Nginx / FastCGI) per piena compatibilità.
     */
    public static function verify() {
        $token = null;

        // Tentativo 1: getallheaders() — funziona su Apache
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            // Cerca header case-insensitive
            foreach ($headers as $key => $value) {
                if (strtolower($key) === 'authorization') {
                    $token = str_replace('Bearer ', '', $value);
                    break;
                }
            }
        }

        // Tentativo 2: $_SERVER — funziona su Nginx e FastCGI
        if (!$token && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
        }

        // Tentativo 3: REDIRECT_HTTP_AUTHORIZATION (alcuni setup Apache mod_rewrite)
        if (!$token && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $token = str_replace('Bearer ', '', $_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }

        if (!$token) {
            Response::error('Token mancante', 401);
        }

        $payload = self::decode($token);
        if (!$payload) {
            Response::error('Token non valido o scaduto', 401);
        }

        // Logout e cambio password incrementano token_version: i token emessi
        // prima smettono di valere subito, invece che alla scadenza.
        $stmt = Database::getInstance()->getConnection()
            ->prepare('SELECT token_version FROM users WHERE id = ?');
        $stmt->execute([$payload['id']]);
        $row = $stmt->fetch();
        if (!$row || (int)$row['token_version'] !== (int)($payload['ver'] ?? -1)) {
            Response::error('Sessione non più valida, rifai il login', 401);
        }

        return $payload;
    }
}

/**
 * Corpo JSON della richiesta, sempre come array: un JSON rotto non deve
 * arrivare alle funzioni come null.
 */
function readJsonBody() {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) {
        Response::error('Dati JSON non validi', 400);
    }
    return $data;
}

/**
 * Token valido E utente admin adesso, nel database. Il flag is_admin dentro
 * il token non basta: chi toglie il ruolo a un utente deve vederlo subito.
 */
function requireAdmin($db) {
    $payload = JWT::verify();
    $stmt = $db->prepare('SELECT is_admin FROM users WHERE id = ?');
    $stmt->execute([$payload['id']]);
    $row = $stmt->fetch();
    if (!$row || (int)$row['is_admin'] !== 1) {
        Response::error('Accesso non autorizzato', 403);
    }
    return $payload;
}

/**
 * Freno ai tentativi: al massimo $max richieste per $bucket ogni $seconds.
 * Serve la tabella rate_limits (database/migrations/001_sicurezza.sql).
 */
function rateLimit($db, $bucket, $max, $seconds) {
    $db->prepare('DELETE FROM rate_limits WHERE hit_at < (NOW() - INTERVAL ? SECOND)')
       ->execute([(int)$seconds]);
    $count = $db->prepare('SELECT COUNT(*) FROM rate_limits WHERE bucket = ?');
    $count->execute([$bucket]);
    if ((int)$count->fetchColumn() >= $max) {
        Response::error('Troppi tentativi, riprova più tardi', 429);
    }
    $db->prepare('INSERT INTO rate_limits (bucket) VALUES (?)')->execute([$bucket]);
}

function clientIp() {
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Validation Helper
 */
class Validator {
    public static function required($value, $fieldName) {
        if (is_string($value)) {
            $value = trim($value);
        }
        if ($value === '' || $value === null || $value === []) {
            return "$fieldName è obbligatorio";
        }
        return null;
    }

    public static function email($value) {
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
            return "Email non valida";
        }
        return null;
    }

    public static function minLength($value, $length, $fieldName) {
        if (mb_strlen($value) < $length) {
            return "$fieldName deve essere almeno $length caratteri";
        }
        return null;
    }

    public static function maxLength($value, $length, $fieldName) {
        if (mb_strlen($value) > $length) {
            return "$fieldName deve essere massimo $length caratteri";
        }
        return null;
    }

    public static function numeric($value, $fieldName) {
        if (!is_numeric($value)) {
            return "$fieldName deve essere un numero";
        }
        return null;
    }
}
