/**
 * MIRA E-Commerce - Sistema Carrello Completo
 * Basato su ID database con carrelli separati per account
 */

// ============================================================================
// CONFIGURAZIONE
// ============================================================================
const CART_API = window.MIRA_API + '/cart.php';

// ============================================================================
// STATO CARRELLO
// ============================================================================
let cartData = {
    items: [],
    total: 0,
    itemsCount: 0
};

// ============================================================================
// INIZIALIZZAZIONE
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🛒 Sistema Carrello MIRA inizializzato');
    
    // Setup event listeners
    setupCartListeners();
    
    // Carica carrello
    loadCart();
});

// ============================================================================
// SETUP EVENT LISTENERS
// ============================================================================
function setupCartListeners() {
    // Bottone carrello header
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openCart();
        });
    }
    
    // Bottone chiudi
    const cartClose = document.getElementById('cartClose');
    if (cartClose) {
        cartClose.addEventListener('click', closeCart);
    }
    
    // Overlay
    const overlay = document.getElementById('cartOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeCart);
    }
    
    // Previeni chiusura quando si clicca dentro il carrello
    const sidebar = document.getElementById('cartSidebar');
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

// ============================================================================
// APERTURA/CHIUSURA CARRELLO
// ============================================================================
function openCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    if (sidebar) {
        sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    if (overlay) {
        overlay.classList.add('active');
    }
    
    // Ricarica carrello quando si apre
    loadCart();
}

function closeCart() {
    const sidebar = document.getElementById('cartSidebar');
    const overlay = document.getElementById('cartOverlay');
    
    if (sidebar) {
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// ============================================================================
// CARICAMENTO CARRELLO DAL SERVER
// ============================================================================
async function loadCart() {
    const token = localStorage.getItem('miraToken');
    
    // Se non autenticato, mostra carrello vuoto
    if (!token) {
        console.log('👤 Utente non autenticato - carrello vuoto');
        cartData = { items: [], total: 0, itemsCount: 0 };
        renderCart();
        updateCartBadge();
        return;
    }
    
    try {
        console.log('🔄 Caricamento carrello dal server...');
        
        const response = await fetch(CART_API, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('📦 Risposta server:', data);
        
        if (data.success && data.data) {
            // Aggiorna stato carrello
            cartData = {
                items: data.data.items || [],
                total: data.data.total || 0,
                itemsCount: data.data.items_count || 0
            };
            
            console.log('✅ Carrello caricato:', cartData.itemsCount, 'prodotti');
        } else {
            throw new Error(data.message || 'Errore caricamento carrello');
        }
        
    } catch (error) {
        console.error('❌ Errore caricamento carrello:', error);
        
        // Se errore 401, utente non autenticato
        if (error.message && error.message.includes('401')) {
            localStorage.removeItem('miraToken');
            localStorage.removeItem('miraUser');
            cartData = { items: [], total: 0, itemsCount: 0 };
        }
    } finally {
        renderCart();
        updateCartBadge();
    }
}

// ============================================================================
// AGGIUNTA PRODOTTO AL CARRELLO
// ============================================================================
async function addToCart(productId, quantity = 1) {
    const token = localStorage.getItem('miraToken');
    
    // Se non autenticato, reindirizza al login
    if (!token) {
        console.log('⚠️ Utente non autenticato');
        alert('Devi effettuare il login per aggiungere prodotti al carrello');
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        console.log('➕ Aggiunta al carrello:', productId, 'qty:', quantity);
        
        const response = await fetch(CART_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                quantity: quantity
            })
        });
        
        const data = await response.json();
        console.log('📦 Risposta aggiunta:', data);
        
        if (data.success) {
            console.log('✅ Prodotto aggiunto:', data.data.product_name);
            
            // Ricarica carrello
            await loadCart();
            
            // Apri carrello
            openCart();
            
            // Mostra notifica
            showToast(`${data.data.product_name} aggiunto al carrello`, 'success');
        } else {
            throw new Error(data.message || 'Errore aggiunta prodotto');
        }
        
    } catch (error) {
        console.error('❌ Errore aggiunta al carrello:', error);
        showToast(error.message || 'Errore durante l\'aggiunta al carrello', 'error');
    }
}

