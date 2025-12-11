# 🎮 Pannello Admin MINUTECH - Documentazione Completa

## 📋 Cosa è stato creato

Un pannello admin completo per gestire:
- ✅ **Prodotti (PC Gaming)** - Aggiungi, modifica, elimina
- ✅ **Categorie Multiple** - Assegna più categorie ad un PC
- ✅ **Tag Visivi** - Best Seller, Hot Deal, Nuovo, etc
- ✅ **Sconti** - Barra il prezzo originale e mostra lo sconto
- ✅ **Immagini** - Carica via URL
- ✅ **Paginazione Automatica** - 6 PC per pagina

---

## 🚀 Come iniziare

### 1️⃣ Setup iniziale

#### **Opzione A: Migrare i prodotti (CONSIGLIATO)**

1. Apri nel browser: `setup-admin.html`
2. Clicca su "Esegui Migrazione"
3. Apri `migrate-browser.html`
4. Scarica il file `products.json` generato
5. Sostituisci il file `products.json` della cartella con quello scaricato

#### **Opzione B: Migrazione automatica tramite PHP**

Se hai PHP installato, esegui:
```bash
php migrate.php
```

### 2️⃣ Accedi al Pannello Admin

Apri nel browser:
```
http://localhost/minutech/admin.html
```

---

## 📁 File Creati

```
admin.html              # Pannello admin (interfaccia)
admin.js               # Logica del pannello admin
admin-api.php          # API backend per operazioni CRUD
admin-categories.json  # Categorie disponibili
admin-tags.json        # Tag visivi disponibili
setup-admin.html       # Setup e configurazione
migrate-browser.html   # Migrazione browser-based
migrate.php            # Migrazione PHP (se disponibile)
README-ADMIN.md        # Questa documentazione
```

---

## 🎯 Funzionalità Dettagliate

### Gestione PC

**Aggiungi Nuovo PC:**
- Nome PC
- Prezzo
- Prezzo scontato (opzionale - barra il prezzo originale)
- Descrizione completa
- Componenti specifici
- URL Immagine
- Categorie multiple (puoi assegnarne più di una)
- Tag visivi (Best Seller, Hot Deal, etc)

**Modifica PC:**
- Clicca "✏️ Modifica" nella tabella
- Modifica tutti i campi
- Puoi aggiungere/rimuovere categorie direttamente

**Elimina PC:**
- Clicca "🗑️ Elimina"
- Conferma l'eliminazione

### Gestione Categorie

**Aggiungi Categoria:**
- Nome categoria
- Colore del tag (scegli dal color picker)
- Descrizione

**Categorie Predefinite:**
- bestseller
- offerte
- pronta-consegna
- console-killer

**Elimina Categoria:**
- La categoria viene rimossa da tutti i PC associati

### Tag Visivi

**Aggiungi Tag:**
- Nome (es. "Best Seller")
- Icona/Emoji (es. "⭐")
- Colore del badge
- Descrizione

**Tag Predefiniti:**
- ⭐ Best Seller
- 🔥 Hot Deal
- ✨ Nuovo
- 👍 Consigliato

---

## 📊 Struttura Dati

### Prodotto (Nuovo Formato)

```json
{
  "name": "Kraken Elite",
  "price": 849,
  "discountPrice": 799,
  "discount": true,
  "desc": "Descrizione completa...",
  "img": "https://...",
  "components": "Ryzen 7 | 32GB | RTX 4070 Ti | ...",
  "categories": ["bestseller", "pronta-consegna"],
  "tags": ["Best Seller", "Hot Deal"]
}
```

### Categoria

```json
{
  "name": "bestseller",
  "color": "#f39c12",
  "desc": "I nostri prodotti più venduti"
}
```

### Tag Visivo

```json
{
  "name": "Best Seller",
  "icon": "⭐",
  "color": "#f39c12",
  "desc": "Prodotto molto richiesto"
}
```

---

## 🔧 API Backend

### Endpoints Disponibili

