/**
 * MIRA E-Commerce - Authentication System
 * Gestisce login, registrazione e stato utente
 */

// ==================== INIT AUTH PAGE ====================
document.addEventListener('DOMContentLoaded', () => {
    initAuthPage();
    initPasswordToggles();
    checkAuthStatus();
});

// ==================== AUTH PAGE FUNCTIONALITY ====================
function initAuthPage() {
    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Switch between login/register tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Show correct form
            if (targetTab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            }
            
            // Clear alerts
            clearAlert();
        });
    });

    // Handle Login
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = loginForm.querySelector('input[type="email"]').value;
            const password = loginForm.querySelector('input[type="password"]').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Accesso in corso...';
                
                const response = await window.MiraAPI.login(email, password);
                
                if (response.success) {
                    showAlert('Login effettuato con successo!', 'success');
                    
                    // Sincronizza il carrello locale con quello del server
                    await syncCart();
                    
                    // Reindirizza dopo 1 secondo
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1000);
                }
            } catch (error) {
                console.error('Login error:', error);
                showAlert(error.message || 'Errore durante il login. Verifica le credenziali.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Accedi';
            }
        });
    }

    // Handle Registration
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const inputs = registerForm.querySelectorAll('.form-input');
            const firstName = inputs[0].value;
            const lastName = inputs[1].value;
            const email = inputs[2].value;
            const phone = inputs[3].value;
            const password = inputs[4].value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            
            // Validation
            if (password.length < 6) {
                showAlert('La password deve essere di almeno 6 caratteri', 'error');
                return;
            }
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registrazione in corso...';
                
                const response = await window.MiraAPI.register({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone: phone,
                    password: password
                });
                
                if (response.success) {
                    // Salva token e user
                    localStorage.setItem('miraToken', response.data.token);
                    localStorage.setItem('miraUser', JSON.stringify(response.data.user));
                    
                    showAlert('Registrazione completata! Reindirizzamento...', 'success');
                    
                    // Sincronizza carrello
                    await syncCart();
                    
                    // Reindirizza dopo 1.5 secondi
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 1500);
                }
            } catch (error) {
                console.error('Registration error:', error);
                showAlert(error.message || 'Errore durante la registrazione. Riprova.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Crea Account';
            }
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// ==================== PASSWORD TOGGLE ====================
function initPasswordToggles() {
    const toggleButtons = document.querySelectorAll('.password-toggle-btn');
    
    toggleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const svg = btn.querySelector('svg');
            
            if (input.type === 'password') {
                input.type = 'text';
                svg.innerHTML = `
                    <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                    <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                    <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
                `;
            } else {
                input.type = 'password';
                svg.innerHTML = `
                    <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                    <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
                `;
            }
        });
    });
}

// ==================== CHECK AUTH STATUS ====================
function checkAuthStatus() {
    const user = window.MiraAPI.getCurrentUser();
    const authPage = document.getElementById('authPage');
    const userDashboard = document.getElementById('userDashboard');
    
    if (user && window.location.pathname.includes('auth.html')) {
        // User is logged in, show dashboard
        if (authPage) authPage.style.display = 'none';
        if (userDashboard) {
            userDashboard.classList.add('active');
            document.getElementById('userName').textContent = `Ciao, ${user.first_name}!`;
            document.getElementById('userEmail').textContent = user.email;
        }
    } else if (!user && window.location.pathname.includes('auth.html')) {
        // Not logged in, show auth forms
        if (authPage) authPage.style.display = 'flex';
        if (userDashboard) userDashboard.classList.remove('active');
    }
    
    // Update header account button
    updateAccountButton();
}

// ==================== UPDATE ACCOUNT BUTTON ====================
function updateAccountButton() {
    const accountBtn = document.getElementById('accountBtn');
    if (!accountBtn) return;
    
    const user = window.MiraAPI.getCurrentUser();
    
    accountBtn.addEventListener('click', () => {
        window.location.href = 'auth.html';
    });
    
    // Change icon if logged in
    if (user) {
        accountBtn.style.borderColor = '#9b59b6';
        accountBtn.querySelector('svg').style.color = '#9b59b6';
    }
}

// ==================== SYNC CART WITH SERVER ====================
async function syncCart() {
    try {
        // Get local cart
        const localCart = JSON.parse(localStorage.getItem('miraCart') || '[]');
        
        if (localCart.length === 0) {
            // Load server cart if local is empty
            const serverCart = await window.MiraAPI.getCart();
            if (serverCart.success && serverCart.data.items) {
                // Convert server cart format to local format
                const converted = serverCart.data.items.map(item => ({
                    id: item.product_id,
                    name: item.product_name,
                    price: item.unit_price,
                    img: item.image_url,
                    qty: item.quantity
                }));
                localStorage.setItem('miraCart', JSON.stringify(converted));
            }
        } else {
            // Sync local cart to server
            for (const item of localCart) {
                try {
                    await window.MiraAPI.addToCart(item.id, item.qty);
                } catch (error) {
                    console.error('Error syncing item:', item.id, error);
                }
            }
        }
        
        // Update cart display
        if (window.cartObj && window.cartObj.updateCart) {
            window.cartObj.updateCart();
        }
        
    } catch (error) {
        console.error('Error syncing cart:', error);
    }
}

// ==================== LOGOUT ====================
function handleLogout() {
    if (confirm('Sei sicuro di voler uscire?')) {
        window.MiraAPI.logout();
        
        // Clear local cart
        localStorage.removeItem('miraCart');
        
        // Redirect to home
        window.location.href = 'index.html';
    }
}

// ==================== ALERT HELPERS ====================
function showAlert(message, type) {
    const alertContainer = document.getElementById('authAlert');
    if (!alertContainer) return;
    
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    alertContainer.innerHTML = `
        <div class="alert ${alertClass}">
            ${message}
        </div>
    `;
    
    // Auto-clear after 5 seconds
    if (type !== 'success') {
        setTimeout(clearAlert, 5000);
    }
}

function clearAlert() {
    const alertContainer = document.getElementById('authAlert');
    if (alertContainer) {
        alertContainer.innerHTML = '';
    }
}

// ==================== EXPORT ====================
if (typeof window !== 'undefined') {
    window.authSystem = {
        checkAuthStatus,
        handleLogout,
        syncCart
    };
}