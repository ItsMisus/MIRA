// ==================== PRODUCTS DATABASE CON ID ====================
const DEFAULT_PRODUCTS = [{
        id: "prod-01",
        name: "ORION",
        price: 1499.49,
        discountPrice: 1299.99,
        discount: true,
        desc: "Potenza estrema con componenti di ultima generazione",
        img: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
        category: "gaming",
        tags: ["performance", "gaming", "offerta"],
        specs: {
            cpu: "AMD Ryzen 7 9800X3D",
            gpu: "NVIDIA RTX 5070 Ti 16GB",
            ram: "32GB DDR5 6400MHz",
            storage: "1TB NVMe Gen4",
            psu: "850W 80+ Gold"
        }
    },
    {
        id: 'prod-02',
        name: "NOVA",
        price: 2999.99,
        discountPrice: 2699.99,
        discount: true,
        desc: "Potenza AMD di ultima generazione con GPU migliorata",
        img: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=500",
        category: "novità",
        tags: ["rx9000", "novità", "high-end"],
        specs: {
            cpu: "AMD Ryzen 9 7950X3D",
            gpu: "AMD RX 9080 XT 24GB",
            ram: "32GB DDR5 6000MHz",
            storage: "2TB NVMe Gen5",
            psu: "1200W 80+ Platinum"
        }
    },
    {
        id: 3,
        name: "QUANTUM",
        price: 2299.99,
        discountPrice: null,
        discount: false,
        desc: "Design elegante tutto bianco",
        img: "https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=500",
        category: "novità",
        tags: ["white", "bestseller", "novità"],
        specs: {
            cpu: "Intel Core i7-14700K",
            gpu: "NVIDIA RTX 4080 SUPER",
            ram: "32GB DDR5 5600MHz",
            storage: "1TB NVMe Gen4",
            psu: "850W 80+ Gold"
        }
    },
    {
        id: 4,
        name: "NEBULA",
        price: 1299.99,
        discountPrice: 1099.99,
        discount: true,
        desc: "Prestazioni superiori a qualsiasi console",
        img: "https://images.unsplash.com/photo-1624705002806-5d72df19c3ad?w=500",
        category: "novità",
        tags: ["console-killer", "pronta-consegna", "bestseller", "novità"],
        specs: {
            cpu: "AMD Ryzen 5 7600X",
            gpu: "AMD RX 7700 XT 12GB",
            ram: "16GB DDR5 5200MHz",
            storage: "1TB NVMe Gen4",
            psu: "750W 80+ Bronze"
        }
    },
    {
        id: 5,
        name: "Delta",
        price: 1799.99,
        discountPrice: null,
        discount: false,
        desc: "Equilibrio perfetto prezzo/prestazioni",
        img: "https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?w=500",
        category: "all",
        tags: ["bestseller", "pronta-consegna"],
        specs: {
            cpu: "Intel Core i5-14600K",
            gpu: "NVIDIA RTX 4070 SUPER",
            ram: "32GB DDR5 5600MHz",
            storage: "1TB NVMe Gen4",
            psu: "750W 80+ Gold"
        }
    },
    {
        id: 6,
        name: "SOLIS",
        price: 3299.99,
        discountPrice: 2999.99,
        discount: true,
        desc: "Per content creator professionisti",
        img: "https://images.unsplash.com/photo-1580618124872-e06e5e9281ab?w=500",
        category: "all",
        tags: ["rtx5000"],
        specs: {
            cpu: "AMD Ryzen 9 7950X",
            gpu: "NVIDIA RTX 5080 16GB",
            ram: "64GB DDR5 6000MHz",
            storage: "4TB NVMe Gen4",
            psu: "1000W 80+ Platinum"
        }
    }
];

// Inizializza prodotti
const PRODUCTS = JSON.parse(localStorage.getItem('miraProducts')) || DEFAULT_PRODUCTS;
if (!localStorage.getItem('miraProducts')) {
    localStorage.setItem('miraProducts', JSON.stringify(DEFAULT_PRODUCTS));
}

console.log('Products initialized:', PRODUCTS.map(p => ({name: p.name, id: p.id, type: typeof p.id})));

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
if (document.getElementById('homeProductsGrid')) {
    const newProducts = PRODUCTS.filter(p => p.tags && p.tags.includes('novità')).slice(0, 4);
    displayProducts(newProducts, 'homeProductsGrid');
}

// ==================== PC GAMING PAGE - FILTERS & PAGINATION ====================
if (document.getElementById('productsGrid') && window.location.pathname.includes('pcgaming')) {
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
if (window.location.pathname.includes('product.html')) {
    const urlParams = new URLSearchParams(window.location.search);
    let productId = urlParams.get('id');
    
    // Converti a numero se possibile
    if (!isNaN(parseInt(productId))) {
        productId = parseInt(productId);
    }
    
    if (productId) {
        // Confronto flessibile che funziona sia con numeri che stringhe
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
    } else {
        window.location.href = 'notfound.html';
    }
}

// ==================== OFFERTE PAGE ====================
if (document.getElementById('productsContainer') && window.location.pathname.includes('offerte')) {
    const offerProducts = PRODUCTS.filter(p => p.discount);
    
    if (offerProducts.length === 0) {
        document.getElementById('productsContainer').innerHTML = 
            '<p style="text-align:center; color:#aaa; padding:40px; grid-column:1/-1;">Nessuna offerta disponibile al momento</p>';
    } else {
        displayProducts(offerProducts, 'productsContainer');
    }
}