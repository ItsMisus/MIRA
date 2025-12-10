// ==================== SISTEMA DI LINGUE MULTILINGUE ====================

const translations = {
    it: {
        searchPlaceholder: "Cerca un PC",
        account: "Account",
        cart: "Carrello",
        bestSeller: "Best Seller",
        filters: "Filtra per categoria",
        allProducts: "Tutti i prodotti",
        bestSellers: "Best Sellers",
        quickShipment: "Pronta Consegna",
        offers: "Offerte Settimanali ❤",
        custom: "Crea PC Personalizzato",
        addToCart: "Aggiungi al carrello",
        components: "Componenti",
        price: "Prezzo",
        quantity: "Quantità",
        total: "Totale",
        contactUs: "Contattaci",
        home: "Home",
        gaming: "Pc Gaming",
        about: "Chi siamo",
        discord: "Discord",
        reviews: "Recensioni",
        noReviews: "Nessuna recensione",
        beFirst: "Sii il primo a recensire",
        rating: "stelle",
        clickToRead: "Clicca per leggere",
        specialOffers: "🔥 Offerte Speciali",
        approveDiscounts: "Approfitta dei nostri sconti esclusivi sui migliori PC gaming!",
        notFound: "Il prodotto che stai cercando non è disponibile",
        createCustom: "Crea il tuo PC Gaming Personalizzato",
        pageTitle: "Best Seller"
    },
    en: {
        searchPlaceholder: "Search a PC",
        account: "Account",
        cart: "Cart",
        bestSeller: "Best Seller",
        filters: "Filter by category",
        allProducts: "All products",
        bestSellers: "Best Sellers",
        quickShipment: "Quick Shipment",
        offers: "Weekly Offers ❤",
        custom: "Create Custom PC",
        addToCart: "Add to cart",
        components: "Components",
        price: "Price",
        quantity: "Quantity",
        total: "Total",
        contactUs: "Contact Us",
        home: "Home",
        gaming: "PC Gaming",
        about: "About Us",
        discord: "Discord",
        reviews: "Reviews",
        noReviews: "No reviews",
        beFirst: "Be the first to review",
        rating: "stars",
        clickToRead: "Click to read",
        specialOffers: "🔥 Special Offers",
        approveDiscounts: "Take advantage of our exclusive discounts on the best gaming PCs!",
        notFound: "The product you are looking for is not available",
        createCustom: "Create Your Custom Gaming PC",
        pageTitle: "Best Seller"
    }
};

// Lingua attuale
let currentLanguage = localStorage.getItem('siteLanguage') || 'it';

// Inizializza il sistema di lingue
function initLanguageSystem() {
    const languageDropdown = document.getElementById('languageDropdown');
    
    if(languageDropdown) {
        // Imposta la lingua salvata
        languageDropdown.value = currentLanguage;
        
        // Ascolta i cambiamenti
        languageDropdown.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    // Applica la lingua al caricamento
    applyLanguage(currentLanguage);
}

// Cambia la lingua
function changeLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('siteLanguage', lang);
    applyLanguage(lang);
    location.reload(); // Ricarica la pagina per applicare i cambiamenti
}

// Applica la lingua a tutta la pagina
function applyLanguage(lang) {
    const translation = translations[lang] || translations['it'];
    
    // Aggiorna placeholder della ricerca
    const searchInput = document.querySelector('.search-language-cart input');
    if(searchInput) {
        searchInput.placeholder = translation.searchPlaceholder;
    }
    
    // Aggiorna titoli dei bottoni
    const accountBtn = document.getElementById('accountBtn');
    if(accountBtn) {
        accountBtn.title = translation.account;
    }
    
    const cartBtn = document.getElementById('cartBtn');
    if(cartBtn) {
        cartBtn.title = translation.cart;
    }
    
    // Aggiorna i titoli delle pagine
    const pageTitle = document.querySelector('.page-title');
    if(pageTitle && pageTitle.textContent.includes('Best Seller')) {
        pageTitle.textContent = translation.bestSeller;
    }
    
    // Aggiorna bottone contatti
    const contactLink = document.querySelector('.contact-us-link');
    if(contactLink) {
        contactLink.textContent = translation.contactUs;
    }
    
    // Aggiorna categorie di navigazione
    const navLinks = document.querySelectorAll('.categories a');
    const navMapping = {
        0: 'gaming',
        1: 'offers',
        2: 'about',
        3: 'discord'
    };
    navLinks.forEach((link, index) => {
        const key = navMapping[index];
        if(key && translation[key]) {
            link.textContent = translation[key];
        }
    });
}

// Inizializza al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    initLanguageSystem();
});

// Funzione per ottenere una traduzione
function t(key) {
    const translation = translations[currentLanguage] || translations['it'];
    return translation[key] || key;
}