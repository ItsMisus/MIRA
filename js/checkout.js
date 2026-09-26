/**
 * MIRA - pagina checkout.
 * Mostra il carrello e invia l'ordine: prezzi e scorte li ricontrolla il
 * server (api/orders.php), qui si raccoglie solo l'indirizzo.
 */

(function () {
    const ORDERS_API = window.MIRA_API + '/orders.php';
    const CART_URL   = window.MIRA_API + '/cart.php';

    const euro = (n) => '€' + Number(n || 0).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function token() {
        return localStorage.getItem('miraToken');
    }

    function showMessage(text, type = 'error') {
        const box = document.getElementById('checkoutAlert');
        box.innerHTML = `<div class="checkout-alert ${type}">${esc(text)}</div>`;
        box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function goToLogin() {
        window.location.href = 'auth.html';
    }

    async function loadSummary() {
        const list   = document.getElementById('checkoutItems');
        const submit = document.getElementById('checkoutSubmit');

        const res = await fetch(CART_URL, { headers: { 'Authorization': `Bearer ${token()}` } });
        if (res.status === 401) {
            localStorage.removeItem('miraToken');
            localStorage.removeItem('miraUser');
            goToLogin();
            return;
        }
        const data = await res.json();
        const items = (data.data && data.data.items) || [];

        if (items.length === 0) {
            list.innerHTML = '<li>Il carrello è vuoto. <a href="pcgaming.html">Vai ai prodotti</a></li>';
            document.getElementById('checkoutTotal').textContent = euro(0);
            submit.disabled = true;
            return;
        }

        list.innerHTML = items.map(item => `
            <li>
                <span>${esc(item.product_name)} <span class="qty">× ${Number(item.quantity) || 0}</span></span>
                <span>${euro(item.subtotal)}</span>
            </li>`).join('');
        document.getElementById('checkoutTotal').textContent = euro(data.data.total);
        submit.disabled = false;
    }

    function prefill() {
        try {
            const user = JSON.parse(localStorage.getItem('miraUser') || 'null');
            if (user) {
                const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
                if (name) document.getElementById('fullName').value = name;
                if (user.phone) document.getElementById('phone').value = user.phone;
            }
        } catch { /* dati locali illeggibili: si compila a mano */ }
    }

    async function submitOrder(event) {
        event.preventDefault();
        const form   = event.target;
        const submit = document.getElementById('checkoutSubmit');

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const body = Object.fromEntries(new FormData(form).entries());
        submit.disabled = true;
        submit.textContent = 'Invio in corso...';

        try {
            const res = await fetch(ORDERS_API, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
                body: JSON.stringify(body)
            });
            if (res.status === 401) {
                goToLogin();
                return;
            }
            const data = await res.json();
            if (!res.ok || !data.success) {
                const details = Array.isArray(data.errors) && data.errors.length ? ': ' + data.errors.join(', ') : '';
                throw new Error((data.message || 'Ordine non inviato') + details);
            }

            document.getElementById('checkoutGrid').innerHTML = `
                <section class="checkout-card checkout-done" style="grid-column: 1 / -1">
                    <h2>Ordine ricevuto, grazie!</h2>
                    <p>Il numero del tuo ordine è</p>
                    <p class="order-number">${esc(data.data.order_number)}</p>
                    <p class="checkout-note">Non è stato addebitato nulla. Ti abbiamo scritto un'email di riepilogo e ti contatteremo per pagamento e spedizione.</p>
                    <a href="index.html">Torna alla home</a>
                </section>`;
            document.getElementById('checkoutAlert').innerHTML = '';
            if (typeof window.loadCart === 'function') window.loadCart();

        } catch (error) {
            showMessage(error.message);
            submit.disabled = false;
            submit.textContent = 'Invia ordine';
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!token()) {
            goToLogin();
            return;
        }
        prefill();
        document.getElementById('checkoutForm').addEventListener('submit', submitOrder);
        loadSummary().catch(() => showMessage('Impossibile caricare il carrello. Riprova.'));
    });
})();