- `GET admin-api.php?action=getAll` - Carica tutti i dati
- `POST admin-api.php?action=addProduct` - Aggiungi prodotto
- `POST admin-api.php?action=updateProduct` - Modifica prodotto
- `POST admin-api.php?action=deleteProduct` - Elimina prodotto
- `POST admin-api.php?action=addCategory` - Aggiungi categoria
- `POST admin-api.php?action=deleteCategory` - Elimina categoria
- `POST admin-api.php?action=addTag` - Aggiungi tag
- `POST admin-api.php?action=deleteTag` - Elimina tag

### Esempio POST (JSON)

```javascript
fetch('admin-api.php?action=addProduct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: "PC Nome",
    price: 999,
    discountPrice: 899,
    discount: true,
    desc: "Descrizione",
    components: "CPU | RAM | GPU",
    img: "https://...",
    categories: ["bestseller"],
    tags: ["Best Seller"]
  })
})
```

---

## 🎨 Integrazione con il Sito

### Visualizzazione Prodotti

I prodotti vengono caricati da `products.json` in:
- `index.html` - Pagina principale
- `pcgaming.html` - Catalogo PC
- `product.html` - Dettaglio prodotto

### Rendering Categorie

```javascript
// Nel file script.js aggiorna per supportare categorie multiple
product.categories.forEach(cat => {
  // Mostra il badge categoria
});
```

### Rendering Sconto

```javascript
// Se product.discount è true, mostra sconto
if (product.discount) {
  // Barra prezzo originale
  // Mostra prezzo scontato
}
```

### Rendering Tag

```javascript
// Se product.tags ha elementi, mostra i tag
product.tags.forEach(tag => {
  // Mostra il tag con icona e colore
});
```

---

## 📱 Responsiveness

Il pannello admin è completamente responsivo:
- Desktop: 2 colonne nel form
- Tablet: 1-2 colonne
- Mobile: 1 colonna

---

## 🔒 Sicurezza

⚠️ **IMPORTANTE**: Questo pannello admin NON ha autenticazione!

### Per produzione:
1. Aggiungi login/password
2. Usa sessioni PHP
3. Valida tutti gli input server-side
4. Usa HTTPS

### Esempio di protezione PHP:

```php
// Aggiungi all'inizio di admin-api.php
session_start();
if (!isset($_SESSION['admin_logged_in'])) {
    echo json_encode(['success' => false, 'message' => 'Non autorizzato']);
    exit;
}
```

---

## 🐛 Troubleshooting

### "File non trovato"
- Verifica che `admin-api.php`, `admin-categories.json`, `admin-tags.json` siano nella stessa cartella
- Controlla i percorsi dei file

### "Errore nel salvataggio"
- PHP potrebbe non avere permessi di scrittura
- Controlla i permessi della cartella (755 per Linux/Mac)
- Su Windows, controlla le proprietà della cartella

### "Prodotti non caricano"
- Esegui la migrazione con `migrate-browser.html`
- Verifica che `products.json` sia valido JSON

### "API non risponde"
- Verifica che il server PHP stia girando
- Controlla la console del browser (F12 → Console)
- Verifica CORS se su domini diversi

---

## 📝 Note Importanti

1. **Paginazione**: Implementa nel frontend per mostrare 6 PC per pagina
2. **Immagini**: Usa URL esterne (CDN consigliato)
3. **Backup**: Fai backup di `products.json` regolarmente
4. **Valori Vuoti**: I campi opzionali (discountPrice, tags) possono restare vuoti

---

## 📞 Supporto

Per problemi:
1. Controlla la console del browser (F12)
2. Verifica che i file siano nel posto giusto
3. Controlla che PHP sia configurato correttamente
4. Verifica i permessi di scrittura delle cartelle

---

## ✅ Checklist Setup

- [ ] File `admin.html` presente
- [ ] File `admin.js` presente
- [ ] File `admin-api.php` presente
- [ ] File `admin-categories.json` presente
- [ ] File `admin-tags.json` presente
- [ ] Eseguita migrazione di `products.json`
- [ ] Accesso a `admin.html` funzionante
- [ ] Pannello carica correttamente
- [ ] Riesce ad aggiungere un nuovo PC
- [ ] Riesce a modificare un PC
- [ ] Riesce a eliminare un PC

---

**Buona amministrazione! 🚀**
