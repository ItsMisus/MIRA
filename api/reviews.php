<?php
/**
 * MIRA E-Commerce API
 * Reviews Endpoint - api/reviews.php
 */

require_once 'config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getReviews($db, $_GET);
        break;
    
    case 'POST':
        createReview($db, json_decode(file_get_contents('php://input'), true));
        break;
    
    case 'DELETE':
        JWT::verify(); // Solo admin
        deleteReview($db, $_GET['id']);
        break;
    
    default:
        Response::error('Metodo non supportato', 405);
}

/**
 * Get reviews for product
 */
function getReviews($db, $params) {
    if (!isset($params['product_id'])) {
        Response::error('product_id mancante');
    }
    
    $sql = "SELECT r.*, u.first_name, u.last_name
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.product_id = ? AND r.is_approved = 1
            ORDER BY r.created_at DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$params['product_id']]);
    $reviews = $stmt->fetchAll();
    
    Response::success($reviews);
}

/**
 * Create new review
 */
function createReview($db, $data) {
    $errors = [];
    
    if ($error = Validator::required($data['product_id'] ?? '', 'Product ID')) $errors[] = $error;
    if ($error = Validator::required($data['reviewer_name'] ?? '', 'Nome')) $errors[] = $error;
    if ($error = Validator::required($data['rating'] ?? '', 'Rating')) $errors[] = $error;
    if ($error = Validator::required($data['comment'] ?? '', 'Commento')) $errors[] = $error;
    
    if (!empty($errors)) {
        Response::error('Validazione fallita', 400, $errors);
    }
    
    $rating = (int)$data['rating'];
    if ($rating < 1 || $rating > 5) {
        Response::error('Rating deve essere tra 1 e 5');
    }
    
    $sql = "INSERT INTO reviews (product_id, reviewer_name, rating, comment, is_approved)
            VALUES (?, ?, ?, ?, 1)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $data['product_id'],
        $data['reviewer_name'],
        $rating,
        $data['comment']
    ]);
    
    Response::success(['id' => $db->lastInsertId()], 'Recensione inviata!', 201);
}

/**
 * Delete review (admin only)
 */
function deleteReview($db, $id) {
    if (!$id) {
        Response::error('ID recensione mancante');
    }
    
    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        Response::error('Recensione non trovata', 404);
    }
    
    Response::success(null, 'Recensione eliminata');
}
?>