// ==================== CART MANAGEMENT ====================
let cartObj = {
    cart: [],
    updateCart: function() {}
};

function initCart() {
    let cart = JSON.parse(localStorage.getItem('miraCart')) || [];
    
    function saveCart() {
        localStorage.setItem('miraCart', JSON.stringify(cart));
    }
    
    function updateCart() {
        const cartItems = document.getElementById('cartItems');
        const cartTotalEl = document.getElementById('cartTotal');
        const cartContent = document.getElementById('cartContent');
        
        if (!cartItems && !cartContent) return;

        const container = cartItems || cartContent;
        container.innerHTML = "";
        
        if (cart.length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#aaa; padding:20px;'>Il carrello è vuoto</p>";
            if (cartTotalEl) cartTotalEl.textContent = '0.00';
        } else {
            cart.forEach((item, index) => {
                const div = document.createElement('div');
                div.style.cssText = 'display:flex; gap:10px; margin-bottom:15px; background:#222; padding:10px; border-radius:8px; align-items:flex-start;';
                
                div.innerHTML = `
                    <img src="${item.img}" alt="${item.name}" style="width:80px; height:60px; object-fit:cover; border-radius:6px;">
                    <div style="flex:1;">
                        <h4 style="margin:0 0 5px 0; font-size:0.95rem; color:#fff;">${item.name}</h4>
                        <p style="font-size:0.85rem; color:#ccc; margin:3px 0;">€ ${item.price.toFixed(2)}</p>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                            <button class="decrease" style="background:#9b59b6; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600;">−</button>
                            <span style="min-width:20px; text-align:center; font-weight:600; color:#9b59b6;">${item.qty}</span>
                            <button class="increase" style="background:#9b59b6; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600;">+</button>
                            <button class="remove" style="background:#e74c3c; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600; margin-left:auto;">✕</button>
                        </div>
                    </div>
                `;
                
                container.appendChild(div);

                div.querySelector('.increase').addEventListener('click', () => {
                    item.qty += 1;
                    saveCart();
                    updateCart();
                });
                
                div.querySelector('.decrease').addEventListener('click', () => {
                    if (item.qty > 1) {
                        item.qty -= 1;
                        saveCart();
                        updateCart();
                    }
                });
                
                div.querySelector('.remove').addEventListener('click', () => {
                    cart.splice(index, 1);
                    saveCart();
                    updateCart();
                });
            });
            
            const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
            if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
        }
    }

    updateCart();
    cartObj = { cart, updateCart, saveCart };
    return cartObj;
}

// ==================== SEARCH FUNCTIONALITY ====================
function initSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose = document.getElementById('searchClose');
    const mainSearchInput = document.getElementById('mainSearchInput');

    // Aggiungi SVG al bottone close se non esiste
    if (searchClose && !searchClose.querySelector('svg')) {
        searchClose.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
    }

    if (searchBtn && searchOverlay) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            searchOverlay.classList.add('active');
            setTimeout(() => {
                if (mainSearchInput) mainSearchInput.focus();
            }, 100);
        });
    }

    if (searchClose && searchOverlay) {
        searchClose.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
            if (mainSearchInput) mainSearchInput.value = '';
        });
    }

    if (searchOverlay) {
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                searchOverlay.classList.remove('active');
                if (mainSearchInput) mainSearchInput.value = '';
            }
        });
    }

    if (mainSearchInput) {
        mainSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = mainSearchInput.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }
}

function performSearch(query) {
    if (!query) return;
    
    const products = JSON.parse(localStorage.getItem('miraProducts')) || [];
    const searchQuery = query.toLowerCase();
    
    const results = products.filter(product => {
        const nameMatch = product.name.toLowerCase().includes(searchQuery);
        const descMatch = product.desc.toLowerCase().includes(searchQuery);
        const tagsMatch = product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchQuery));
        const specsMatch = product.specs && Object.values(product.specs).some(spec => 
            spec.toLowerCase().includes(searchQuery)
        );
        
        return nameMatch || descMatch || tagsMatch || specsMatch;
    });
    
    sessionStorage.setItem('searchQuery', query);
    sessionStorage.setItem('searchResults', JSON.stringify(results));
    window.location.href = 'risultati.html';
}

