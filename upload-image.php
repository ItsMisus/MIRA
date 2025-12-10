<?php
/**
 * IMAGE UPLOAD HANDLER
 * Handles secure file uploads to /images directory
 */

// Security headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Configuration
$UPLOAD_DIR = __DIR__ . '/images/';
$MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
$ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

// Ensure upload directory exists and is writable
if (!is_dir($UPLOAD_DIR)) {
    mkdir($UPLOAD_DIR, 0755, true);
}

if (!is_writable($UPLOAD_DIR)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Upload directory is not writable'
    ]);
    exit;
}

// Check if file was uploaded
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'No file uploaded or upload error'
    ]);
    exit;
}

$file = $_FILES['file'];

// Validate file size
if ($file['size'] > $MAX_FILE_SIZE) {
    http_response_code(413);
    echo json_encode([
        'success' => false,
        'error' => 'File too large'
    ]);
    exit;
}

// Validate MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $ALLOWED_TYPES)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Invalid file type'
    ]);
    exit;
}

// Get original file name
$originalName = basename($file['name']);
$extension = pathinfo($originalName, PATHINFO_EXTENSION);

// Sanitize and generate unique name
$sanitized = isset($_POST['sanitized_name']) ? $_POST['sanitized_name'] : $originalName;
$fileName = preg_replace('/\.[^.]+$/', '', $sanitized) . '_' . time() . '.' . $extension;
$filePath = $UPLOAD_DIR . $fileName;

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filePath)) {
    // Set proper permissions
    chmod($filePath, 0644);

    // Return success with file info
    echo json_encode([
        'success' => true,
        'fileName' => $fileName,
        'filePath' => 'images/' . $fileName,
        'url' => '/images/' . $fileName,
        'size' => filesize($filePath),
        'uploadedAt' => date('Y-m-d H:i:s')
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to move uploaded file'
    ]);
}
?>
