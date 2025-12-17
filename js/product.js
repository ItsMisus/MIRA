// ==================== CARICA PRODOTTI DA API ====================
let PRODUCTS = [];
let isLoading = true;

async function loadProductsFromAPI() {
    try {
        const api = window.MiraAPI;
        const response = await api.getProducts();
        
        if (response.success && response.data.products) {
            PRODUCTS = response.data.products.map(p => ({
                id: p.id,
                name: p.name,
                desc: p.description,
                price: parseFloat(p.price),
                discountPrice: p.is_discount ? parseFloat(p.discount_price) : parseFloat(p.price),
                discount: p.is_discount,
                img: p.image_url,
                tags: p.tags || [],
                specs: p.specs || {}
            }));
            
            console.log('✅ Prodotti caricati dal database:', PRODUCTS.length);
            isLoading = false;
            return PRODUCTS;
        }
    } catch (error) {
        console.error('❌ Errore caricamento prodotti:', error);
        isLoading = false;
        return [];
    }
}

// ==================== CALCOLA MEDIA RECENSIONI ====================
function getAverageRating(productId) {
    const reviews = JSON.parse(localStorage.getItem('miraReviews') || '{}');
    const productReviews = reviews[productId] || [];
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / productReviews.length;
}

function getReviewCount(productId) {
    const reviews = JSON.parse(localStorage.getItem('miraReviews') || '{}');
    const productReviews = reviews[productId] || [];
    return productReviews.length;
}

// ==================== STELLA RATING HTML ====================
function createStarRating(rating, reviewCount) {
    let starsHTML = '<div class="product-rating"><div class="stars">';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.round(rating)) {
            starsHTML += '<span class="star filled">★</span>';
        } else {
            starsHTML += '<span class="star">★</span>';
        }
    }
    starsHTML += '</div>';
    starsHTML += `<span class="rating-count">(${reviewCount})</span>`;
    starsHTML += '</div>';
    return starsHTML;
}

// ==================== PRODUCTS DISPLAY ====================
function displayProducts(products, containerId = 'productsGrid') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    if (isLoading) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#aaa; padding:40px;">Caricamento prodotti...</p>';
        return;
    }

    if (products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#aaa; padding:40px;">Nessun prodotto trovato</p>';
        return;
    }

    products.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';

        const finalPrice = prod.discount ? prod.discountPrice : prod.price;
        const avgRating = getAverageRating(prod.id);
        const reviewCount = getReviewCount(prod.id);

        card.innerHTML = `
            ${prod.discount ? '<span class="discount-badge">OFFERTA</span>' : ''}
            <div class="product-image">
                <img src="${prod.img}" alt="${prod.name}" loading="lazy">
            </div>
            <div class="product-info">
                <h3>${prod.name}</h3>
                <p class="product-desc">${prod.desc}</p>
                ${createStarRating(avgRating, reviewCount)}
                <div class="product-price">
                    ${prod.discount ? `
                        <span class="original-price">€${prod.price.toFixed(2)}</span>
                        <span class="current-price">€${prod.discountPrice.toFixed(2)}</span>
                    ` : `
                        <span class="current-price">€${prod.price.toFixed(2)}</span>
                    `}
                </div>
            </div>
        `;

        card.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `product.html?id=${prod.id}`;
        });

        container.appendChild(card);
    });
}

// ==================== INDEX PAGE - SHOW NEW PRODUCTS ====================
async function initHomePage() {
    const homeGrid = document.getElementById('homeProductsGrid');
    if (!homeGrid) return;
    
    await loadProductsFromAPI();
    const newProducts = PRODUCTS.filter(p => p.tags && p.tags.includes('novità')).slice(0, 4);
    displayProducts(newProducts, 'homeProductsGrid');
}

// ==================== PC GAMING PAGE - FILTERS & PAGINATION ====================
async function initPCGamingPage() {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid || !window.location.pathname.includes('pcgaming')) return;
    
    await loadProductsFromAPI();
    
    let filteredProducts = [...PRODUCTS];
    let currentPage = 1;
    const PRODUCTS_PER_PAGE = 9;

    function updateProductsCount() {
        const countEl = document.getElementById('productsCount');
        if (countEl) {
            countEl.textContent = `${filteredProducts.length} prodotti`;
        }
    }

    function displayPage(page) {
        const start = (page - 1) * PRODUCTS_PER_PAGE;
        const end = start + PRODUCTS_PER_PAGE;
        const pageProducts = filteredProducts.slice(start, end);
        
        displayProducts(pageProducts);
        updatePagination();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function updatePagination() {
        const paginationEl = document.querySelector('.pagination-modern');
        if (!paginationEl) return;

        const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
        paginationEl.innerHTML = '';

        if (totalPages <= 1) return;

        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-arrow';
        prevBtn.innerHTML = '←';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayPage(currentPage);
            }
        });
        paginationEl.appendChild(prevBtn);

        for (let i = 1; i <= totalPages; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.addEventListener('click', () => {
                currentPage = i;
                displayPage(currentPage);
            });
            paginationEl.appendChild(pageBtn);
        }

        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-arrow';
        nextBtn.innerHTML = '→';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                displayPage(currentPage);
            }
        });
        paginationEl.appendChild(nextBtn);
    }

    function filterProducts(tag) {
        if (tag === 'all') {
            filteredProducts = [...PRODUCTS];
        } else {
            filteredProducts = PRODUCTS.filter(p => p.tags && p.tags.includes(tag));
        }
        currentPage = 1;
        updateProductsCount();
        displayPage(1);
    }

    document.querySelectorAll('.filter-category').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-category').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            filterProducts(category);
        });
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            const sortValue = e.target.value;
            
            switch(sortValue) {
                case 'price-asc':
                    filteredProducts.sort((a, b) => {
                        const priceA = a.discount ? a.discountPrice : a.price;
                        const priceB = b.discount ? b.discountPrice : b.price;
                        return priceA - priceB;
                    });
                    break;
                case 'price-desc':
                    filteredProducts.sort((a, b) => {
                        const priceA = a.discount ? a.discountPrice : a.price;
                        const priceB = b.discount ? b.discountPrice : b.price;
                        return priceB - priceA;
                    });
                    break;
                case 'name':
                    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                    break;
            }
            
            displayPage(currentPage);
        });
    }

    updateProductsCount();
    displayPage(1);
}

