<?php
/**
 * MIRA E-Commerce Backend
 * Database Configuration
 */

// Configurazione Database
define('DB_HOST', 'localhost');
define('DB_NAME', 'mira_ecommerce');
define('DB_USER', 'root');
define('DB_PASS', '');

// Configurazione Email
define('SMTP_HOST', 'francesco.minutiello08@gmail.com');
define('SMTP_PORT', 587);
define('SMTP_USER', 'Misus');
define('SMTP_PASS', 'Gambol_123_456'); // Usa App Password di Gmail

// Configurazione Generale
define('SITE_URL', 'http://localhost');
define('API_URL', SITE_URL . '/api');
define('UPLOAD_DIR', __DIR__ . '/uploads/');
define('MAX_UPLOAD_SIZE', 5 * 1024 * 1024); // 5MB

// Timezone
date_default_timezone_set('Europe/Rome');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=UTF-8');

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
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
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
    
    // Previeni clonazione
    private function __clone() {}
    
    // Previeni unserialize
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
            'data' => $data
        ]);
        exit;
    }
    
    public static function error($message, $code = 400, $errors = []) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'errors' => $errors
        ]);
        exit;
    }
}

/**
 * JWT Token Helper (Simple Implementation)
 */
class JWT {
    private static $secret = 'mira_secret_key_change_this_in_production';
    
    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode($payload);
        
        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
    
    public static function decode($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        
        list($base64UrlHeader, $base64UrlPayload, $base64UrlSignature) = $parts;
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignatureCheck = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
        
        if ($base64UrlSignature !== $base64UrlSignatureCheck) {
            return null;
        }
        
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $base64UrlPayload));
        return json_decode($payload, true);
    }
    
    public static function verify() {
        $headers = getallheaders();
        $token = isset($headers['Authorization']) ? str_replace('Bearer ', '', $headers['Authorization']) : null;
        
        if (!$token) {
            Response::error('Token mancante', 401);
        }
        
        $payload = self::decode($token);
        if (!$payload) {
            Response::error('Token non valido', 401);
        }
        
        return $payload;
    }
}

/**
 * Validation Helper
 */
class Validator {
    public static function required($value, $fieldName) {
        if (empty($value) && $value !== '0') {
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
        if (strlen($value) < $length) {
            return "$fieldName deve essere almeno $length caratteri";
        }
        return null;
    }
    
    public static function maxLength($value, $length, $fieldName) {
        if (strlen($value) > $length) {
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
// Fine del file config.php
?>