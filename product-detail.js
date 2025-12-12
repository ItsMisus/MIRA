// ==================== PRODUCT DETAIL PAGE ====================

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'notfound.html';
        return;
    }
    
    loadProduct(productId);
    initTabs();
});

// Load Product Data
function loadProduct(productId) {
    const products = JSON.parse(localStorage.getItem('miraProducts')) || [];
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        window.location.href = 'notfound.html';
        return;
    }
    
    // Set Title and Meta
    document.title = `${product.name} - MIRA`;
    
    // Breadcrumb
    document.getElementById('productBreadcrumb').textContent = product.name;
    
    // Main Image
    const mainImage = document.getElementById('mainProductImage');
    mainImage.src = product.img;
    mainImage.alt = product.name;
    
    // Thumbnails (use same image for now, can be extended)
    const thumbnailsContainer = document.getElementById('thumbnailsContainer');
    for (let i = 0; i < 4; i++) {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail-item ${i === 0 ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${product.img}" alt="${product.name}">`;
        thumb.addEventListener('click', () => {
            document.querySelectorAll('.thumbnail-item').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            mainImage.src = product.img;
        });
        thumbnailsContainer.appendChild(thumb);
    }
    
    // Product Info
    document.getElementById('productTitle').textContent = product.name;
    document.getElementById('productDescription').textContent = product.desc;
    
    // Rating
    const avgRating = getAverageRating(productId);
    const reviewCount = getReviewCount(productId);
    displayStars('productStars', avgRating);
    document.getElementById('reviewCount').textContent = `(${reviewCount} recensioni)`;
    
    // Price
    const priceEl = document.getElementById('productPrice');
    const priceOriginalEl = document.getElementById('productPriceOriginal');
    
    if (product.discount) {
        priceEl.textContent = `€${product.discountPrice.toFixed(2)}`;
        priceOriginalEl.textContent = `€${product.price.toFixed(2)}`;
        priceOriginalEl.style.display = 'block';
    } else {
        priceEl.textContent = `€${product.price.toFixed(2)}`;
        priceOriginalEl.style.display = 'none';
    }
    
    // Specs Quick View
    const specsQuick = document.getElementById('specsQuick');
    specsQuick.innerHTML = '';
    
    if (product.specs) {
        Object.entries(product.specs).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'spec-row';
            row.innerHTML = `
                <span class="spec-label">${key.toUpperCase()}</span>
                <span class="spec-value">${value}</span>
            `;
            specsQuick.appendChild(row);
        });
    }
    
    // Specs Table (Full)
    const specsTable = document.getElementById('specsTable');
    specsTable.innerHTML = '';
    
    if (product.specs) {
        Object.entries(product.specs).forEach(([key, value]) => {
            const row = document.createElement('div');
            row.className = 'spec-row';
            row.innerHTML = `
                <span class="spec-label">${key.toUpperCase()}</span>
                <span class="spec-value">${value}</span>
            `;
            specsTable.appendChild(row);
        });
    }
    
    // Add to Cart Button
    const addToCartBtn = document.getElementById('addToCartBtn');
    addToCartBtn.addEventListener('click', () => {
        const finalPrice = product.discount ? product.discountPrice : product.price;
        
        const existing = cartObj.cart.find(p => p.id === product.id);
        if (existing) {
            existing.qty += 1;
        } else {
            cartObj.cart.push({
                id: product.id,
                name: product.name,
                price: finalPrice,
                img: product.img,
                desc: product.desc,
                qty: 1
            });
        }
        
        cartObj.saveCart();
        cartObj.updateCart();
        
        // Open cart
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            cartSidebar.classList.add('active');
            const overlay = document.querySelector('.cart-overlay');
            if (overlay) {
                overlay.style.opacity = '1';
                overlay.style.visibility = 'visible';
            }
        }
        
        // Visual feedback
        addToCartBtn.textContent = '✓ Aggiunto al carrello';
        addToCartBtn.style.background = '#16a34a';
        setTimeout(() => {
            addToCartBtn.textContent = 'Aggiungi al carrello';
            addToCartBtn.style.background = '';
        }, 2000);
    });
    
    // Load Reviews
    loadReviews(productId);
    
    // Load Related Products
    loadRelatedProducts(product);
}

// Display Stars
function displayStars(containerId, rating) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.textContent = '★';
        star.style.color = i <= Math.round(rating) ? '#fbbf24' : '#d1d5db';
        container.appendChild(star);
    }
}

// Get Average Rating
function getAverageRating(productId) {
    const reviews = JSON.parse(localStorage.getItem('miraReviews') || '{}');
    const productReviews = reviews[productId] || [];
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / productReviews.length;
}

// Get Review Count
function getReviewCount(productId) {
    const reviews = JSON.parse(localStorage.getItem('miraReviews') || '{}');
    return (reviews[productId] || []).length;
}

// Load Reviews
function loadReviews(productId) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    const reviews = JSON.parse(localStorage.getItem('miraReviews') || '{}');
    const productReviews = reviews[productId] || [];
    
    if (productReviews.length === 0) {
        reviewsContainer.innerHTML = '<p style="color:#6b7280;">Nessuna recensione disponibile. Sii il primo a recensire questo prodotto!</p>';
        return;
    }
    
    reviewsContainer.innerHTML = '';
    
    productReviews.forEach(review => {
        const reviewEl = document.createElement('div');
        reviewEl.className = 'review-item';
        
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        
        reviewEl.innerHTML = `
            <div class="review-header">
                <span class="review-author">${review.name}</span>
                <span class="review-stars">${stars}</span>
            </div>
            <p class="review-text">${review.text}</p>
            <p style="font-size:13px; color:#9ca3af; margin-top:8px;">${new Date(review.date).toLocaleDateString('it-IT')}</p>
        `;
        
        reviewsContainer.appendChild(reviewEl);
    });
}

// Load Related Products
function loadRelatedProducts(currentProduct) {
    const relatedContainer = document.getElementById('relatedProducts');
    const products = JSON.parse(localStorage.getItem('miraProducts')) || [];
    
    // Filter related products (same tags or random)
    let related = products.filter(p => 
        p.id !== currentProduct.id && 
        p.tags && currentProduct.tags && 
        p.tags.some(tag => currentProduct.tags.includes(tag))
    );
    
    // If not enough, add random products
    if (related.length < 4) {
        const remaining = products.filter(p => p.id !== currentProduct.id && !related.includes(p));
        related = [...related, ...remaining].slice(0, 4);
    }
    
    relatedContainer.innerHTML = '';
    
    related.forEach(product => {
        const card = document.createElement('div');
        card.className = 'related-product-card';
        
        const finalPrice = product.discount ? product.discountPrice : product.price;
        
        card.innerHTML = `
            <div class="related-product-image">
                <img src="${product.img}" alt="${product.name}">
            </div>
            <div class="related-product-info">
                <h3 class="related-product-name">${product.name}</h3>
                <p class="related-product-price">€${finalPrice.toFixed(2)}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            window.location.href = `product.html?id=${product.id}`;
        });
        
        relatedContainer.appendChild(card);
    });
}

// Tabs Navigation
function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
    //product-detail.js
}