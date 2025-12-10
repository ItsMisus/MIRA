/**
 * SHARED UTILITIES - Consolidated functions used across the site
 * Eliminates duplication in script.js, search.js, pcgaming.js, product.js
 */

// ==================== CONSTANTS ====================
window.APP_CONFIG = {
    PRODUCTS_FILE: 'products.json',
    PRODUCTS_PER_PAGE: 12,
    DISCOUNT_THRESHOLD: 0.05 // 5% minimum discount
};

// ==================== PRODUCT DISPLAY ====================

/**
 * Create product card HTML element
 */
window.createProductCard = function(product) {
    const div = document.createElement('div');
    div.className = 'product';
    
    if (product.discount) {
        div.classList.add('discount');
    }
    
    const displayPrice = product.discount ? product.discountPrice : product.price;
    div.dataset.name = product.name;
    div.dataset.price = displayPrice;
    div.dataset.desc = product.desc;
    div.dataset.img = product.img;

    // Price HTML
    let priceHTML = '';
    if (product.discount && product.discountPrice < product.price) {
        const discountPercent = Math.round(((product.price - product.discountPrice) / product.price) * 100);
        priceHTML = `
            <p>
                <span class="original-price">€ ${product.price.toFixed(2)}</span>
                <span style="color:#9b59b6; font-weight:700; margin:10px 0;">€ ${product.discountPrice.toFixed(2)}</span>
                <span style="color:#e74c3c; font-size:0.9rem;">-${discountPercent}%</span>
            </p>
        `;
    } else {
        priceHTML = `<p style="color:#9b59b6; font-weight:700; margin:10px 0;">€ ${product.price.toFixed(2)}</p>`;
    }

    div.innerHTML = `
        <img src="${product.img}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
        <h3>${product.name}</h3>
        <p>${product.desc}</p>
        ${priceHTML}
        <button class="add-to-cart">Aggiungi al carrello</button>
    `;

    return div;
};

/**
 * Display products in container
 */
window.displayProducts = function(products, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    products.forEach(product => {
        const card = window.createProductCard(product);
        container.appendChild(card);
    });

    // Attach click handlers
    window.attachProductCardListeners(containerId);
};

/**
 * Attach event listeners to product cards
 */
window.attachProductCardListeners = function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Product card click handler
    container.querySelectorAll('.product').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('add-to-cart')) {
                const name = card.dataset.name;
                window.location.href = `product.html?name=${encodeURIComponent(name)}`;
            }
        });
    });

    // Add to cart buttons
    container.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const productEl = btn.closest('.product');
            if (!productEl) return;

            const name = productEl.dataset.name;
            const price = parseFloat(productEl.dataset.price);

            if (!name || !price) {
                console.error('Invalid product data');
                return;
            }

            window.addToCart(name, price, productEl.dataset.img);
        });
    });
};

// ==================== CART MANAGEMENT ====================

/**
 * Add product to cart
 */
window.addToCart = function(name, price, img) {
    const storageKey = 'cart';
    
    // Get existing cart
    let cart = [];
    try {
        const cartData = localStorage.getItem(storageKey);
        if (cartData) {
            cart = JSON.parse(cartData);
        }
    } catch (err) {
        console.error('Error reading cart:', err);
    }

    // Check if product already in cart
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ name, price, img, qty: 1 });
    }

    // Save cart
    localStorage.setItem(storageKey, JSON.stringify(cart));

    // Update UI
    window.updateCartDisplay();

    // Show notification
    if (window.showNotification) {
        window.showNotification(`${name} aggiunto al carrello`);
    }

    console.log(`Product added: ${name} (€${price})`);
};

/**
 * Update cart display (sidebar)
 */
