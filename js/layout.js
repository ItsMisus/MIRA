/**
 * MIRA - parti comuni a tutte le pagine che esistono solo con JavaScript:
 * la sidebar del carrello e l'overlay di ricerca.
 *
 * Prima erano copiati a mano in ogni HTML, e ogni modifica andava ripetuta
 * sette volte. Header e footer restano nell'HTML: servono anche senza
 * JavaScript e ai motori di ricerca.
 *
 * Va caricato dopo config.js e prima di cart.js e script.js.
 */
(function () {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('../css/cart.css', document.currentScript.src).href;
    if (!document.querySelector('link[href$="css/cart.css"]')) {
        document.head.appendChild(stylesheet);
    }

    if (!document.getElementById('cartSidebar')) {
        document.body.insertAdjacentHTML('beforeend', `
<div class="cart-overlay" id="cartOverlay"></div>
<aside class="cart-sidebar" id="cartSidebar" aria-label="Carrello">
    <div class="cart-header">
        <h3>Carrello</h3>
        <button class="cart-close" id="cartClose" type="button" aria-label="Chiudi il carrello">✕</button>
    </div>
    <div class="cart-free-shipping">
        <p>✓ Hai diritto alla spedizione gratuita!</p>
    </div>
    <div class="cart-content" id="cartContent" aria-live="polite">
        <p class="cart-empty">Il tuo carrello è vuoto</p>
    </div>
    <div class="cart-footer">
        <p class="cart-footer-info">Imposte e spese di spedizione calcolate al momento del check-out</p>
        <button class="cart-checkout-btn" id="cartCheckoutBtn" type="button" disabled>
            <span>Checkout</span>
            <span class="cart-checkout-price">€0.00</span>
        </button>
    </div>
</aside>`);
    }

    if (!document.getElementById('searchOverlay')) {
        document.body.insertAdjacentHTML('beforeend', `
<div class="search-overlay" id="searchOverlay">
    <div class="search-container">
        <input type="search" placeholder="Cerca..." class="search-input" id="mainSearchInput" aria-label="Cerca nel catalogo">
        <button class="search-close" id="searchClose" type="button" aria-label="Chiudi la ricerca">✕</button>
    </div>
</div>`);
    }
})();
