<?php
/**
 * Script di migrazione da vecchio a nuovo formato
 * Esegui una volta sola per convertire i prodotti
 */

$productsFile = 'products.json';

// Carica prodotti vecchi
$products = json_decode(file_get_contents($productsFile), true);

// Migra ogni prodotto
foreach ($products as &$product) {
    // Se ha il campo "category" vecchio, convertilo a "categories" array
    if (isset($product['category']) && !isset($product['categories'])) {
        // Splitto le categorie multiple se separate da ||
        $cats = array_map('trim', explode('||', $product['category']));
        $product['categories'] = array_filter($cats);
        unset($product['category']);
    }
    
    // Assicura che categories sia un array
    if (!isset($product['categories'])) {
        $product['categories'] = [];
    }
    
    // Assicura che tags sia un array
    if (!isset($product['tags'])) {
        $product['tags'] = [];
    }
}

// Salva il file aggiornato
if (file_put_contents($productsFile, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo "✅ Migrazione completata! Prodotti convertiti: " . count($products);
} else {
    echo "❌ Errore nella migrazione";
}
?>
