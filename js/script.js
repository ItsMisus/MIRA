// ==================== ESCAPE HTML ====================
// Il testo cercato e i campi prodotto finiscono dentro innerHTML: senza
// escape, quello che l'utente scrive nella barra di ricerca viene eseguito
// come HTML nella pagina dei risultati.
function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==================== LETTURA SICURA DA localStorage ====================
// Un valore corrotto faceva fallire JSON.parse e con lui tutta
// l'inizializzazione della pagina: ricerca, lingua e account compresi.
function readStoredJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        console.warn(`Valore non leggibile in localStorage: ${key}`, error);
        localStorage.removeItem(key);
        return fallback;
    }
}

// ==================== CART MANAGEMENT ====================
// FIX #9: cartObj è mantenuto per retrocompatibilità ma NON gestisce più
// il carrello in modo autonomo. Il sistema autorevole è cart.js (server-side).
let cartObj = {
    cart: [],
    updateCart: function() {},
    saveCart: function() {}
};

function initCart() {
    // Leggi dal localStorage solo per retrocompatibilità con codice vecchio
    let cart = readStoredJSON('miraCart', []) || [];

    function saveCart() {
        localStorage.setItem('miraCart', JSON.stringify(cart));
        // NON chiama più syncCartWithServer() — lo fa già api.js
    }

    function updateCart() {
        const cartItems   = document.getElementById('cartItems');
        const cartContent = document.getElementById('cartContent');

        // Se esiste #cartContent, cart.js sta gestendo il carrello → non interferire
        if (cartContent) return;

        if (!cartItems) return;

        cartItems.innerHTML = '';

        if (cart.length === 0) {
            cartItems.innerHTML = "<p style='text-align:center; color:#aaa; padding:20px;'>Il carrello è vuoto</p>";
        } else {
            cart.forEach((item, index) => {
                const div = document.createElement('div');
                div.style.cssText = 'display:flex; gap:10px; margin-bottom:15px; background:#222; padding:10px; border-radius:8px; align-items:flex-start;';

                div.innerHTML = `
                    <img src="${escapeHtml(item.img)}" alt="${escapeHtml(item.name)}" style="width:80px; height:60px; object-fit:cover; border-radius:6px;">
                    <div style="flex:1;">
                        <h4 style="margin:0 0 5px 0; font-size:0.95rem; color:#fff;">${escapeHtml(item.name)}</h4>
                        <p style="font-size:0.85rem; color:#ccc; margin:3px 0;">€ ${item.price.toFixed(2)}</p>
                        <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
                            <button class="decrease" style="background:#9b59b6; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600;">−</button>
                            <span style="min-width:20px; text-align:center; font-weight:600; color:#9b59b6;">${item.qty}</span>
                            <button class="increase" style="background:#9b59b6; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600;">+</button>
                            <button class="remove" style="background:#e74c3c; border:none; color:#fff; padding:4px 8px; cursor:pointer; border-radius:4px; font-weight:600; margin-left:auto;">✕</button>
                        </div>
                    </div>
                `;

                cartItems.appendChild(div);

                div.querySelector('.increase').addEventListener('click', () => { item.qty += 1; saveCart(); updateCart(); });
                div.querySelector('.decrease').addEventListener('click', () => { if (item.qty > 1) { item.qty -= 1; saveCart(); updateCart(); } });
                div.querySelector('.remove').addEventListener('click',   () => { cart.splice(index, 1); saveCart(); updateCart(); });
            });

            const cartTotalEl = document.getElementById('cartTotal');
            const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
            if (cartTotalEl) cartTotalEl.textContent = total.toFixed(2);
        }
    }

    updateCart();
    cartObj = { cart, updateCart, saveCart };
    return cartObj;
}

