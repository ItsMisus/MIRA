/**
 * MIRA E-Commerce Frontend API Client
 * Gestisce tutte le chiamate al backend
 */

const API_BASE_URL = 'http://localhost/mira_ecommerce/api';

// ==================== API CLIENT CLASS ====================
class MiraAPI {
    constructor(baseURL = API_BASE_URL) {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('miraToken');
    }

    /**
     * Generic request handler
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Errore nella richiesta');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // ==================== PRODUCTS ====================
    
    /**
     * Get all products with filters
     */
    async getProducts(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`products.php?${params}`);
    }

    /**
     * Get single product by ID
     */
    async getProduct(id) {
        return this.request(`products.php?id=${id}`);
    }

    /**
     * Get product by slug
     */
    async getProductBySlug(slug) {
        return this.request(`products.php?slug=${slug}`);
    }

    /**
     * Search products
     */
    async searchProducts(query, filters = {}) {
        return this.getProducts({ ...filters, search: query });
    }

    // ==================== REVIEWS ====================
    
    /**
     * Get reviews for product
     */
    async getReviews(productId) {
        return this.request(`reviews.php?product_id=${productId}`);
    }

    /**
     * Submit review
     */
    async submitReview(productId, data) {
        return this.request('reviews.php', {
            method: 'POST',
            body: JSON.stringify({
                product_id: productId,
                ...data
            })
        });
    }

    // ==================== CART ====================
    
    /**
     * Get cart
     */
    async getCart() {
        return this.request('cart.php');
    }

    /**
     * Add to cart
     */
    async addToCart(productId, quantity = 1) {
        return this.request('cart.php', {
            method: 'POST',
            body: JSON.stringify({ product_id: productId, quantity })
        });
    }

    /**
     * Update cart item
     */
    async updateCartItem(itemId, quantity) {
        return this.request(`cart.php?id=${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });
    }

    /**
     * Remove from cart
     */
    async removeFromCart(itemId) {
        return this.request(`cart.php?id=${itemId}`, {
            method: 'DELETE'
        });
    }

    /**
     * Clear cart
     */
    async clearCart() {
        return this.request('cart.php?clear=1', {
            method: 'DELETE'
        });
    }

    // ==================== ORDERS ====================
    
    /**
     * Create order
     */
    async createOrder(orderData) {
        return this.request('orders.php', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
    }

    /**
     * Get user orders
     */
    async getOrders() {
        return this.request('orders.php');
    }

    /**
     * Get single order
     */
    async getOrder(orderId) {
        return this.request(`orders.php?id=${orderId}`);
    }

    // ==================== AUTH ====================
    
    /**
     * Login
     */
    async login(email, password) {
        const response = await this.request('auth.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'login', email, password })
        });
        
        if (response.data.token) {
            this.token = response.data.token;
            localStorage.setItem('miraToken', this.token);
            localStorage.setItem('miraUser', JSON.stringify(response.data.user));
        }
        
        return response;
    }

    /**
     * Register
     */
    async register(userData) {
        return this.request('auth.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'register', ...userData })
        });
    }

    /**
     * Logout
     */
    logout() {
        this.token = null;
        localStorage.removeItem('miraToken');
        localStorage.removeItem('miraUser');
    }

    /**
     * Check if logged in
     */
    isAuthenticated() {
        return !!this.token;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        const user = localStorage.getItem('miraUser');
        return user ? JSON.parse(user) : null;
    }

    // ==================== CONTACT ====================
    
    /**
     * Send contact message
     */
    async sendContactMessage(data) {
        return this.request('contact.php', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
}

// ==================== EXPORT ====================
const api = new MiraAPI();

// Make globally available
if (typeof window !== 'undefined') {
    window.MiraAPI = api;
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Display products in grid
 */
async function displayProductsFromAPI(containerId, filters = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        // Show loading
        container.innerHTML = '<div style="text-align:center; padding:40px;">Caricamento...</div>';

        const response = await api.getProducts(filters);
        const products = response.data.products;

        if (products.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#6b7280; padding:40px;">Nessun prodotto trovato</p>';
            return;
        }

        container.innerHTML = '';

        products.forEach(product => {
            const card = createProductCard(product);
            container.appendChild(card);
        });

        // Update count if exists
        const countEl = document.getElementById('productsCount');
        if (countEl && response.data.pagination) {
            countEl.textContent = `${response.data.pagination.total} prodotti`;
        }

    } catch (error) {
        console.error('Error loading products:', error);
        container.innerHTML = '<p style="text-align:center; color:#e74c3c; padding:40px;"></p>';
    }
}

/**
 * Create product card element
 */
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    const finalPrice = product.is_discount ? product.discount_price : product.price;
    const hasDiscount = product.is_discount && product.discount_price < product.price;

    card.innerHTML = `
        ${hasDiscount ? '<span class="discount-badge">OFFERTA</span>' : ''}
        <div class="product-image">
            <img src="${product.image_url}" alt="${product.name}" loading="lazy">
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p class="product-desc">${product.description.substring(0, 80)}...</p>
            <div class="product-rating">
                <div class="stars">
                    ${[1, 2, 3, 4, 5].map(star => 
                        `<span class="star ${star <= Math.round(product.avg_rating) ? 'filled' : ''}">★</span>`
                    ).join('')}
                </div>
                <span class="rating-count">(${product.review_count})</span>
            </div>
            <div class="product-price">
                ${hasDiscount ? `
                    <span class="original-price">€${parseFloat(product.price).toFixed(2)}</span>
                    <span class="current-price">€${parseFloat(finalPrice).toFixed(2)}</span>
                ` : `
                    <span class="current-price">€${parseFloat(finalPrice).toFixed(2)}</span>
                `}
            </div>
        </div>
    `;

    card.addEventListener('click', () => {
        window.location.href = `product.html?id=${product.id}`;
    });

    return card;
}

/**
 * Load single product
 */
async function loadProductFromAPI(productId) {
    try {
        const response = await api.getProduct(productId);
        const product = response.data;

        // Update page title
        document.title = `${product.name} - MIRA`;

        // Update breadcrumb
        const breadcrumb = document.getElementById('productBreadcrumb');
        if (breadcrumb) breadcrumb.textContent = product.name;

        // Update main image
        const mainImage = document.getElementById('mainProductImage');
        if (mainImage) {
            mainImage.src = product.image_url;
            mainImage.alt = product.name;
        }

        // Update product info
        const title = document.getElementById('productTitle');
        if (title) title.textContent = product.name;

        const desc = document.getElementById('productDescription');
        if (desc) desc.textContent = product.description;

        // Update rating
        const starsContainer = document.getElementById('productStars');
        if (starsContainer) {
            starsContainer.innerHTML = [1, 2, 3, 4, 5].map(star => 
                `<span class="star ${star <= Math.round(product.avg_rating) ? 'filled' : ''}">★</span>`
            ).join('');
        }

        const reviewCount = document.getElementById('reviewCount');
        if (reviewCount) reviewCount.textContent = `(${product.review_count} recensioni)`;

        // Update price
        const priceEl = document.getElementById('productPrice');
        const priceOriginalEl = document.getElementById('productPriceOriginal');
        
        if (priceEl) {
            const finalPrice = product.is_discount ? product.discount_price : product.price;
            priceEl.textContent = `€${parseFloat(finalPrice).toFixed(2)}`;
            
            if (priceOriginalEl) {
                if (product.is_discount) {
                    priceOriginalEl.textContent = `€${parseFloat(product.price).toFixed(2)}`;
                    priceOriginalEl.style.display = 'block';
                } else {
                    priceOriginalEl.style.display = 'none';
                }
            }
        }

        // Update specs
        const specsQuick = document.getElementById('specsQuick');
        const specsTable = document.getElementById('specsTable');
        
        if (product.specs && Object.keys(product.specs).length > 0) {
            const specsHTML = Object.entries(product.specs).map(([key, value]) => `
                <div class="spec-row">
                    <span class="spec-label">${key.toUpperCase()}</span>
                    <span class="spec-value">${value}</span>
                </div>
            `).join('');
            
            if (specsQuick) specsQuick.innerHTML = specsHTML;
            if (specsTable) specsTable.innerHTML = specsHTML;
        }

        // Load reviews
        loadReviewsFromAPI(productId);

        return product;

    } catch (error) {
        console.error('Error loading product:', error);
        window.location.href = 'notfound.html';
    }
}

/**
 * Load reviews from API
 */
async function loadReviewsFromAPI(productId) {
    const container = document.getElementById('reviewsContainer');
    if (!container) return;

    try {
        const response = await api.getReviews(productId);
        const reviews = response.data;

        if (reviews.length === 0) {
            container.innerHTML = '<p style="color:#6b7280;">Nessuna recensione disponibile. Sii il primo a recensire!</p>';
            return;
        }

        container.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${review.reviewer_name}</span>
                    <span class="review-stars">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p class="review-text">${review.comment}</p>
                <p style="font-size:13px; color:#9ca3af; margin-top:8px;">
                    ${new Date(review.created_at).toLocaleDateString('it-IT')}
                </p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

/**
 * Initialize API-based cart
 */
async function initAPICart() {
    // This will replace the localStorage cart
    // Implementation will sync with backend when user logs in
    console.log('API Cart initialized');
}

// ==================== AUTO-INITIALIZE ====================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize header functionality on all pages
    initializeHeader();
    
    // Auto-load products if on catalog pages
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid && window.location.pathname.includes('pcgaming')) {
        displayProductsFromAPI('productsGrid');
    }
    
    // Auto-load home products
    const homeGrid = document.getElementById('homeProductsGrid');
    if (homeGrid) {
        displayProductsFromAPI('homeProductsGrid', { featured: 'true', limit: 4 });
    }
    
    // Auto-load product detail
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    if (productId && window.location.pathname.includes('product.html')) {
        loadProductFromAPI(productId);
    }
});

/**
 * Initialize header functionality
 */
function initializeHeader() {
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const mainSearchInput = document.getElementById('mainSearchInput');

    if (searchBtn && searchOverlay) {
        searchBtn.addEventListener('click', () => {
            searchOverlay.classList.add('active');
            setTimeout(() => mainSearchInput?.focus(), 100);
        });
    }

    if (searchClose && searchOverlay) {
        searchClose.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
        });
    }

    if (mainSearchInput) {
        mainSearchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const query = mainSearchInput.value.trim();
                if (query) {
                    // Save search and redirect
                    sessionStorage.setItem('searchQuery', query);
                    window.location.href = `risultati.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Cart functionality
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');

    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.add('active');
        });
    }

    if (cartClose && cartSidebar) {
        cartClose.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
        });
    }

    // Load cart items
    loadCartItems();
}

