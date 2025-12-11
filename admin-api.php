<?php
/**
 * ADMIN API - MINUTECH
 * Gestisce le operazioni CRUD per prodotti, categorie e tag
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Percorsi dei file dati
$productsFile = 'products.json';
$categoriesFile = 'admin-categories.json';
$tagsFile = 'admin-tags.json';

// Funzioni di utilità
function loadJSON($file) {
    if (!file_exists($file)) {
        return [];
    }
    return json_decode(file_get_contents($file), true) ?: [];
}

function saveJSON($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false;
}

// Ottieni l'azione
$action = $_GET['action'] ?? null;

switch ($action) {
    case 'getAll':
        handleGetAll();
        break;
    
    case 'addProduct':
        handleAddProduct();
        break;
    
    case 'updateProduct':
        handleUpdateProduct();
        break;
    
    case 'deleteProduct':
        handleDeleteProduct();
        break;
    
    case 'addCategory':
        handleAddCategory();
        break;
    
    case 'deleteCategory':
        handleDeleteCategory();
        break;
    
    case 'addTag':
        handleAddTag();
        break;
    
    case 'deleteTag':
        handleDeleteTag();
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Azione non valida']);
}

// ==================== HANDLER PRODOTTI ====================

function handleGetAll() {
    global $productsFile, $categoriesFile, $tagsFile;
    
    $products = loadJSON($productsFile);
    $categories = loadJSON($categoriesFile);
    $tags = loadJSON($tagsFile);
    
    echo json_encode([
        'success' => true,
        'products' => $products,
        'categories' => $categories,
        'tags' => $tags
    ]);
}

function handleAddProduct() {
    global $productsFile;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validazione
    if (empty($data['name']) || empty($data['price']) || empty($data['desc']) || empty($data['components'])) {
        echo json_encode(['success' => false, 'message' => 'Campi obbligatori mancanti']);
        return;
    }
    
    $products = loadJSON($productsFile);
    
    // Crea il nuovo prodotto
    $newProduct = [
        'name' => $data['name'],
        'price' => floatval($data['price']),
        'discountPrice' => $data['discountPrice'] ?? null,
        'discount' => $data['discount'] ?? false,
        'desc' => $data['desc'],
        'components' => $data['components'],
        'img' => $data['img'],
        'categories' => $data['categories'] ?? [],
        'tags' => $data['tags'] ?? []
    ];
    
    $products[] = $newProduct;
    
    if (saveJSON($productsFile, $products)) {
        echo json_encode(['success' => true, 'message' => 'Prodotto aggiunto']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nel salvataggio']);
    }
}

function handleUpdateProduct() {
    global $productsFile;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $index = $data['index'] ?? null;
    $product = $data['product'] ?? null;
    
    if ($index === null || $product === null) {
        echo json_encode(['success' => false, 'message' => 'Dati non validi']);
        return;
    }
    
    $products = loadJSON($productsFile);
    
    if (!isset($products[$index])) {
        echo json_encode(['success' => false, 'message' => 'Prodotto non trovato']);
        return;
    }
    
    $products[$index] = array_merge($products[$index], $product);
    
    if (saveJSON($productsFile, $products)) {
        echo json_encode(['success' => true, 'message' => 'Prodotto aggiornato']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nel salvataggio']);
    }
}

function handleDeleteProduct() {
    global $productsFile;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $index = $data['index'] ?? null;
    
    if ($index === null) {
        echo json_encode(['success' => false, 'message' => 'Indice non valido']);
        return;
    }
    
    $products = loadJSON($productsFile);
    
    if (!isset($products[$index])) {
        echo json_encode(['success' => false, 'message' => 'Prodotto non trovato']);
        return;
    }
    
    array_splice($products, $index, 1);
    
    if (saveJSON($productsFile, $products)) {
        echo json_encode(['success' => true, 'message' => 'Prodotto eliminato']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nell\'eliminazione']);
    }
}

// ==================== HANDLER CATEGORIE ====================

function handleAddCategory() {
    global $categoriesFile;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['name'])) {
        echo json_encode(['success' => false, 'message' => 'Nome categoria obbligatorio']);
        return;
    }
    
    $categories = loadJSON($categoriesFile);
    
    // Controlla se esiste già
    foreach ($categories as $cat) {
        if ($cat['name'] === $data['name']) {
            echo json_encode(['success' => false, 'message' => 'Categoria già esistente']);
            return;
        }
    }
    
    $newCategory = [
        'name' => $data['name'],
        'color' => $data['color'] ?? '#9b59b6',
        'desc' => $data['desc'] ?? ''
    ];
    
    $categories[] = $newCategory;
    
    if (saveJSON($categoriesFile, $categories)) {
        echo json_encode(['success' => true, 'message' => 'Categoria aggiunta']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nel salvataggio']);
    }
}

function handleDeleteCategory() {
    global $categoriesFile, $productsFile;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $index = $data['index'] ?? null;
    
    if ($index === null) {
        echo json_encode(['success' => false, 'message' => 'Indice non valido']);
        return;
    }
    
    $categories = loadJSON($categoriesFile);
    
    if (!isset($categories[$index])) {
        echo json_encode(['success' => false, 'message' => 'Categoria non trovata']);
        return;
    }
    
    $categoryName = $categories[$index]['name'];
    
    // Rimuovi la categoria da tutti i prodotti
    $products = loadJSON($productsFile);
    foreach ($products as &$product) {
        $product['categories'] = array_filter($product['categories'], function($cat) use ($categoryName) {
            return $cat !== $categoryName;
        });
        $product['categories'] = array_values($product['categories']); // Reindex
    }
    saveJSON($productsFile, $products);
    
    array_splice($categories, $index, 1);
    
    if (saveJSON($categoriesFile, $categories)) {
        echo json_encode(['success' => true, 'message' => 'Categoria eliminata']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nell\'eliminazione']);
    }
}

// ==================== HANDLER TAG VISIVI ====================

function handleAddTag() {
    global $tagsFile;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['name']) || empty($data['icon'])) {
        echo json_encode(['success' => false, 'message' => 'Nome e icona obbligatori']);
        return;
    }
    
    $tags = loadJSON($tagsFile);
    
    // Controlla se esiste già
    foreach ($tags as $tag) {
        if ($tag['name'] === $data['name']) {
            echo json_encode(['success' => false, 'message' => 'Tag già esistente']);
            return;
        }
    }
    
    $newTag = [
        'name' => $data['name'],
        'icon' => $data['icon'],
        'color' => $data['color'] ?? '#e74c3c',
        'desc' => $data['desc'] ?? ''
    ];
    
    $tags[] = $newTag;
    
    if (saveJSON($tagsFile, $tags)) {
        echo json_encode(['success' => true, 'message' => 'Tag aggiunto']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nel salvataggio']);
    }
}

function handleDeleteTag() {
    global $tagsFile, $productsFile;
    
    $data = json_decode(file_get_contents('php://input'), true);
    $index = $data['index'] ?? null;
    
    if ($index === null) {
        echo json_encode(['success' => false, 'message' => 'Indice non valido']);
        return;
    }
    
    $tags = loadJSON($tagsFile);
    
    if (!isset($tags[$index])) {
        echo json_encode(['success' => false, 'message' => 'Tag non trovato']);
        return;
    }
    
    $tagName = $tags[$index]['name'];
    
    // Rimuovi il tag da tutti i prodotti
    $products = loadJSON($productsFile);
    foreach ($products as &$product) {
        $product['tags'] = array_filter($product['tags'], function($tag) use ($tagName) {
            return $tag !== $tagName;
        });
        $product['tags'] = array_values($product['tags']); // Reindex
    }
    saveJSON($productsFile, $products);
    
    array_splice($tags, $index, 1);
    
    if (saveJSON($tagsFile, $tags)) {
        echo json_encode(['success' => true, 'message' => 'Tag eliminato']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Errore nell\'eliminazione']);
    }
}
?>