// ==================== PRODUCT DETAIL PAGE ====================
async function initProductDetailPage() {
    if (!window.location.pathname.includes('product.html')) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');
    
    if (!productId) {
        window.location.href = 'notfound.html';
        return;
    }
    
    await loadProductsFromAPI();
    
    if (!isNaN(parseInt(productId))) {
        productId = parseInt(productId);
    }
    
    const product = PRODUCTS.find(p => p.id == productId);
    
    if (product) {
        const main = document.querySelector('.product-detail');
        if (main) {
            const finalPrice = product.discount ? product.discountPrice : product.price;
            const avgRating = getAverageRating(product.id);
            const reviewCount = getReviewCount(product.id);
            
            main.innerHTML = `
                <div class="product-detail-container">
                    <div class="product-detail-images">
                        <div class="main-image">
                            <img src="${product.img}" alt="${product.name}">
                        </div>
                    </div>
                    
                    <div class="product-detail-info">
                        <h1>${product.name}</h1>
                        
                        <div class="product-rating-detail">
                            ${createStarRating(avgRating, reviewCount)}
                            <span class="rating-text">
                                ${avgRating > 0 ? `${avgRating.toFixed(1)} stelle` : 'Nessuna recensione'}
                            </span>
                        </div>
                        
                        <p class="product-detail-desc">${product.desc}</p>
                        
                        <div class="product-options">
                            <h3>Specifiche Tecniche</h3>
                            <div class="specs-list">
                                ${Object.entries(product.specs).map(([key, value]) => `
                                    <div class="spec-item">
                                        <strong>${key.toUpperCase()}:</strong> ${value}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        
                        <div class="product-detail-price">
                            ${product.discount ? `
                                <span class="original-price">€${product.price.toFixed(2)}</span>
                                <span class="current-price">€${product.discountPrice.toFixed(2)}</span>
                            ` : `
                                <span class="current-price">€${product.price.toFixed(2)}</span>
                            `}
                        </div>
                        
                        <button class="btn-add-to-cart-detail" data-product='${JSON.stringify({id: product.id, name: product.name, price: finalPrice, img: product.img, desc: product.desc})}'>
                            Aggiungi al carrello
                        </button>
                        
                        <a href="pcgaming.html" class="btn-back">← Torna ai prodotti</a>
                    </div>
                </div>
            `;
            
            document.querySelector('.btn-add-to-cart-detail').addEventListener('click', function() {
                const productData = JSON.parse(this.dataset.product);
                
                const existing = cartObj.cart.find(p => p.id === productData.id);
                if (existing) {
                    existing.qty += 1;
                } else {
                    cartObj.cart.push({ ...productData, qty: 1 });
                }
                
                cartObj.saveCart();
                cartObj.updateCart();
                
                const cartSidebar = document.getElementById('cartSidebar');
                if (cartSidebar) cartSidebar.classList.add('active');
                
                this.textContent = '✓ Aggiunto al carrello';
                this.style.background = '#27ae60';
                setTimeout(() => {
                    this.textContent = 'Aggiungi al carrello';
                    this.style.background = '';
                }, 1500);
            });
        }
    } else {
        window.location.href = 'notfound.html';
    }
}

// ==================== OFFERTE PAGE ====================
async function initOffertePage() {
    const offersGrid = document.getElementById('productsContainer');
    if (!offersGrid || !window.location.pathname.includes('offerte')) return;
    
    await loadProductsFromAPI();
    const offerProducts = PRODUCTS.filter(p => p.discount);
    
    if (offerProducts.length === 0) {
        offersGrid.innerHTML = '<p style="text-align:center; color:#aaa; padding:40px; grid-column:1/-1;">Nessuna offerta disponibile al momento</p>';
    } else {
        displayProducts(offerProducts, 'productsContainer');
    }
}

// ==================== AUTO INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Inizializzazione pagine...');
    
    if (document.getElementById('homeProductsGrid')) {
        await initHomePage();
    }
    
    if (document.getElementById('productsGrid') && window.location.pathname.includes('pcgaming')) {
        await initPCGamingPage();
    }
    
    if (window.location.pathname.includes('product.html')) {
        await initProductDetailPage();
    }
    
    if (document.getElementById('productsContainer') && window.location.pathname.includes('offerte')) {
        await initOffertePage();
    }
    
    console.log('✅ Inizializzazione completata');
});