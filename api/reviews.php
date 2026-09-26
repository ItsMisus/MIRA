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
        createReview($db, readJsonBody());
        break;

    case 'DELETE':
        // Solo admin: un token valido qualsiasi non basta.
        requireAdmin($db);
        deleteReview($db, $_GET['id'] ?? null);
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

    // Solo i campi da mostrare: niente user_id ne' altri dati dell'account.
    $sql = "SELECT r.id, r.product_id, r.reviewer_name, r.rating, r.comment, r.created_at
            FROM reviews r
            WHERE r.product_id = ? AND r.is_approved = 1
            ORDER BY r.created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute([(int)$params['product_id']]);
    $reviews = $stmt->fetchAll();

    Response::success($reviews);
}

/**
 * Create new review
 * Solo utenti registrati, con un freno ai tentativi, e in attesa di
 * approvazione: prima chiunque poteva pubblicare recensioni a raffica.
 */
function createReview($db, $data) {
    $user = JWT::verify();
    rateLimit($db, 'review:' . $user['id'], 5, 3600);

    $errors = [];

    if ($error = Validator::required($data['product_id'] ?? '', 'Product ID')) $errors[] = $error;
    if ($error = Validator::required($data['reviewer_name'] ?? '', 'Nome')) $errors[] = $error;
    if ($error = Validator::maxLength($data['reviewer_name'] ?? '', 60, 'Nome')) $errors[] = $error;
    if ($error = Validator::required($data['rating'] ?? '', 'Rating')) $errors[] = $error;
    if ($error = Validator::required($data['comment'] ?? '', 'Commento')) $errors[] = $error;
    if ($error = Validator::maxLength($data['comment'] ?? '', 2000, 'Commento')) $errors[] = $error;

    if (!empty($errors)) {
        Response::error('Validazione fallita', 400, $errors);
    }

    $rating = (int)$data['rating'];
    if ($rating < 1 || $rating > 5) {
        Response::error('Rating deve essere tra 1 e 5');
    }

    $productId = (int)$data['product_id'];
    $exists = $db->prepare('SELECT 1 FROM products WHERE id = ? AND is_active = 1');
    $exists->execute([$productId]);
    if (!$exists->fetch()) {
        Response::error('Prodotto non trovato', 404);
    }

    $sql = "INSERT INTO reviews (product_id, user_id, reviewer_name, rating, comment, is_approved)
            VALUES (?, ?, ?, ?, ?, 0)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        $productId,
        $user['id'],
        trim($data['reviewer_name']),
        $rating,
        trim($data['comment'])
    ]);

    Response::success(['id' => (int)$db->lastInsertId()], 'Recensione inviata! Sarà visibile dopo l\'approvazione.', 201);
}

/**
 * Delete review (admin only)
 */
function deleteReview($db, $id) {
    if (!$id) {
        Response::error('ID recensione mancante');
    }

    $stmt = $db->prepare("DELETE FROM reviews WHERE id = ?");
    $stmt->execute([(int)$id]);

    if ($stmt->rowCount() === 0) {
        Response::error('Recensione non trovata', 404);
    }

    Response::success(null, 'Recensione eliminata');
}
