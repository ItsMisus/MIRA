/**
 * CONFIG-ADMIN.JS
 * Configurazione per l'integrazione del pannello admin con il sito
 */

// Configurazione generale
const ADMIN_CONFIG = {
    // API
    apiUrl: 'admin-api.php',
    
    // File dati
    productsFile: 'products.json',
    categoriesFile: 'admin-categories.json',
    tagsFile: 'admin-tags.json',
    
    // Paginazione
    productsPerPage: 6,
    
    // Categorie disponibili
    defaultCategories: [
        'bestseller',
        'offerte',
        'pronta-consegna',
        'console-killer'
    ],
    
    // Tag predefiniti
    defaultTags: [
        { name: 'Best Seller', icon: '⭐', color: '#f39c12' },
        { name: 'Hot Deal', icon: '🔥', color: '#e74c3c' },
        { name: 'Nuovo', icon: '✨', color: '#9b59b6' },
        { name: 'Consigliato', icon: '👍', color: '#27ae60' }
    ]
};

/**
 * Funzione per caricare i prodotti dal file JSON
 */
async function loadProducts() {
    try {
        const response = await fetch(ADMIN_CONFIG.productsFile);
        const products = await response.json();
        return products;
    } catch (error) {
        console.error('Errore caricamento prodotti:', error);
        return [];
    }
}

/**
 * Funzione per caricare le categorie
 */
async function loadCategories() {
    try {
        const response = await fetch(ADMIN_CONFIG.categoriesFile);
        const categories = await response.json();
        return categories;
    } catch (error) {
        console.error('Errore caricamento categorie:', error);
        return [];
    }
}

/**
 * Funzione per caricare i tag
 */
async function loadTags() {
    try {
        const response = await fetch(ADMIN_CONFIG.tagsFile);
        const tags = await response.json();
        return tags;
    } catch (error) {
        console.error('Errore caricamento tag:', error);
        return [];
    }
}

/**
 * Funzione per filtrare prodotti per categoria
 */
function filterByCategory(products, categoryName) {
    return products.filter(product => 
        product.categories && product.categories.includes(categoryName)
    );
}

/**
 * Funzione per filtrare prodotti per tag
 */
function filterByTag(products, tagName) {
    return products.filter(product => 
        product.tags && product.tags.includes(tagName)
    );
}

/**
 * Funzione per paginare i prodotti
 */
function paginateProducts(products, page = 1) {
    const perPage = ADMIN_CONFIG.productsPerPage;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    
    return {
        data: products.slice(startIndex, endIndex),
        totalPages: Math.ceil(products.length / perPage),
        currentPage: page,
        totalProducts: products.length
    };
}

/**
 * Funzione per calcolare percentuale sconto
 */
function calculateDiscountPercent(originalPrice, discountPrice) {
    if (!originalPrice || !discountPrice) return 0;
    return Math.round((1 - (discountPrice / originalPrice)) * 100);
}

/**
 * Funzione per renderizzare il badge categoria
 */
function renderCategoryBadge(categoryName, categories) {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return '';
    
    return `<span class="category-badge" style="background: ${category.color}; padding: 5px 10px; border-radius: 4px; color: #fff; font-size: 0.85rem; display: inline-block; margin-right: 5px;">
        ${categoryName}
    </span>`;
}

/**
 * Funzione per renderizzare il badge tag
 */
function renderTagBadge(tagName, tags) {
    const tag = tags.find(t => t.name === tagName);
    if (!tag) return '';
    
    return `<span class="tag-badge" style="background: ${tag.color}; padding: 5px 10px; border-radius: 4px; color: #fff; font-size: 0.85rem; display: inline-block; margin-right: 5px;">
        ${tag.icon} ${tagName}
    </span>`;
}

/**
 * Funzione per renderizzare il prezzo con sconto
 */
function renderPrice(product) {
    if (product.discount && product.discountPrice) {
        const discountPercent = calculateDiscountPercent(product.price, product.discountPrice);
        return `
            <div class="price-container">
                <span class="original-price" style="text-decoration: line-through; color: #999;">€${product.price}</span>
                <span class="discount-price" style="color: #27ae60; font-weight: bold; font-size: 1.2rem;">€${product.discountPrice}</span>
                <span class="discount-badge" style="background: #e74c3c; color: #fff; padding: 5px 10px; border-radius: 4px; margin-left: 10px;">-${discountPercent}%</span>
            </div>
        `;
    }
    return `<span style="font-weight: bold; font-size: 1.1rem;">€${product.price}</span>`;
}

/**
 * Funzione helper per ottenere categoria per colore
 */
function getCategoryColor(categoryName, categories) {
    const category = categories.find(c => c.name === categoryName);
    return category ? category.color : '#9b59b6';
}

/**
 * Esporta le funzioni
 */
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ADMIN_CONFIG,
        loadProducts,
        loadCategories,
        loadTags,
        filterByCategory,
        filterByTag,
        paginateProducts,
        calculateDiscountPercent,
        renderCategoryBadge,
        renderTagBadge,
        renderPrice,
        getCategoryColor
    };
}