// ==================== MENU MOBILE ====================
// Sotto i 1024px responsive.css porta la barra di navigazione fuori dallo
// schermo e la riporta dentro con .nav-links.active. Il pulsante che deve
// aggiungere quella classe non esisteva in nessuna pagina e nessuno script
// la toglieva: sul telefono i link erano semplicemente irraggiungibili.
function initMobileMenu() {
    const menuBtn  = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    if (!menuBtn || !navLinks) return;

    function setOpen(open) {
        menuBtn.classList.toggle('active', open);
        navLinks.classList.toggle('active', open);
        document.body.classList.toggle('menu-open', open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        menuBtn.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    }

    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!navLinks.classList.contains('active'));
    });

    // Un link porta a un'altra pagina, ma le ancore no: in quel caso il
    // menu resterebbe aperto sopra il contenuto.
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });

    // Passando a schermo largo la barra torna orizzontale da sola: se il
    // menu restasse "aperto" il blocco dello scorrimento rimarrebbe attivo.
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024) setOpen(false);
    });
}

// ==================== SEARCH FUNCTIONALITY ====================
function initSearch() {
    const searchBtn     = document.getElementById('searchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchClose   = document.getElementById('searchClose');
    const mainSearchInput = document.getElementById('mainSearchInput');

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
            setTimeout(() => { if (mainSearchInput) mainSearchInput.focus(); }, 100);
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
                if (query) performSearch(query);
            }
        });
    }
}

// FIX #8: performSearch ora chiama l'API reale invece di leggere da localStorage
async function performSearch(query) {
    if (!query) return;

    try {
        const API_BASE = 'http://localhost/mira_ecommerce/api';
        const response = await fetch(`${API_BASE}/products.php?search=${encodeURIComponent(query)}&limit=100`);
        const data = await response.json();

        const results = (data.success && data.data && data.data.products) ? data.data.products : [];

        sessionStorage.setItem('searchQuery',   query);
        sessionStorage.setItem('searchResults', JSON.stringify(results));
        window.location.href = 'risultati.html';

    } catch (error) {
        console.error('Errore ricerca:', error);
        // Fallback: vai comunque alla pagina risultati con array vuoto
        sessionStorage.setItem('searchQuery',   query);
        sessionStorage.setItem('searchResults', JSON.stringify([]));
        window.location.href = 'risultati.html';
    }
}