// ============================================================================
// AGGIORNAMENTO QUANTITÀ
// ============================================================================
async function updateQuantity(itemId, newQuantity) {
    const token = localStorage.getItem('miraToken');
    
    if (!token) {
        console.log('⚠️ Utente non autenticato');
        return;
    }
    
    // Validazione quantità
    if (newQuantity < 1) {
        return;
    }
    
    try {
        console.log('🔄 Aggiornamento quantità item:', itemId, 'qty:', newQuantity);
        
        const response = await fetch(`${CART_API}?id=${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                quantity: newQuantity
            })
        });
        
        const data = await response.json();
        console.log('📦 Risposta aggiornamento:', data);
        
        if (data.success) {
            console.log('✅ Quantità aggiornata');
            
            // Ricarica carrello
            await loadCart();
        } else {
            throw new Error(data.message || 'Errore aggiornamento quantità');
        }
        
    } catch (error) {
        console.error('❌ Errore aggiornamento quantità:', error);
        showToast(error.message || 'Errore durante l\'aggiornamento', 'error');
        
        // Ricarica carrello per ripristinare stato corretto
        await loadCart();
    }
}

// ============================================================================
// RIMOZIONE PRODOTTO
// ============================================================================
async function removeFromCart(itemId) {
    const token = localStorage.getItem('miraToken');
    
    if (!token) {
        console.log('⚠️ Utente non autenticato');
        return;
    }
    
    try {
        console.log('🗑️ Rimozione item:', itemId);
        
        const response = await fetch(`${CART_API}?id=${itemId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('📦 Risposta rimozione:', data);
        
        if (data.success) {
            console.log('✅ Prodotto rimosso');
            
            // Ricarica carrello
            await loadCart();
            
            showToast('Prodotto rimosso dal carrello', 'success');
        } else {
            throw new Error(data.message || 'Errore rimozione prodotto');
        }
        
    } catch (error) {
        console.error('❌ Errore rimozione dal carrello:', error);
        showToast(error.message || 'Errore durante la rimozione', 'error');
    }
}

// ============================================================================
// SVUOTAMENTO CARRELLO
// ============================================================================
async function clearCart() {
    const token = localStorage.getItem('miraToken');
    
    if (!token) {
        console.log('⚠️ Utente non autenticato');
        return;
    }
    
    if (!confirm('Sei sicuro di voler svuotare il carrello?')) {
        return;
    }
    
    try {
        console.log('🗑️ Svuotamento carrello...');
        
        const response = await fetch(`${CART_API}?clear=1`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('📦 Risposta svuotamento:', data);
        
        if (data.success) {
            console.log('✅ Carrello svuotato');
            
            // Ricarica carrello
            await loadCart();
            
            showToast('Carrello svuotato', 'success');
        } else {
            throw new Error(data.message || 'Errore svuotamento carrello');
        }
        
    } catch (error) {
        console.error('❌ Errore svuotamento carrello:', error);
        showToast(error.message || 'Errore durante lo svuotamento', 'error');
    }
}

// ============================================================================
// RENDERING CARRELLO
// ============================================================================
function renderCart() {
    const container = document.getElementById('cartContent');
    if (!container) return;
    
    // Aggiorna badge
    updateCartBadge();
    
    // Carrello vuoto
    if (!cartData.items || cartData.items.length === 0) {
        container.innerHTML = '<p class="cart-empty">Il tuo carrello è vuoto</p>';
        updateCartFooter(0);
        return;
    }
    
    // Renderizza items
    container.innerHTML = '';
    
    cartData.items.forEach(item => {
        const itemEl = createCartItem(item);
        container.appendChild(itemEl);
    });
    
    // Aggiorna footer
    updateCartFooter(cartData.total);
}

// ============================================================================
// CREAZIONE ELEMENTO CARRELLO
// ============================================================================
function createCartItem(item) {
    const div = document.createElement('div');
    div.className = 'cart-item';
    
    div.innerHTML = `
        <div class="cart-item-top">
            <div class="cart-item-image">
                <img src="${esc(safeUrl(item.image_url))}" alt="${esc(item.product_name)}">
            </div>
            <div class="cart-item-info">
                <h4 class="cart-item-name">${esc(item.product_name)}</h4>
                <p class="cart-item-variant">€${parseFloat(item.unit_price).toFixed(2)}</p>
            </div>
            <button class="cart-item-close" type="button" data-action="remove" title="Rimuovi" aria-label="Rimuovi ${esc(item.product_name)}">
                ✕
            </button>
        </div>
        
        <div class="cart-item-delivery">
            <svg width="16" height="16" fill="#059669" viewBox="0 0 16 16">
                <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5v-7zm1.294 7.456A1.999 1.999 0 0 1 4.732 11h5.536a2.01 2.01 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456zM12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12v4zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
            </svg>
            <span class="cart-item-delivery-text">Spedizione gratuita</span>
        </div>
        
        <div class="cart-item-actions">
            <div class="quantity-controls">
                <button class="quantity-btn" type="button" data-action="decrease" aria-label="Diminuisci quantità" ${item.quantity <= 1 ? 'disabled' : ''}>
                    −
                </button>
                <span class="quantity-value">${Number(item.quantity) || 0}</span>
                <button class="quantity-btn" type="button" data-action="increase" aria-label="Aumenta quantità">
                    +
                </button>
            </div>
            <button class="cart-item-remove" type="button" data-action="remove">
                Rimuovi
            </button>
        </div>
    `;

    // Niente onclick nel markup: la CSP del sito blocca il JavaScript inline.
    div.querySelectorAll('[data-action="remove"]').forEach(btn =>
        btn.addEventListener('click', () => removeFromCart(item.item_id)));
    div.querySelector('[data-action="decrease"]')
        .addEventListener('click', () => updateQuantity(item.item_id, item.quantity - 1));
    div.querySelector('[data-action="increase"]')
        .addEventListener('click', () => updateQuantity(item.item_id, item.quantity + 1));

    return div;
}

// ============================================================================
// AGGIORNAMENTO FOOTER
// ============================================================================
function updateCartFooter(total) {
    const checkoutPrice = document.querySelector('.cart-checkout-price');
    if (checkoutPrice) {
        checkoutPrice.textContent = `€${total.toFixed(2)}`;
    }
}

// ============================================================================
// AGGIORNAMENTO BADGE
// ============================================================================
function updateCartBadge() {
    const totalItems = cartData.itemsCount || 0;
    
    // Trova tutte le icone carrello
    const cartBtns = document.querySelectorAll('#cartBtn');
    
    cartBtns.forEach(cartBtn => {
        let badge = cartBtn.querySelector('.cart-badge');
        
        if (totalItems > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'cart-badge';
                cartBtn.style.position = 'relative';
                cartBtn.appendChild(badge);
            }
            badge.textContent = totalItems;
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    });
}

// ============================================================================
// NOTIFICHE TOAST
// ============================================================================
function showToast(message, type = 'success') {
    // Rimuovi toast esistenti
    const existingToast = document.querySelector('.cart-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Crea nuovo toast
    const toast = document.createElement('div');
    toast.className = `cart-toast cart-toast-${type}`;
    toast.textContent = message;
    
    // Stile inline
    toast.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================================
// ESPORTA FUNZIONI GLOBALI
// ============================================================================
window.loadCart = loadCart;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.openCart = openCart;
window.closeCart = closeCart;

// ============================================================================
// ANIMAZIONI CSS
// ============================================================================
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(400px);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@keyframes slideOut {
    from {
        transform: translateX(0);
        opacity: 1;
    }
    to {
        transform: translateX(400px);
        opacity: 0;
    }
}

.cart-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: #000;
    color: white;
    font-size: 11px;
    font-weight: 700;
    min-width: 20px;
    height: 20px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border: 2px solid #0a0a0a;
}
`;
document.head.appendChild(style);

console.log('✅ Sistema Carrello MIRA caricato completamente');