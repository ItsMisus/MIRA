<?php
/**
 * MIRA E-Commerce API
 * Orders Endpoint - api/orders.php
 *
 * L'ordine nasce dal carrello dell'utente. Prezzi e disponibilita' si
 * rileggono qui, dentro una transazione: quello che manda il browser conta
 * solo per indirizzo e note, mai per cosa si compra o a che prezzo.
 *
 * Non c'e' pagamento online: l'ordine resta "pending" finche' il team non
 * conferma il pagamento con il cliente.
 */

require_once 'config.php';
require_once 'email_helper.php';

$db     = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$user = JWT::verify();

switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getOrder($db, (int)$user['id'], (int)$_GET['id']);
        } else {
            listOrders($db, (int)$user['id']);
        }
        break;

    case 'POST':
        createOrder($db, (int)$user['id'], readJsonBody());
        break;

    default:
        Response::error('Metodo non supportato', 405);
}

/**
 * Crea l'ordine dal carrello: verifica e scala le scorte, salva le righe,
 * svuota il carrello. Tutto o niente.
 */
function createOrder($db, $userId, $data) {
    rateLimit($db, 'order:' . $userId, 5, 3600);

    $errors = [];
    $fields = [
        'full_name'   => ['Nome e cognome', 120],
        'street'      => ['Indirizzo', 255],
        'city'        => ['Città', 100],
        'province'    => ['Provincia', 100],
        'postal_code' => ['CAP', 20],
        'phone'       => ['Telefono', 20],
    ];
    foreach ($fields as $key => [$label, $max]) {
        if ($error = Validator::required($data[$key] ?? '', $label))       $errors[] = $error;
        if ($error = Validator::maxLength($data[$key] ?? '', $max, $label)) $errors[] = $error;
    }
    if (!preg_match('/^[0-9]{5}$/', trim((string)($data['postal_code'] ?? '')))) {
        $errors[] = 'CAP non valido (5 cifre)';
    }
    if (!preg_match('/^[0-9 +().-]{6,20}$/', trim((string)($data['phone'] ?? '')))) {
        $errors[] = 'Telefono non valido';
    }
    if ($error = Validator::maxLength($data['notes'] ?? '', 1000, 'Note')) $errors[] = $error;

    if (!empty($errors)) {
        Response::error('Validazione fallita', 400, $errors);
    }

    $address = sprintf(
        "%s\n%s\n%s %s (%s)\n%s",
        trim($data['full_name']),
        trim($data['street']),
        trim($data['postal_code']),
        trim($data['city']),
        trim($data['province']),
        'Italia'
    );

    $accountStmt = $db->prepare('SELECT email FROM users WHERE id = ?');
    $accountStmt->execute([$userId]);
    $email = $accountStmt->fetchColumn();

    try {
        $db->beginTransaction();

        // FOR UPDATE: due ordini contemporanei sull'ultimo pezzo non passano
        // entrambi il controllo delle scorte.
        $itemsStmt = $db->prepare("
            SELECT ci.product_id, ci.quantity, p.name, p.price, p.discount_price,
                   p.is_discount, p.stock, p.is_active
            FROM carts c
            JOIN cart_items ci ON ci.cart_id = c.id
            JOIN products p    ON p.id = ci.product_id
            WHERE c.user_id = ?
            FOR UPDATE
        ");
        $itemsStmt->execute([$userId]);
        $items = $itemsStmt->fetchAll();

        if (empty($items)) {
            $db->rollBack();
            Response::error('Il carrello è vuoto', 400);
        }

        $total = 0.0;
        $lines = [];
        foreach ($items as $item) {
            $qty = (int)$item['quantity'];
            if (!$item['is_active']) {
                $db->rollBack();
                Response::error("\"{$item['name']}\" non è più disponibile: toglilo dal carrello.", 409);
            }
            if ($qty < 1 || $qty > (int)$item['stock']) {
                $db->rollBack();
                Response::error("Scorte insufficienti per \"{$item['name']}\": disponibili {$item['stock']}.", 409);
            }
            $unit = $item['is_discount'] && $item['discount_price'] !== null
                ? (float)$item['discount_price']
                : (float)$item['price'];
            $subtotal = round($unit * $qty, 2);
            $total   += $subtotal;
            $lines[]  = [$item['product_id'], $item['name'], $qty, $unit, $subtotal];
        }
        $total = round($total, 2);

        $orderNumber = 'MIRA-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3)));

        $db->prepare("
            INSERT INTO orders (user_id, order_number, status, total_amount, shipping_address,
                                billing_address, customer_email, customer_phone, notes)
            VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?)
        ")->execute([
            $userId, $orderNumber, $total, $address, $address, $email,
            trim($data['phone']), trim((string)($data['notes'] ?? '')) ?: null
        ]);
        $orderId = (int)$db->lastInsertId();

        $lineStmt  = $db->prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
                                   VALUES (?, ?, ?, ?, ?, ?)");
        $stockStmt = $db->prepare("UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?");
        foreach ($lines as [$productId, $name, $qty, $unit, $subtotal]) {
            $lineStmt->execute([$orderId, $productId, $name, $qty, $unit, $subtotal]);
            $stockStmt->execute([$qty, $productId, $qty]);
            if ($stockStmt->rowCount() !== 1) {
                throw new RuntimeException("Scorte cambiate durante l'ordine per il prodotto $productId");
            }
        }

        $db->prepare("DELETE ci FROM cart_items ci JOIN carts c ON c.id = ci.cart_id WHERE c.user_id = ?")
           ->execute([$userId]);

        $db->commit();

    } catch (Throwable $e) {
        if ($db->inTransaction()) $db->rollBack();
        error_log('Order error: ' . $e->getMessage());
        Response::error('Errore durante la creazione dell\'ordine. Riprova.', 500);
    }

    // Le email non devono mai far fallire un ordine gia' salvato.
    try {
        EmailHelper::sendOrderNotifications([
            'order_number' => $orderNumber,
            'total'        => $total,
            'email'        => $email,
            'phone'        => trim($data['phone']),
            'address'      => $address,
            'notes'        => trim((string)($data['notes'] ?? '')),
            'lines'        => $lines,
        ]);
    } catch (Throwable $e) {
        error_log('Order email error: ' . $e->getMessage());
    }

    Response::success([
        'order_id'     => $orderId,
        'order_number' => $orderNumber,
        'total'        => $total,
        'status'       => 'pending'
    ], 'Ordine ricevuto! Ti contatteremo per il pagamento e la spedizione.', 201);
}

function listOrders($db, $userId) {
    $stmt = $db->prepare("SELECT id, order_number, status, total_amount, created_at
                          FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC");
    $stmt->execute([$userId]);
    $orders = $stmt->fetchAll();
    foreach ($orders as &$order) {
        $order['id']           = (int)$order['id'];
        $order['total_amount'] = (float)$order['total_amount'];
    }
    unset($order);
    Response::success($orders);
}

function getOrder($db, $userId, $orderId) {
    // Solo gli ordini dell'utente: l'id nella query non basta.
    $stmt = $db->prepare("SELECT id, order_number, status, total_amount, shipping_address,
                                 customer_phone, notes, created_at
                          FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$orderId, $userId]);
    $order = $stmt->fetch();
    if (!$order) {
        Response::error('Ordine non trovato', 404);
    }

    $items = $db->prepare("SELECT product_id, product_name, quantity, unit_price, subtotal
                           FROM order_items WHERE order_id = ?");
    $items->execute([$orderId]);
    $order['items']        = $items->fetchAll();
    $order['id']           = (int)$order['id'];
    $order['total_amount'] = (float)$order['total_amount'];

    Response::success($order);
}