// ==================== PAGINA RISULTATI ====================
if (window.location.pathname.includes('risultati.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const resultsContainer = document.getElementById('productsContainer');
        
        if (resultsContainer) {
            const searchQuery = sessionStorage.getItem('searchQuery') || '';
            const searchResults = JSON.parse(sessionStorage.getItem('searchResults') || '[]');

            if (!searchQuery || searchResults.length === 0) {
                window.location.href = 'notfound.html';
                return;
            }

            const pageTitle = document.querySelector('.page-title, h1');
            if (pageTitle) {
                pageTitle.textContent = `Risultati per "${searchQuery}"`;
            }

            const RESULTS_PER_PAGE = 12;
            let currentPage = 1;

            function displayResults(page) {
                const start = (page - 1) * RESULTS_PER_PAGE;
                const end = start + RESULTS_PER_PAGE;
                const pageResults = searchResults.slice(start, end);

                resultsContainer.innerHTML = '';

                pageResults.forEach(product => {
                    const avgRating = getAverageRating(product.id);
                    const reviewCount = getReviewCount(product.id);
                    const finalPrice = product.discount ? product.discountPrice : product.price;

                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.innerHTML = `
                        ${product.discount ? '<span class="discount-badge">OFFERTA</span>' : ''}
                        <div class="product-image">
                            <img src="${product.img}" alt="${product.name}">
                        </div>
                        <div class="product-info">
                            <h3>${product.name}</h3>
                            <p class="product-desc">${product.desc}</p>
                            <div class="product-rating">
                                <div class="stars">
                                    ${[1, 2, 3, 4, 5].map(star => 
                                        `<span class="star ${star <= Math.round(avgRating) ? 'filled' : ''}">★</span>`
                                    ).join('')}
                                </div>
                                <span class="rating-count">(${reviewCount})</span>
                            </div>
                            <div class="product-price">
                                ${product.discount ? `
                                    <span class="original-price">€${product.price.toFixed(2)}</span>
                                    <span class="current-price">€${product.discountPrice.toFixed(2)}</span>
                                ` : `
                                    <span class="current-price">€${product.price.toFixed(2)}</span>
                                `}
                            </div>
                        </div>
                    `;

                    card.addEventListener('click', () => {
                        window.location.href = `product.html?id=${product.id}`;
                    });

                    resultsContainer.appendChild(card);
                });

                updatePagination(page);
            }

            function updatePagination(page) {
                let paginationDiv = document.querySelector('.pagination');
                if (!paginationDiv) {
                    paginationDiv = document.createElement('div');
                    paginationDiv.className = 'pagination-modern';
                    resultsContainer.parentElement.appendChild(paginationDiv);
                }

                const totalPages = Math.ceil(searchResults.length / RESULTS_PER_PAGE);
                paginationDiv.innerHTML = '';

                if (totalPages <= 1) return;

                const prevBtn = document.createElement('button');
                prevBtn.className = 'pagination-arrow';
                prevBtn.innerHTML = '←';
                prevBtn.disabled = page === 1;
                prevBtn.addEventListener('click', () => displayResults(page - 1));
                paginationDiv.appendChild(prevBtn);

                for (let i = 1; i <= totalPages; i++) {
                    const pageBtn = document.createElement('button');
                    pageBtn.className = `page-number ${i === page ? 'active' : ''}`;
                    pageBtn.textContent = i;
                    pageBtn.addEventListener('click', () => displayResults(i));
                    paginationDiv.appendChild(pageBtn);
                }

                const nextBtn = document.createElement('button');
                nextBtn.className = 'pagination-arrow';
                nextBtn.innerHTML = '→';
                nextBtn.disabled = page === totalPages;
                nextBtn.addEventListener('click', () => displayResults(page + 1));
                paginationDiv.appendChild(nextBtn);
            }

            function getAverageRating(productId) {
                const reviews = JSON.parse(localStorage.getItem('miraReviews') || '{}');
                const productReviews = reviews[productId] || [];
                if (productReviews.length === 0) return 0;
                const sum = productReviews.reduce((acc, review) => acc + review.rating, 0);
                return sum / productReviews.length;
            }

            function getReviewCount(productId) {
                const reviews = JSON.parse(localStorage.getItem('miraReviews') || '{}');
                return (reviews[productId] || []).length;
            }

            displayResults(1);
        }
    });
}

