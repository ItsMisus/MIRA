# GUIDA DI IMPLEMENTAZIONE - Sistemi Ottimizzati

## 🚀 Quick Start

Questo documento ti guida per integrare i nuovi sistemi nel tuo sito in 10 minuti.

---

## STEP 1: Includere gli Script Globali

### In `index.html` (nel `<head>`):
```html
<head>
    <!-- ... altri tag ... -->
    
    <!-- NUOVI SISTEMI -->
    <script src="storage.js"></script>
    <script src="languages.js"></script>
    <script src="utilities.js"></script>
    
    <!-- Poi gli script specifici della pagina -->
    <script src="script.js"></script>
</head>
```

### In `admin.html` (nel `<head>`):
```html
<head>
    <!-- ... altri tag ... -->
    
    <!-- NUOVI SISTEMI -->
    <script src="storage.js"></script>
    <script src="file-upload.js"></script>
    <script src="utilities.js"></script>
    <script src="config-admin.js"></script>
    
    <!-- Script admin -->
    <script src="admin.js"></script>
</head>
```

### In `search.html`:
```html
<head>
    <!-- ... altri tag ... -->
    <script src="storage.js"></script>
    <script src="languages.js"></script>
    <script src="utilities.js"></script>
    <script src="search.js"></script>
</head>
```

### In `pcgaming.html`:
```html
<head>
    <!-- ... altri tag ... -->
    <script src="storage.js"></script>
    <script src="languages.js"></script>
    <script src="utilities.js"></script>
    <script src="pcgaming.js"></script>
</head>
```

---

## STEP 2: Aggiornare script.js

### Sostituisci `displayProducts()` con la versione di utilities.js:

**VECCHIO (script.js, linee 86-132)**:
```javascript
function displayProducts(products) {
    productsContainer.innerHTML = '';
    
    products.forEach(prod => {
        const div = document.createElement('div');
        // ... 40+ linee di HTML building ...
        productsContainer.appendChild(div);
    });
    
    // ... click handlers ...
}
```

**NUOVO (usa utilities.js)**:
```javascript
// Semplificate così:
window.displayProducts(allProducts, 'productsContainer');
```

### Sostituisci `addToCart()`:

**VECCHIO (script.js, linee 137-154)**:
```javascript
addButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const productEl = btn.closest('.product');
        const name = productEl.dataset.name;
        const price = parseFloat(productEl.dataset.price);
        // ... cart logic ...
    });
});
```

**NUOVO**:
```javascript
// Già gestito da utilities.js al momento di display!
// attachProductCardListeners() lo fa automaticamente
```

---

## STEP 3: Aggiornare search.js

Sostituisci le linee 39-86 con:

```javascript
// PRIMA: ~80 linee
function displayProducts(products) { ... }

// DOPO: 2 linee
window.displayProducts(filteredProducts, 'productsContainer');
```

---

## STEP 4: Aggiornare pcgaming.js

### Semplificare `filterProducts()`:

**VECCHIO**:
```javascript
function applyFilter() {
    // 30+ linee di logica filtro manuale
}
```

**NUOVO**:
```javascript
function applyFilter() {
    const selected = Array.from(document.querySelectorAll('.filter-item.active'))
        .map(item => item.dataset.category);
    
    filteredProducts = selected.length === 0 
        ? allProducts 
        : allProducts.filter(p => 
            selected.some(cat => 
                Array.isArray(p.categories) 
                    ? p.categories.includes(cat)
                    : p.category === cat
            )
        );
    
    updateDisplay();
}
```

---

## STEP 5: Aggiungere Upload Immagini ad Admin

### Nel form di aggiunta PC in `admin.html`:

**Aggiungi dopo il campo `pcImg`**:
```html
<div class="form-group">
    <label for="pcImageFile">📤 Upload Immagine (PNG/JPG)</label>
    <input type="file" id="pcImageFile" accept="image/png,image/jpeg,image/webp">
    <progress id="uploadProgress" max="100" value="0" style="width:100%; height:20px; display:none;"></progress>
    <p id="uploadStatus" style="font-size:0.9rem; color:#9b59b6; display:none;"></p>
</div>
```

### In `admin.js`, aggiorna `addProduct()`:

```javascript
// Aggiungi questo PRIMA di inviare il prodotto:

// Check if file was uploaded
const imageFile = document.getElementById('pcImageFile').files[0];
let finalImgPath = img;

if (imageFile) {
    try {
        const uploadProgress = document.getElementById('uploadProgress');
        const uploadStatus = document.getElementById('uploadStatus');
        
        uploadProgress.style.display = 'block';
        uploadStatus.style.display = 'block';
        
        const uploadResult = await window.fileUpload.uploadFile(imageFile, (percent) => {
            uploadProgress.value = percent;
            uploadStatus.textContent = `Upload: ${Math.round(percent)}%`;
        });
        
        if (uploadResult.success) {
            finalImgPath = uploadResult.filePath;
            uploadStatus.textContent = '✅ Immagine caricata!';
            uploadProgress.style.display = 'none';
        } else {
            throw new Error(uploadResult.errors.join(', '));
        }
    } catch (err) {
        showMessage(`Errore upload immagine: ${err.message}`, 'error');
        return;
    }
}

// Ora usa finalImgPath invece di img
const productData = {
    name,
    price,
    discountPrice,
    discount: discountPrice && discountPrice < price,
    desc,
    components,
    img: finalImgPath,  // <-- QUI!
    categories: categoryList,
    tags: tags
};
```

---

## STEP 6: Usare Storage System per Reviews

### In `product.js`, salva le review con storage:

**VECCHIO (localStorage grezzo)**:
```javascript
let reviews = JSON.parse(localStorage.getItem(storageKey)) || [];
reviews.push(newReview);
localStorage.setItem(storageKey, JSON.stringify(reviews));
```

**NUOVO (con fallback)**:
```javascript
let reviews = [];
const storageResult = await window.storage.load(storageKey);
if (storageResult.success) {
    reviews = storageResult.data;
}

reviews.push(newReview);
await window.storage.save(storageKey, reviews);
```

---

## STEP 7: Verificare l'Implementazione

### Checklist:
- [ ] Aperire console browser (F12)
- [ ] Verificare: `window.storage` è definito
- [ ] Verificare: `window.fileUpload` è definito
- [ ] Verificare: `window.displayProducts` è definito
- [ ] Verificare: `window.utilities` è definito

```javascript
// In console, testa:
window.storage.save('test', {hello: 'world'});
await window.storage.load('test');
// Dovrebbe ritornare {hello: 'world'}
```

---

## STEP 8: Testing Funzionalità

### 1. Test Storage
```javascript
// Salva dati
await window.storage.save('mio-dato', {
    nome: 'Test PC',
    prezzo: 999
});

// Ricarica pagina

// Carica dati
const result = await window.storage.load('mio-dato');
console.log(result.data); // {nome: 'Test PC', prezzo: 999}
```

### 2. Test Upload Immagine
- Vai a `/admin.html`
- Compila form aggiunta PC
- Clicca su "Upload Immagine"
- Seleziona PNG/JPG
- Verificare che `/images/` contiene il file

### 3. Test Carrello
- Aggiungi un PC al carrello
- Ricarica pagina
- Il carrello deve ancora contenere il PC

---

## 🎯 Risultati Attesi

✅ **Performance**:
- Caricamento più veloce (utilities consolidate)
- Storage fallback automatico
- Upload immagini senza reload

✅ **Affidabilità**:
- Dati persistono anche senza file PHP
- Supporto IndexedDB + localStorage + memory
- Error handling automatico

✅ **Manutenibilità**:
- Codice duplicato eliminato (200+ linee)
- Singola fonte di verità per funzioni comuni
- Facile aggiungersi di nuove features

---

## 🆘 Troubleshooting

### "window.storage is undefined"
- ✅ Verificare `storage.js` sia incluso in `<head>`
- ✅ Verificare ordine: storage.js prima di altri script

### "uploadFile non è una funzione"
- ✅ Verificare `file-upload.js` sia incluso
- ✅ Verificare dopo `storage.js`

### Upload fallisce con errore 500
- ✅ Verificare `/images/` folder esiste
- ✅ Verificare permessi: `chmod 755 images/`
- ✅ Verificare PHP supporta file upload

### Dati non persistono
- ✅ Controllar browser console per errori
- ✅ Verificare localStorage abilitato
- ✅ Verificare non sei in private/incognito mode

---

## 📚 Riferimento Rapido API

### Storage System
```javascript
// Salva
await window.storage.save('chiave', valore);

// Carica
const {success, data} = await window.storage.load('chiave');

// Cancella tutto
await window.storage.clearAll();
```

### File Upload
```javascript
// Upload con progress
const result = await window.fileUpload.uploadFile(file, (percent) => {
    console.log(`${percent}%`);
});

if (result.success) {
    console.log(result.filePath);  // 'images/filename_1234.jpg'
}
```

### Utilities Prodotti
```javascript
// Display
window.displayProducts(products, 'containerId');

// Aggiungi carrello
window.addToCart(name, price, img);

// Filtra
window.filterByCategory(products, 'Gaming');
window.filterBySearch(products, query);
window.filterByPrice(products, 100, 2000);

// Pagina
const page = window.paginateProducts(products, 1, 12);
```

---

**Guida Completata!** 🎉

Domande? Controlla `OPTIMIZATION-REPORT.md` per dettagli tecnici.
