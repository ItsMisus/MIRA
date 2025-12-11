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
        pageTitle: "Best Seller",
        // Pagina Contattaci
        contactPageTitle: "Contattaci",
        contactName: "Nome:",
        contactSurname: "Cognome:",
        contactEmail: "Email:",
        contactEmailPlaceholder: "Es. esempio@email.com",
        contactMessage: "Corpo del Messaggio:",
        contactSubmit: "Invia ora",
        // Footer
        whoWeAre: "Chi Siamo",
        ourStory: "La nostra storia",
        contactPageLink: "Contattaci",
        discordCommunity: "Community Discord",
        legalInfo: "Informazioni Legali",
        support: "Supporto",
        createPC: "Crea PC Custom",
        completeCatalog: "Catalogo Completo",
        allRightsReserved: "© 2025 MIRA | Tutti i diritti riservati"
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
        pageTitle: "Best Seller",
        // Contact Page
        contactPageTitle: "Contact Us",
        contactName: "Name:",
        contactSurname: "Surname:",
        contactEmail: "Email:",
        contactEmailPlaceholder: "E.g. example@email.com",
        contactMessage: "Message Body:",
        contactSubmit: "Send Now",
        // Footer
        whoWeAre: "About Us",
        ourStory: "Our Story",
        contactPageLink: "Contact Us",
        discordCommunity: "Discord Community",
        legalInfo: "Legal Information",
        support: "Support",
        createPC: "Create Custom PC",
        completeCatalog: "Complete Catalog",
        allRightsReserved: "© 2025 MIRA | All rights reserved"
    }
};

// Lingua attuale - carica dal localStorage
let currentLanguage = localStorage.getItem('siteLanguage') || 'it';

/**
 * Traduce tutti gli elementi con data-i18n nel DOM
 */
function applyLanguage(lang) {
    console.log('Applicando lingua:', lang); // Debug
    
    const translation = translations[lang] || translations['it'];
    
    // Traduce elementi con data-i18n (testo)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if(translation[key]) {
            element.textContent = translation[key];
        }
    });
    
    // Traduce placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if(translation[key]) {
            element.setAttribute('placeholder', translation[key]);
        }
    });
    
    // Traduce title
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if(translation[key]) {
            element.setAttribute('title', translation[key]);
        }
    });
}

/**
 * Inizializza il sistema di traduzione
 */
function initLanguageSystem() {
    console.log('Inizializzando sistema linguistico'); // Debug
    
    const languageDropdown = document.getElementById('languageDropdown');
    
    if(languageDropdown) {
        // Imposta il valore attuale nel dropdown
        languageDropdown.value = currentLanguage;
        
        // Ascolta i cambiamenti
        languageDropdown.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    // Applica la lingua al caricamento
    applyLanguage(currentLanguage);
}

/**
 * Cambia la lingua (senza ricaricare la pagina)
 */
function changeLanguage(lang) {
    console.log('Cambiando lingua a:', lang); // Debug
    
    currentLanguage = lang;
    localStorage.setItem('siteLanguage', lang);
    applyLanguage(lang);
}

/**
 * Funzione helper per ottenere una traduzione
 */
function t(key) {
    const translation = translations[currentLanguage] || translations['it'];
    return translation[key] || key;
}