// ==================== CART SIDEBAR ====================
// FIX #9: initCartSidebar() non registra più listener se cart.js è già attivo
// (cart.js monta i propri listener su #cartBtn, #cartClose, #cartOverlay)
function initCartSidebar() {
    // Se cart.js è caricato, gestisce già tutto → uscire
    if (typeof window.openCart === 'function') return;

    const cartBtn     = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartClose   = document.getElementById('cartClose');
    const closeCart   = document.getElementById('closeCart');

    let cartOverlay = document.querySelector('.cart-overlay');
    if (!cartOverlay) {
        cartOverlay = document.createElement('div');
        cartOverlay.className = 'cart-overlay';
        cartOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 1999;
            opacity: 0; visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        `;
        document.body.appendChild(cartOverlay);
    }

    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cartSidebar.classList.add('active');
            cartOverlay.style.opacity = '1';
            cartOverlay.style.visibility = 'visible';
        });
    }

    function closeCartSidebar() {
        if (cartSidebar) {
            cartSidebar.classList.remove('active');
            cartOverlay.style.opacity = '0';
            cartOverlay.style.visibility = 'hidden';
        }
    }

    if (cartClose)   cartClose.addEventListener('click',   closeCartSidebar);
    if (closeCart)   closeCart.addEventListener('click',   closeCartSidebar);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCartSidebar);

    document.addEventListener('click', (e) => {
        if (cartSidebar && cartSidebar.classList.contains('active')) {
            if (!cartSidebar.contains(e.target) && cartBtn && !cartBtn.contains(e.target)) {
                closeCartSidebar();
            }
        }
    });

    if (cartSidebar) {
        cartSidebar.addEventListener('click', (e) => e.stopPropagation());
    }
}

// ==================== LANGUAGE SELECTOR ====================
function initLanguageSelector() {
    const languageSelector = document.querySelectorAll('.language-selector');
    const footerLangSelect = document.getElementById('footerLangSelect');

    languageSelector.forEach(selector => {
        selector.addEventListener('click', (e) => {
            e.stopPropagation();
            selector.style.position = 'relative';

            let dropdown = selector.querySelector('.lang-dropdown');
            if (!dropdown) {
                dropdown = document.createElement('div');
                dropdown.className = 'lang-dropdown';
                dropdown.style.cssText = `
                    position: absolute; top: calc(100% + 8px); right: 0;
                    background: #1a1a1a; border: 1px solid #374151; border-radius: 8px;
                    padding: 8px 0; min-width: 120px; width: 100%; z-index: 1000;
                    display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                `;
                dropdown.innerHTML = `
                    <div class="lang-option" data-lang="it" style="padding:8px 16px;cursor:pointer;color:#9ca3af;font-size:14px;transition:all 0.2s;">Italiano</div>
                    <div class="lang-option" data-lang="en" style="padding:8px 16px;cursor:pointer;color:#9ca3af;font-size:14px;transition:all 0.2s;">English</div>
                `;
                selector.appendChild(dropdown);

                dropdown.querySelectorAll('.lang-option').forEach(opt => {
                    opt.addEventListener('mouseenter', () => { opt.style.background = '#374151'; opt.style.color = '#fff'; });
                    opt.addEventListener('mouseleave', () => { opt.style.background = 'transparent'; opt.style.color = '#9ca3af'; });
                    opt.addEventListener('click', (e) => {
                        e.stopPropagation();
                        changeLanguage(opt.dataset.lang);
                        dropdown.style.display = 'none';
                    });
                });
            }

            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    });

    if (footerLangSelect) {
        footerLangSelect.addEventListener('change', (e) => changeLanguage(e.target.value));
    }

    document.addEventListener('click', () => {
        document.querySelectorAll('.lang-dropdown').forEach(d => d.style.display = 'none');
    });
}

function changeLanguage(lang) {
    localStorage.setItem('miraLanguage', lang);
    document.querySelectorAll('.language-selector span').forEach(span => {
        span.textContent = lang === 'it' ? 'Italiano' : 'English';
    });
    const footerSelect = document.getElementById('footerLangSelect');
    if (footerSelect) footerSelect.value = lang;
}

// ==================== ACCOUNT BUTTON ====================
function initAccountButton() {
    const accountBtn = document.getElementById('accountBtn');
    if (!accountBtn) return;

    // api.js (initializeHeader) gestisce già questo → evita duplicati
    if (accountBtn._miraInitialized) return;
    accountBtn._miraInitialized = true;

    const token = localStorage.getItem('miraToken');
    const user  = localStorage.getItem('miraUser');

    if (token && user) {
        accountBtn.style.borderColor = '#9b59b6';
        const svg = accountBtn.querySelector('svg');
        if (svg) svg.style.fill = '#9b59b6';
        accountBtn.title = 'Il mio Account';
    } else {
        accountBtn.title = 'Accedi / Registrati';
    }

    accountBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'auth.html';
    });
}

// ==================== PAGINA RISULTATI ====================
if (window.location.pathname.includes('risultati.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const resultsContainer = document.getElementById('productsContainer');

        if (resultsContainer) {
            const searchQuery   = sessionStorage.getItem('searchQuery') || '';
            let searchResults;
            try {
                searchResults = JSON.parse(sessionStorage.getItem('searchResults') || '[]');
            } catch (error) {
                console.warn('Risultati di ricerca non leggibili', error);
                searchResults = [];
            }

            if (!searchQuery || searchResults.length === 0) {
                // Mostra messaggio invece di redirect immediato
                resultsContainer.innerHTML = `<p style="text-align:center;color:#999;padding:40px;">Nessun risultato trovato per "<strong>${escapeHtml(searchQuery)}</strong>"</p>`;
                const pageTitle = document.querySelector('.page-title, h1');
                if (pageTitle) pageTitle.textContent = `Risultati per "${searchQuery}"`;
                return;
            }

            const pageTitle = document.querySelector('.page-title, h1');
            if (pageTitle) pageTitle.textContent = `Risultati per "${searchQuery}"`;

            const RESULTS_PER_PAGE = 9;
            let currentPage = 1;

            function displayResults(page) {
                const start       = (page - 1) * RESULTS_PER_PAGE;
                const pageResults = searchResults.slice(start, start + RESULTS_PER_PAGE);

                resultsContainer.innerHTML = '';

                pageResults.forEach(product => {
                    const finalPrice = product.is_discount ? product.discount_price : product.price;
                    const avgRating  = product.avg_rating || 0;
                    const reviewCount = product.review_count || 0;

                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.innerHTML = `
                        ${product.is_discount ? '<span class="discount-badge">OFFERTA</span>' : ''}
                        <div class="product-image">
                            <img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}">
                        </div>
                        <div class="product-info">
                            <h3>${escapeHtml(product.name)}</h3>
                            <p class="product-desc">${escapeHtml((product.description || '').substring(0, 80))}...</p>
                            <div class="product-rating">
                                <div class="stars">
                                    ${[1,2,3,4,5].map(s => `<span class="star ${s <= Math.round(avgRating) ? 'filled' : ''}">★</span>`).join('')}
                                </div>
                                <span class="rating-count">(${reviewCount})</span>
                            </div>
                            <div class="product-price">
                                ${product.is_discount
                                    ? `<span class="original-price">€${parseFloat(product.price).toFixed(2)}</span>
                                       <span class="current-price">€${parseFloat(finalPrice).toFixed(2)}</span>`
                                    : `<span class="current-price">€${parseFloat(finalPrice).toFixed(2)}</span>`
                                }
                            </div>
                        </div>
                    `;
                    card.addEventListener('click', () => { window.location.href = `product.html?id=${product.id}`; });
                    resultsContainer.appendChild(card);
                });

                updatePagination(page);
            }

            function updatePagination(page) {
                let paginationDiv = document.querySelector('.pagination-modern');
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
                    const btn = document.createElement('button');
                    btn.className = `page-number ${i === page ? 'active' : ''}`;
                    btn.textContent = i;
                    btn.addEventListener('click', () => displayResults(i));
                    paginationDiv.appendChild(btn);
                }

                const nextBtn = document.createElement('button');
                nextBtn.className = 'pagination-arrow';
                nextBtn.innerHTML = '→';
                nextBtn.disabled = page === totalPages;
                nextBtn.addEventListener('click', () => displayResults(page + 1));
                paginationDiv.appendChild(nextBtn);
            }

            displayResults(1);
        }
    });
}

// ==================== INIT ALL ====================
document.addEventListener('DOMContentLoaded', () => {
    initCart();
    initMobileMenu();
    initSearch();
    initLanguageSelector();
    initCartSidebar();
    initAccountButton();

    // Search nella pagina 404
    const searchInputNotFound = document.getElementById('searchInputNotFound');
    const searchBtnNotFound   = document.getElementById('searchBtnNotFound');

    if (searchBtnNotFound && searchInputNotFound) {
        searchBtnNotFound.addEventListener('click', () => {
            const query = searchInputNotFound.value.trim();
            if (query) performSearch(query);
        });
        searchInputNotFound.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInputNotFound.value.trim();
                if (query) performSearch(query);
            }
        });
    }

    const savedLang = localStorage.getItem('miraLanguage') || 'it';
    changeLanguage(savedLang);

    // FIX #10: syncCartWithServer viene chiamato solo da api.js.
    // script.js NON chiama più syncCartWithServer() per evitare la race condition.

    console.log('MIRA: All systems initialized');
});