window.updateCartDisplay = function() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItems || !cartTotal) return;

    let cart = [];
    try {
        const cartData = localStorage.getItem('cart');
        if (cartData) {
            cart = JSON.parse(cartData);
        }
    } catch (err) {
        console.error('Error reading cart:', err);
    }

    // Clear and rebuild
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = "<p style='text-align:center; color:#aaa;'>Il carrello è vuoto</p>";
    } else {
        cart.forEach((item, index) => {
            const div = document.createElement('div');
            div.style.cssText = 'display:flex; gap:10px; margin-bottom:15px; background:#222; padding:10px; border-radius:8px; align-items:flex-start;';

            div.innerHTML = `
                <img src="${item.img}" alt="${item.name}" style="width:80px; height:60px; object-fit:cover; border-radius:6px;" onerror="this.src='https://via.placeholder.com/80x60?text=No+Image'">
                <div style="flex:1;">
                    <h4 style="margin:0 0 5px 0; font-size:1rem; color:#fff;">${item.name}</h4>
                    <p style="font-size:0.85rem; color:#ccc; margin:3px 0;">€ ${item.price.toFixed(2)}</p>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                        <button class="decrease" data-index="${index}" style="background:#9b59b6; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600;">−</button>
                        <span style="min-width:20px; text-align:center; font-weight:600; color:#9b59b6;">${item.qty}</span>
                        <button class="increase" data-index="${index}" style="background:#9b59b6; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600;">+</button>
                        <button class="remove" data-index="${index}" style="background:#e74c3c; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600; margin-left:auto;">✕</button>
                    </div>
                </div>
            `;

            // Attach quantity and removal listeners
            div.querySelector('.increase').addEventListener('click', () => {
                cart[index].qty += 1;
                localStorage.setItem('cart', JSON.stringify(cart));
                window.updateCartDisplay();
            });

            div.querySelector('.decrease').addEventListener('click', () => {
                if (cart[index].qty > 1) {
                    cart[index].qty -= 1;
                    localStorage.setItem('cart', JSON.stringify(cart));
                    window.updateCartDisplay();
                }
            });

            div.querySelector('.remove').addEventListener('click', () => {
                cart.splice(index, 1);
                localStorage.setItem('cart', JSON.stringify(cart));
                window.updateCartDisplay();
            });

            cartItems.appendChild(div);
        });
    }

    // Update total
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    cartTotal.textContent = total.toFixed(2);
};

// ==================== PAGINATION ====================

/**
 * Get paginated products
 */
window.paginateProducts = function(products, page = 1, perPage = 12) {
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return {
        items: products.slice(startIndex, endIndex),
        total: products.length,
        pages: Math.ceil(products.length / perPage),
        currentPage: page
    };
};

/**
 * Create pagination controls
 */
window.createPaginationControls = function(totalPages, currentPage, onPageChange) {
    if (totalPages <= 1) return null;

    const container = document.createElement('div');
    container.className = 'pagination-container';
    container.style.cssText = 'display:flex; justify-content:center; gap:10px; margin:30px 0; flex-wrap:wrap;';

    // Previous button
    if (currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '← Precedente';
        prevBtn.style.cssText = 'padding:8px 16px; background:#9b59b6; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600;';
        prevBtn.addEventListener('click', () => onPageChange(currentPage - 1));
        container.appendChild(prevBtn);
    }

    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Pagina ${currentPage} di ${totalPages}`;
    pageInfo.style.cssText = 'padding:8px 16px; color:#ccc; font-weight:600;';
    container.appendChild(pageInfo);

    // Next button
    if (currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = 'Prossima →';
        nextBtn.style.cssText = 'padding:8px 16px; background:#9b59b6; color:#fff; border:none; border-radius:6px; cursor:pointer; font-weight:600;';
        nextBtn.addEventListener('click', () => onPageChange(currentPage + 1));
        container.appendChild(nextBtn);
    }

    return container;
};

// ==================== FILTERING ====================

/**
 * Filter products by category
 */
window.filterByCategory = function(products, categoryName) {
    return products.filter(p => {
        // Support both old format (category) and new (categories[])
        if (Array.isArray(p.categories)) {
            return p.categories.includes(categoryName);
        }
        return p.category === categoryName;
    });
};

/**
 * Filter products by search query
 */
window.filterBySearch = function(products, query) {
    const q = query.toLowerCase();
    return products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.desc.toLowerCase().includes(q) ||
        (p.components && p.components.toLowerCase().includes(q))
    );
};

/**
 * Filter products by price range
 */
window.filterByPrice = function(products, minPrice, maxPrice) {
    return products.filter(p => {
        const price = p.discount ? p.discountPrice : p.price;
        return price >= minPrice && price <= maxPrice;
    });
};

// ==================== UTILITIES ====================

/**
 * Format price
 */
window.formatPrice = function(price) {
    return `€ ${parseFloat(price).toFixed(2)}`;
};

/**
 * Calculate discount percentage
 */
window.getDiscountPercent = function(original, discounted) {
    if (!original || !discounted || discounted >= original) return 0;
    return Math.round(((original - discounted) / original) * 100);
};

/**
 * Load JSON file
 */
window.loadJSON = async function(filepath) {
    try {
        const response = await fetch(filepath);
        if (!response.ok) throw new Error(`Failed to load ${filepath}`);
        return await response.json();
    } catch (err) {
        console.error(`Error loading JSON:`, err);
        return null;
    }
};

/**
 * Show notification
 */
window.showNotification = function(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #9b59b6;
        color: #fff;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);
};

// ==================== INITIALIZATION ====================

/**
 * Initialize utilities on page load
 */
window.initUtilities = function() {
    // Load language system
    if (window.initLanguageSystem) {
        window.initLanguageSystem();
    }

    // Initialize storage system
    if (window.storage) {
        window.storage.init();
    }

    // Update cart display on load
    window.updateCartDisplay();

    console.log('Utilities initialized');
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initUtilities);
} else {
    window.initUtilities();
}
