/**
 * MIRA - configurazione comune a tutte le pagine.
 * Va caricato PER PRIMO, prima di ogni altro script.
 */

// Indirizzo dell'API ricavato dalla posizione di questo file (js/config.js),
// quindi giusto in locale, online e dalle pagine in Admin/.
window.MIRA_API = new URL('../api', document.currentScript.src).href.replace(/\/$/, '');

/** Testo sicuro da inserire in HTML (innerHTML, attributi). */
window.esc = function (value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

/** URL solo se http/https o relativo al sito; altrimenti stringa vuota. */
window.safeUrl = function (url) {
    if (!url) return '';
    try {
        const parsed = new URL(url, window.location.href);
        return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : '';
    } catch {
        return '';
    }
};

/** Immagine di ripiego quando quella del prodotto non si carica. */
window.MIRA_PLACEHOLDER_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect fill='%23f0f0f0' width='100' height='100'/%3E%3C/svg%3E";

/** Sostituisce le immagini rotte senza attributi onerror nel markup (bloccati dalla CSP). */
document.addEventListener('error', (event) => {
    const img = event.target;
    if (img instanceof HTMLImageElement && img.dataset.fallback !== 'done') {
        img.dataset.fallback = 'done';
        img.src = window.MIRA_PLACEHOLDER_IMG;
    }
}, true);

/**
 * Rende una scheda prodotto raggiungibile e apribile anche da tastiera e
 * annunciata come link dagli screen reader.
 */
window.makeCardLink = function (card, product) {
    const href = `product.html?id=${encodeURIComponent(product.id)}`;
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', String(product.name ?? 'Prodotto'));
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => { window.location.href = href; });
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') window.location.href = href;
    });
};

// I messaggi di debug restano in locale; online non finiscono nella console
// di chi visita il sito.
if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    console.log = () => {};
}
