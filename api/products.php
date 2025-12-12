<?php
/**
 * MIRA E-Commerce API
 * Products Endpoint
 */

require_once 'config.php';

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Router
switch ($method) {
    case 'GET':
        if (isset($_GET['id'])) {
            getProduct($db, $_GET['id']);
        } elseif (isset($_GET['slug'])) {
            getProductBySlug($db, $_GET['slug']);
        } else {
            getProducts($db, $_GET);
        }
        break;
    
    case 'POST':
        JWT::verify(); // Solo admin
        createProduct($db, json_decode(file_get_contents('php://input'), true));
        break;
    
    case 'PUT':
        JWT::verify(); // Solo admin
        if (!isset($_GET['id'])) {
            Response::error('ID prodotto mancante');
        }
        updateProduct($db, $_GET['id'], json_decode(file_get_contents('php://input'), true));
        break;
    
    case 'DELETE':
        JWT::verify(); // Solo admin
        if (!isset($_GET['id'])) {
            Response::error('ID prodotto mancante');
        }
        deleteProduct($db, $_GET['id']);
        break;
    
    default:
        Response::error('Metodo non supportato', 405);
}

/**
 * Get all products with filters
 */
function getProducts($db, $params) {
    $page = isset($params['page']) ? max(1, (int)$params['page']) : 1;
    $limit = isset($params['limit']) ? min(50, max(1, (int)$params['limit'])) : 12;
    $offset = ($page - 1) * $limit;
    
    $where = ['p.is_active = 1'];
    $bindings = [];
    
    // Filtri
    if (isset($params['category'])) {
        $where[] = 'c.slug = :category';
        $bindings[':category'] = $params['category'];
    }
    
    if (isset($params['tag'])) {
        $where[] = 't.slug = :tag';
        $bindings[':tag'] = $params['tag'];
    }
    
    if (isset($params['search'])) {
        $where[] = '(p.name LIKE :search OR p.description LIKE :search)';
        $bindings[':search'] = '%' . $params['search'] . '%';
    }
    
    if (isset($params['min_price'])) {
        $where[] = 'p.price >= :min_price';
        $bindings[':min_price'] = $params['min_price'];
    }
    
    if (isset($params['max_price'])) {
        $where[] = 'p.price <= :max_price';
        $bindings[':max_price'] = $params['max_price'];
    }
    
    if (isset($params['discount']) && $params['discount'] === 'true') {
        $where[] = 'p.is_discount = 1';
    }
    
    if (isset($params['featured']) && $params['featured'] === 'true') {
        $where[] = 'p.is_featured = 1';
    }
    
    $whereClause = implode(' AND ', $where);
    
    // Ordinamento
    $orderBy = 'p.created_at DESC';
    if (isset($params['sort'])) {
        switch ($params['sort']) {
            case 'price_asc':
                $orderBy = 'p.price ASC';
                break;
            case 'price_desc':
                $orderBy = 'p.price DESC';
                break;
            case 'name':
                $orderBy = 'p.name ASC';
                break;
            case 'popular':
                $orderBy = 'p.views DESC';
                break;
        }
    }
    
    // Query count
    $countSql = "SELECT COUNT(DISTINCT p.id) as total 
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 LEFT JOIN product_tags pt ON p.id = pt.product_id
                 LEFT JOIN tags t ON pt.tag_id = t.id
                 WHERE $whereClause";
    
    $countStmt = $db->prepare($countSql);
    $countStmt->execute($bindings);
    $total = $countStmt->fetch()['total'];
    
    // Query prodotti
    $sql = "SELECT 
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                GROUP_CONCAT(DISTINCT t.slug) as tags,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_tags pt ON p.id = pt.product_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = 1
            WHERE $whereClause
            GROUP BY p.id
            ORDER BY $orderBy
            LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($sql);
    
    // Bind parametri
    foreach ($bindings as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $products = $stmt->fetchAll();
    
    // Formatta prodotti
    foreach ($products as &$product) {
        $product['tags'] = $product['tags'] ? explode(',', $product['tags']) : [];
        $product['avg_rating'] = round((float)$product['avg_rating'], 1);
        $product['review_count'] = (int)$product['review_count'];
        
        // Get specs
        $specsStmt = $db->prepare("SELECT spec_key, spec_value FROM product_specs WHERE product_id = ? ORDER BY display_order");
        $specsStmt->execute([$product['id']]);
        $specs = $specsStmt->fetchAll();
        
        $product['specs'] = [];
        foreach ($specs as $spec) {
            $product['specs'][$spec['spec_key']] = $spec['spec_value'];
        }
    }
    
    Response::success([
        'products' => $products,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => (int)$total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * Get single product by ID
 */
function getProduct($db, $id) {
    $sql = "SELECT 
                p.*,
                c.name as category_name,
                c.slug as category_slug,
                GROUP_CONCAT(DISTINCT t.slug) as tags,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.id) as review_count
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_tags pt ON p.id = pt.product_id
            LEFT JOIN tags t ON pt.tag_id = t.id
            LEFT JOIN reviews r ON p.id = r.product_id AND r.is_approved = 1
            WHERE p.id = ? AND p.is_active = 1
            GROUP BY p.id";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    
    if (!$product) {
        Response::error('Prodotto non trovato', 404);
    }
    
    // Formatta
    $product['tags'] = $product['tags'] ? explode(',', $product['tags']) : [];
    $product['avg_rating'] = round((float)$product['avg_rating'], 1);
    $product['review_count'] = (int)$product['review_count'];
    
    // Get specs
    $specsStmt = $db->prepare("SELECT spec_key, spec_value FROM product_specs WHERE product_id = ? ORDER BY display_order");
    $specsStmt->execute([$product['id']]);
    $specs = $specsStmt->fetchAll();
    
    $product['specs'] = [];
    foreach ($specs as $spec) {
        $product['specs'][$spec['spec_key']] = $spec['spec_value'];
    }
    
    // Incrementa views
    $db->prepare("UPDATE products SET views = views + 1 WHERE id = ?")->execute([$id]);
    
    Response::success($product);
}

/**
 * Get product by slug
 */
function getProductBySlug($db, $slug) {
    $stmt = $db->prepare("SELECT id FROM products WHERE slug = ? AND is_active = 1");
    $stmt->execute([$slug]);
    $result = $stmt->fetch();
    
    if (!$result) {
        Response::error('Prodotto non trovato', 404);
    }
    
    getProduct($db, $result['id']);
}

/**
 * Create new product
 */
function createProduct($db, $data) {
    // Validazione
    $errors = [];
    
    if ($error = Validator::required($data['name'] ?? '', 'Nome')) $errors[] = $error;
    if ($error = Validator::required($data['description'] ?? '', 'Descrizione')) $errors[] = $error;
    if ($error = Validator::numeric($data['price'] ?? '', 'Prezzo')) $errors[] = $error;
    if ($error = Validator::required($data['image_url'] ?? '', 'Immagine')) $errors[] = $error;
    
    if (!empty($errors)) {
        Response::error('Validazione fallita', 400, $errors);
    }
    
    // Crea slug
    $slug = createSlug($data['name'], $db);
    
    try {
        $db->beginTransaction();
        
        // Insert product
        $sql = "INSERT INTO products 
                (name, slug, description, price, discount_price, is_discount, image_url, category_id, stock, is_featured)
                VALUES 
                (:name, :slug, :description, :price, :discount_price, :is_discount, :image_url, :category_id, :stock, :is_featured)";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':name' => $data['name'],
            ':slug' => $slug,
            ':description' => $data['description'],
            ':price' => $data['price'],
            ':discount_price' => $data['discount_price'] ?? null,
            ':is_discount' => isset($data['discount_price']) ? 1 : 0,
            ':image_url' => $data['image_url'],
            ':category_id' => $data['category_id'] ?? null,
            ':stock' => $data['stock'] ?? 0,
            ':is_featured' => $data['is_featured'] ?? 0
        ]);
        
        $productId = $db->lastInsertId();
        
        // Insert specs
        if (!empty($data['specs'])) {
            $specsStmt = $db->prepare("INSERT INTO product_specs (product_id, spec_key, spec_value, display_order) VALUES (?, ?, ?, ?)");
            $order = 0;
            foreach ($data['specs'] as $key => $value) {
                $specsStmt->execute([$productId, $key, $value, $order++]);
            }
        }
        
        // Insert tags
        if (!empty($data['tags'])) {
            $tagStmt = $db->prepare("INSERT INTO product_tags (product_id, tag_id) SELECT ?, id FROM tags WHERE slug = ?");
            foreach ($data['tags'] as $tagSlug) {
                $tagStmt->execute([$productId, $tagSlug]);
            }
        }
        
        $db->commit();
        
        Response::success(['id' => $productId], 'Prodotto creato con successo', 201);
        
    } catch (Exception $e) {
        $db->rollBack();
        error_log($e->getMessage());
        Response::error('Errore durante la creazione del prodotto', 500);
    }
}

/**
 * Update product
 */
function updateProduct($db, $id, $data) {
    try {
        $db->beginTransaction();
        
        // Build update query dynamically
        $fields = [];
        $params = [':id' => $id];
        
        $allowedFields = ['name', 'description', 'price', 'discount_price', 'is_discount', 'image_url', 'category_id', 'stock', 'is_featured', 'is_active'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $fields[] = "$field = :$field";
                $params[":$field"] = $data[$field];
            }
        }
        
        if (empty($fields)) {
            Response::error('Nessun campo da aggiornare');
        }
        
        $sql = "UPDATE products SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        // Update specs if provided
        if (isset($data['specs'])) {
            $db->prepare("DELETE FROM product_specs WHERE product_id = ?")->execute([$id]);
            
            $specsStmt = $db->prepare("INSERT INTO product_specs (product_id, spec_key, spec_value, display_order) VALUES (?, ?, ?, ?)");
            $order = 0;
            foreach ($data['specs'] as $key => $value) {
                $specsStmt->execute([$id, $key, $value, $order++]);
            }
        }
        
        // Update tags if provided
        if (isset($data['tags'])) {
            $db->prepare("DELETE FROM product_tags WHERE product_id = ?")->execute([$id]);
            
            $tagStmt = $db->prepare("INSERT INTO product_tags (product_id, tag_id) SELECT ?, id FROM tags WHERE slug = ?");
            foreach ($data['tags'] as $tagSlug) {
                $tagStmt->execute([$id, $tagSlug]);
            }
        }
        
        $db->commit();
        
        Response::success(null, 'Prodotto aggiornato con successo');
        
    } catch (Exception $e) {
        $db->rollBack();
        error_log($e->getMessage());
        Response::error('Errore durante l\'aggiornamento del prodotto', 500);
    }
}

/**
 * Delete product (soft delete)
 */
function deleteProduct($db, $id) {
    $stmt = $db->prepare("UPDATE products SET is_active = 0 WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        Response::error('Prodotto non trovato', 404);
    }
    
    Response::success(null, 'Prodotto eliminato con successo');
}

/**
 * Create unique slug
 */
function createSlug($name, $db) {
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
    
    // Check if exists
    $stmt = $db->prepare("SELECT COUNT(*) FROM products WHERE slug LIKE ?");
    $stmt->execute([$slug . '%']);
    $count = $stmt->fetchColumn();
    
    if ($count > 0) {
        $slug .= '-' . ($count + 1);
    }
    
    return $slug;
}
// Fine del file products.php
?>