// ==================== LANGUAGE SELECTOR ====================
function initLanguageSelector() {
    const languageSelectors = document.querySelectorAll('.language-selector');
    const footerLangSelect = document.getElementById('footerLangSelect');
    
    // Get saved language or default to Italian
    let currentLang = localStorage.getItem('siteLanguage') || 'it';
    
    // Update all language displays
    function updateLanguageDisplay() {
        const langText = currentLang === 'it' ? 'Italiano' : 'English';
        languageSelectors.forEach(selector => {
            const span = selector.querySelector('span');
            if (span) span.textContent = langText;
        });
        
        if (footerLangSelect) {
            footerLangSelect.value = currentLang;
        }
    }
    
    // Create dropdown for header language selector
    languageSelectors.forEach(selector => {
        selector.style.cursor = 'pointer';
        
        selector.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Remove existing dropdown
            document.querySelectorAll('.lang-dropdown').forEach(d => d.remove());
            
            const dropdown = document.createElement('div');
            dropdown.className = 'lang-dropdown';
            dropdown.style.cssText = `
                position: absolute;
                top: 100%;
                right: 0;
                background: #1a1a1a;
                border: 1px solid #9b59b6;
                border-radius: 8px;
                margin-top: 5px;
                z-index: 1000;
                min-width: 120px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            `;
            
            const options = [
                { value: 'it', label: 'Italiano' },
                { value: 'en', label: 'English' }
            ];
            
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.textContent = opt.label;
                btn.style.cssText = `
                    width: 100%;
                    padding: 10px 15px;
                    background: ${opt.value === currentLang ? '#9b59b6' : 'transparent'};
                    color: white;
                    border: none;
                    cursor: pointer;
                    text-align: left;
                    font-family: 'Rajdhani', sans-serif;
                    transition: background 0.3s;
                `;
                
                btn.addEventListener('mouseenter', () => {
                    if (opt.value !== currentLang) btn.style.background = '#2a2a2a';
                });
                
                btn.addEventListener('mouseleave', () => {
                    if (opt.value !== currentLang) btn.style.background = 'transparent';
                });
                
                btn.addEventListener('click', () => {
                    currentLang = opt.value;
                    localStorage.setItem('siteLanguage', currentLang);
                    updateLanguageDisplay();
                    dropdown.remove();
                    // Reload page to apply translations
                    location.reload();
                });
                
                dropdown.appendChild(btn);
            });
            
            selector.style.position = 'relative';
            selector.appendChild(dropdown);
        });
    });
    
    // Footer language selector
    if (footerLangSelect) {
        footerLangSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            localStorage.setItem('siteLanguage', currentLang);
            updateLanguageDisplay();
            location.reload();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.lang-dropdown').forEach(d => d.remove());
    });
    
    updateLanguageDisplay();
}

// ==================== CART SIDEBAR ====================
function initCartSidebar() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose = document.getElementById('cartClose');
    const closeCart = document.getElementById('closeCart');
    
    // Crea overlay per il carrello se non esiste
    let cartOverlay = document.querySelector('.cart-overlay');
    if (!cartOverlay) {
        cartOverlay = document.createElement('div');
        cartOverlay.className = 'cart-overlay';
        cartOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1999;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        `;
        document.body.appendChild(cartOverlay);
    }

    // Apri carrello
    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cartSidebar.classList.add('active');
            cartOverlay.style.opacity = '1';
            cartOverlay.style.visibility = 'visible';
        });
    }

    // Funzione per chiudere il carrello
    function closeCartSidebar() {
        if (cartSidebar) {
            cartSidebar.classList.remove('active');
            cartOverlay.style.opacity = '0';
            cartOverlay.style.visibility = 'hidden';
        }
    }

    // Chiudi con bottone X
    if (cartClose) {
        cartClose.addEventListener('click', closeCartSidebar);
    }
    
    // Chiudi con bottone "Chiudi"
    if (closeCart) {
        closeCart.addEventListener('click', closeCartSidebar);
    }
    
    // Chiudi clickando sull'overlay
    if (cartOverlay) {
        cartOverlay.addEventListener('click', closeCartSidebar);
    }

    // Chiudi clickando fuori dal carrello
    document.addEventListener('click', (e) => {
        if (cartSidebar && cartSidebar.classList.contains('active')) {
            // Se il click NON è dentro il carrello e NON è il bottone carrello
            if (!cartSidebar.contains(e.target) && !cartBtn.contains(e.target)) {
                closeCartSidebar();
            }
        }
    });

    // Previeni la chiusura quando si clicca DENTRO il carrello
    if (cartSidebar) {
        cartSidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// ==================== INIT ALL ====================
document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initSearch();
    initLanguageSelector();
    initCartSidebar();
    
    // Search inline nella pagina 404
    const searchInputNotFound = document.getElementById('searchInputNotFound');
    const searchBtnNotFound = document.getElementById('searchBtnNotFound');
    
    if (searchBtnNotFound && searchInputNotFound) {
        searchBtnNotFound.addEventListener('click', () => {
            const query = searchInputNotFound.value.trim();
            if (query) {
                performSearch(query);
            }
        });
        
        searchInputNotFound.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInputNotFound.value.trim();
                if (query) {
                    performSearch(query);
                }
            }
        });
    }
    
    console.log('MIRA: All systems initialized');
    //script.js
});