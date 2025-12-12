// ==================== COMPONENTI RIUTILIZZABILI ====================

// CART SIDEBAR COMPONENT
function createCart() {
    const cartSidebar = document.createElement('aside');
    cartSidebar.id = 'cartSidebar';
    cartSidebar.className = 'cart-sidebar';
    cartSidebar.innerHTML = `
        <div style="padding:25px;">
            <h2 style="font-family:'Orbitron',sans-serif; color:#9b59b6; margin-bottom:20px; text-align:center;">Carrello</h2>
            <div id="cartItems">
                <p style="text-align:center; color:#aaa;">Il carrello è vuoto</p>
            </div>
            <div style="border-top:2px solid #9b59b6; padding-top:15px; margin-top:20px;">
                <p style="font-size:1.2rem; font-weight:700; color:#9b59b6; text-align:center;">
                    Totale: € <span id="cartTotal">0.00</span>
                </p>
            </div>
            <div style="display:flex; flex-direction:column; gap:10px; margin-top:20px;">
                <button id="closeCart" class="btn-primary">Chiudi</button>
                <button id="navigateHome" class="btn-primary" style="background:#333;">Continua Shopping</button>
            </div>
        </div>
    `;
    
    return cartSidebar;
}

// INIZIALIZZA COMPONENTI
function initComponents() {
    // Inserisci Header se non esiste
    if (!document.querySelector('header')) {
        const body = document.body;
        body.insertBefore(createHeader(), body.firstChild);
    }
    
    // Inserisci Footer se non esiste
    if (!document.querySelector('footer')) {
        document.body.appendChild(createFooter());
    }
    
    // Inserisci Cart se non esiste
    if (!document.getElementById('cartSidebar')) {
        document.body.appendChild(createCart());
    }
    
    // Inizializza eventi
    initHeaderEvents();
}

// EVENTI HEADER
function initHeaderEvents() {
    // Hamburger Menu
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Chiudi menu quando clicchi su un link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
    
    // Search Form
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchInput = searchForm.querySelector('input[name="search"]');
            const query = searchInput ? searchInput.value.trim() : '';
            if (query) {
                sessionStorage.setItem('searchQuery', query.toLowerCase());
                window.location.href = 'risultati.html';
            }
        });
    }
    
    // Language Dropdown
    const languageDropdown = document.getElementById('languageDropdown');
    if (languageDropdown) {
        const savedLang = localStorage.getItem('siteLanguage') || 'it';
        languageDropdown.value = savedLang;
        
        languageDropdown.addEventListener('change', (e) => {
            localStorage.setItem('siteLanguage', e.target.value);
            location.reload();
        });
    }
    
    // Cart Button
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCart = document.getElementById('closeCart');
    
    if (cartBtn && cartSidebar) {
        cartBtn.addEventListener('click', () => {
            cartSidebar.classList.toggle('active');
        });
    }
    
    if (closeCart && cartSidebar) {
        closeCart.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
        });
    }
    
    // Navigate Home Button
    const navigateHome = document.getElementById('navigateHome');
    if (navigateHome) {
        navigateHome.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}
//components.js