/**
 * Load cart items
 */
async function loadCartItems() {
    const cartContent = document.getElementById('cartContent');
    if (!cartContent) return;

    try {
        if (api.isAuthenticated()) {
            // Load from API
            const response = await api.getCart();
            const items = response.data.items || [];
            
            if (items.length === 0) {
                cartContent.innerHTML = '<p class="cart-empty">Il tuo carrello è vuoto</p>';
                return;
            }

            // Render items
            cartContent.innerHTML = items.map(item => `
                <div class="cart-item">
                    <img src="${item.product.image_url}" alt="${item.product.name}">
                    <div class="cart-item-info">
                        <h4>${item.product.name}</h4>
                        <p class="cart-item-price">€${parseFloat(item.product.price).toFixed(2)}</p>
                        <div class="cart-item-quantity">
                            <button onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(${item.id})" class="cart-item-remove">×</button>
                </div>
            `).join('');

        } else {
            // Fallback to localStorage
            const localCart = JSON.parse(localStorage.getItem('miraCart') || '[]');
            if (localCart.length === 0) {
                cartContent.innerHTML = '<p class="cart-empty">Il tuo carrello è vuoto</p>';
            }
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

// ==================== GLOBAL FUNCTIONS ====================
window.updateCartQuantity = async (itemId, quantity) => {
    try {
        await api.updateCartItem(itemId, quantity);
        await loadCartItems();
    } catch (error) {
        console.error('Error updating cart:', error);
    }
};

window.removeFromCart = async (itemId) => {
    try {
        await api.removeFromCart(itemId);
        await loadCartItems();
    } catch (error) {
        console.error('Error removing from cart:', error);
    }
};

// ==================== EXPORT FOR USE ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MiraAPI, api, displayProductsFromAPI, loadProductFromAPI };
}