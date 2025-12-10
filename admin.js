// ==================== ADMIN PANEL JS ====================

let products = [];
let categories = [];
let visualTags = [];
let editingProductId = null;

// Carica i dati all'avvio
document.addEventListener('DOMContentLoaded', function() {
    // Initialize storage system first
    if (window.storage && window.storage.init) {
        window.storage.init().then(() => {
            console.log('Storage system initialized in admin');
            loadData();
        });
    } else {
        loadData();
    }
});

// FUNZIONE: Carica dati dal server
async function loadData() {
    try {
        const response = await fetch('admin-api.php?action=getAll');
        const data = await response.json();
        
        products = data.products || [];
        categories = data.categories || [];
        visualTags = data.tags || [];
        
        updateUI();
    } catch (error) {
        console.error('Errore caricamento dati:', error);
        showMessage('Errore nel caricamento dei dati', 'error');
    }
}

// FUNZIONE: Aggiorna l'interfaccia
function updateUI() {
    updateProductsTable();
    updateCategoriesSelect();
    updateCategoriesTable();
    updateTagsCheckboxes();
    updateTagsTable();
}

// FUNZIONE: Cambia tab
function switchTab(tabName) {
    // Nascondi tutti i tab
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Nascondi tutti i bottoni tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Mostra il tab selezionato
    document.getElementById(tabName).classList.add('active');
    
    // Evidenzia il bottone
    event.target.classList.add('active');
}

// FUNZIONE: Mostra messaggio
function showMessage(message, type = 'success') {
    const msgBox = document.getElementById('messageBox');
    msgBox.textContent = message;
    msgBox.className = `message ${type}`;
    
    setTimeout(() => {
        msgBox.classList.remove('success', 'error');
    }, 5000);
}

// ==================== GESTIONE PC ====================

// FUNZIONE: Aggiungi categoria a un prodotto
function addCategory() {
    const select = document.getElementById('categorySelect');
    const categoryName = select.value;
    
    if (!categoryName) {
        showMessage('Seleziona una categoria', 'error');
        return;
    }
    
    const container = document.getElementById('selectedCategories');
    const categoryTag = document.createElement('span');
    categoryTag.className = 'tag';
    categoryTag.innerHTML = `${categoryName} <span class="tag-remove" onclick="this.parentElement.remove()">✕</span>`;
    categoryTag.dataset.category = categoryName;
    
    container.appendChild(categoryTag);
    select.value = '';
}

// FUNZIONE: Ottieni categorie selezionate
function getSelectedCategories() {
    const tags = document.querySelectorAll('#selectedCategories .tag');
    return Array.from(tags).map(tag => tag.dataset.category);
}

// FUNZIONE: Aggiungi prodotto
async function addProduct() {
    const name = document.getElementById('pcName').value.trim();
    const price = parseFloat(document.getElementById('pcPrice').value);
    const discountPrice = document.getElementById('pcDiscountPrice').value ? parseFloat(document.getElementById('pcDiscountPrice').value) : null;
    const desc = document.getElementById('pcDesc').value.trim();
    const components = document.getElementById('pcComponents').value.trim();
    let img = document.getElementById('pcImg').value.trim();
    const categoryList = getSelectedCategories();
    const tags = getSelectedTags();
    
    // Validazione base
    if (!name || !price || !desc || !components || categoryList.length === 0) {
        showMessage('Compila tutti i campi obbligatori', 'error');
        return;
    }

    // Gestisci upload immagine se presente
    const imageFile = document.getElementById('pcImageFile').files[0];
    if (imageFile) {
        try {
            const uploadProgress = document.getElementById('uploadProgress');
            const uploadStatus = document.getElementById('uploadStatus');
            
            uploadProgress.style.display = 'block';
            uploadStatus.style.display = 'block';
            uploadStatus.textContent = 'Caricamento immagine...';
            
            const uploadResult = await window.fileUpload.uploadFile(imageFile, (percent) => {
                uploadProgress.value = percent;
                uploadStatus.textContent = `Upload: ${Math.round(percent)}%`;
            });
            
            if (uploadResult.success) {
                img = uploadResult.filePath;
                uploadStatus.textContent = '✅ Immagine caricata!';
                setTimeout(() => {
                    uploadProgress.style.display = 'none';
                    uploadStatus.style.display = 'none';
                }, 2000);
            } else {
                throw new Error(uploadResult.errors ? uploadResult.errors.join(', ') : 'Errore upload');
            }
        } catch (err) {
            showMessage(`Errore upload immagine: ${err.message}`, 'error');
            return;
        }
    }

    // Validazione finale dell'immagine
    if (!img) {
        showMessage('Inserisci un URL immagine o carica un file', 'error');
        return;
    }
    
    const productData = {
        name,
        price,
        discountPrice,
        discount: discountPrice && discountPrice < price,
        desc,
        components,
        img,
        categories: categoryList,
        tags: tags
    };
    
    try {
        const response = await fetch('admin-api.php?action=addProduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('PC aggiunto con successo! ✅', 'success');
            resetForm();
            loadData();
        } else {
            showMessage(result.message || 'Errore', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('Errore nel salvataggio', 'error');
    }
}

// FUNZIONE: Reimposta il form
function resetForm() {
    document.getElementById('pcName').value = '';
    document.getElementById('pcPrice').value = '';
    document.getElementById('pcDiscountPrice').value = '';
    document.getElementById('pcDesc').value = '';
    document.getElementById('pcComponents').value = '';
    document.getElementById('pcImg').value = '';
    document.getElementById('selectedCategories').innerHTML = '';
    document.querySelectorAll('#tagsContainer input[type="checkbox"]').forEach(cb => cb.checked = false);
}

// FUNZIONE: Aggiorna tabella prodotti
function updateProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    products.forEach((product, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${product.name}</strong></td>
            <td>
                €${product.price}
                ${product.discount ? `<br><span style="text-decoration:line-through; color:#999;">€${product.discountPrice}</span>` : ''}
            </td>
            <td>
                ${product.categories.map(cat => `<span class="tag">${cat}</span>`).join('')}
            </td>
            <td>
                ${product.tags.map(tag => `<span class="tag" style="background: #e74c3c;">${tag}</span>`).join('')}
            </td>
            <td>
                <div class="actions-btn">
                    <button class="btn-edit" onclick="editProduct(${index})">✏️ Modifica</button>
                    <button class="btn-delete" onclick="deleteProduct(${index})">🗑️ Elimina</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// FUNZIONE: Modifica prodotto
function editProduct(index) {
    editingProductId = index;
    const product = products[index];
    
    const modal = document.getElementById('editModal');
    const content = document.getElementById('editFormContent');
    
    content.innerHTML = `
        <div class="form-grid full">
            <div class="form-group">
                <label>Nome PC:</label>
                <input type="text" id="editName" value="${product.name}">
            </div>

            <div class="form-group">
                <label>Prezzo (€):</label>
                <input type="number" id="editPrice" value="${product.price}">
            </div>

            <div class="form-group">
                <label>Prezzo Scontato (€):</label>
                <input type="number" id="editDiscountPrice" value="${product.discountPrice || ''}">
            </div>

            <div class="form-group">
                <label>Descrizione:</label>
                <textarea id="editDesc">${product.desc}</textarea>
            </div>

            <div class="form-group">
                <label>Componenti:</label>
                <textarea id="editComponents">${product.components}</textarea>
            </div>

            <div class="form-group">
                <label>URL Immagine:</label>
                <input type="url" id="editImg" value="${product.img}">
            </div>

            <div class="form-group full">
                <label>Categorie:</label>
                <div id="editSelectedCategories" style="margin-top: 10px;">
                    ${product.categories.map(cat => `<span class="tag" data-category="${cat}">${cat} <span class="tag-remove" onclick="this.parentElement.remove()">✕</span></span>`).join('')}
                </div>
                <div style="margin-top: 10px;">
                    <select id="editCategorySelect">
                        <option value="">-- Aggiungi categoria --</option>
                        ${categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('')}
                    </select>
                    <button class="btn-primary" onclick="addEditCategory()" style="margin-left: 10px;">+ Aggiungi</button>
                </div>
            </div>

            <div class="form-actions" style="grid-column: 1 / -1;">
                <button class="btn-primary" onclick="saveEditProduct()">💾 Salva Modifiche</button>
                <button class="btn-secondary" onclick="closeEditModal()">❌ Annulla</button>
            </div>
        </div>
    `;
    
    modal.classList.add('show');
}

// FUNZIONE: Aggiungi categoria nella modal di modifica
function addEditCategory() {
    const select = document.getElementById('editCategorySelect');
    const categoryName = select.value;
    
    if (!categoryName) return;
    
    const container = document.getElementById('editSelectedCategories');
    
    // Controlla se già esiste
    if (container.querySelector(`[data-category="${categoryName}"]`)) {
        showMessage('Categoria già aggiunta', 'error');
        return;
    }
    
    const categoryTag = document.createElement('span');
    categoryTag.className = 'tag';
    categoryTag.innerHTML = `${categoryName} <span class="tag-remove" onclick="this.parentElement.remove()">✕</span>`;
    categoryTag.dataset.category = categoryName;
    
    container.appendChild(categoryTag);
    select.value = '';
}

// FUNZIONE: Salva modifiche prodotto
async function saveEditProduct() {
    const index = editingProductId;
    const product = products[index];
    
    const editedCategories = Array.from(document.querySelectorAll('#editSelectedCategories .tag')).map(tag => tag.dataset.category);
    
    const updatedProduct = {
        ...product,
        name: document.getElementById('editName').value,
        price: parseFloat(document.getElementById('editPrice').value),
        discountPrice: document.getElementById('editDiscountPrice').value ? parseFloat(document.getElementById('editDiscountPrice').value) : null,
        discount: document.getElementById('editDiscountPrice').value && parseFloat(document.getElementById('editDiscountPrice').value) < parseFloat(document.getElementById('editPrice').value),
        desc: document.getElementById('editDesc').value,
        components: document.getElementById('editComponents').value,
        img: document.getElementById('editImg').value,
        categories: editedCategories
    };
    
    try {
        const response = await fetch('admin-api.php?action=updateProduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index, product: updatedProduct })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('PC modificato con successo! ✅', 'success');
            closeEditModal();
            loadData();
        } else {
            showMessage(result.message || 'Errore', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('Errore nel salvataggio', 'error');
    }
}

// FUNZIONE: Chiudi modal
function closeEditModal() {
    document.getElementById('editModal').classList.remove('show');
    editingProductId = null;
}

// FUNZIONE: Elimina prodotto
async function deleteProduct(index) {
    if (!confirm('Sei sicuro di voler eliminare questo PC?')) return;
    
    try {
        const response = await fetch('admin-api.php?action=deleteProduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('PC eliminato con successo! ✅', 'success');
            loadData();
        } else {
            showMessage(result.message || 'Errore', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('Errore nell\'eliminazione', 'error');
    }
}

// ==================== GESTIONE CATEGORIE ====================

// FUNZIONE: Aggiorna select categorie
function updateCategoriesSelect() {
    const select = document.getElementById('categorySelect');
    const editSelect = document.getElementById('editCategorySelect');
    
    const options = categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
    
    select.innerHTML = '<option value="">-- Seleziona categoria --</option>' + options;
    if (editSelect) {
        editSelect.innerHTML = '<option value="">-- Aggiungi categoria --</option>' + options;
    }
}

// FUNZIONE: Aggiungi categoria nuova
async function addCategoryNew() {
    const name = document.getElementById('categoryName').value.trim();
    const color = document.getElementById('categoryColor').value;
    const desc = document.getElementById('categoryDesc').value.trim();
    
    if (!name) {
        showMessage('Inserisci il nome della categoria', 'error');
        return;
    }
    
    try {
        const response = await fetch('admin-api.php?action=addCategory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, color, desc })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Categoria aggiunta con successo! ✅', 'success');
            document.getElementById('categoryName').value = '';
            document.getElementById('categoryDesc').value = '';
            loadData();
        } else {
            showMessage(result.message || 'Errore', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('Errore nel salvataggio', 'error');
    }
}

// FUNZIONE: Aggiorna tabella categorie
function updateCategoriesTable() {
    const tbody = document.getElementById('categoriesTableBody');
    tbody.innerHTML = '';
    
    categories.forEach((category, index) => {
        const pcCount = products.filter(p => p.categories.includes(category.name)).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td><span class="tag" style="background: ${category.color};">${category.color}</span></td>
            <td>${pcCount}</td>
            <td>
                <button class="btn-delete" onclick="deleteCategory(${index})">🗑️ Elimina</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// FUNZIONE: Elimina categoria
async function deleteCategory(index) {
    if (!confirm('Sei sicuro? Questa categoria verrà rimossa dai PC associati.')) return;
    
    try {
        const response = await fetch('admin-api.php?action=deleteCategory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Categoria eliminata! ✅', 'success');
            loadData();
        } else {
            showMessage(result.message || 'Errore', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('Errore nell\'eliminazione', 'error');
    }
}

// ==================== GESTIONE TAG VISIVI ====================

// FUNZIONE: Aggiorna checkboxes tag
function updateTagsCheckboxes() {
    const container = document.getElementById('tagsContainer');
    container.innerHTML = '';
    
    visualTags.forEach(tag => {
        const label = document.createElement('label');
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '10px';
        label.style.cursor = 'pointer';
        label.innerHTML = `
            <input type="checkbox" value="${tag.name}" style="width: 20px; height: 20px;">
            <span>${tag.icon} ${tag.name}</span>
        `;
        container.appendChild(label);
    });
}

// FUNZIONE: Ottieni tag selezionati
function getSelectedTags() {
    const checkboxes = document.querySelectorAll('#tagsContainer input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// FUNZIONE: Aggiungi tag visivo
async function addTag() {
    const name = document.getElementById('tagName').value.trim();
    const icon = document.getElementById('tagIcon').value.trim();
    const color = document.getElementById('tagColor').value;
    const desc = document.getElementById('tagDesc').value.trim();
    
    if (!name || !icon) {
        showMessage('Inserisci nome e icona del tag', 'error');
        return;
    }
    
    try {
        const response = await fetch('admin-api.php?action=addTag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, icon, color, desc })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Tag aggiunto con successo! ✅', 'success');
            document.getElementById('tagName').value = '';
            document.getElementById('tagIcon').value = '';
            document.getElementById('tagDesc').value = '';
            loadData();
        } else {
            showMessage(result.message || 'Errore', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('Errore nel salvataggio', 'error');
    }
}

// FUNZIONE: Aggiorna tabella tag
function updateTagsTable() {
    const tbody = document.getElementById('tagsTableBody');
    tbody.innerHTML = '';
    
    visualTags.forEach((tag, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="tag" style="background: ${tag.color};">${tag.icon} ${tag.name}</span></td>
            <td>${tag.desc}</td>
            <td>
                <button class="btn-delete" onclick="deleteTag(${index})">🗑️ Elimina</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// FUNZIONE: Elimina tag
async function deleteTag(index) {
    if (!confirm('Sei sicuro di voler eliminare questo tag?')) return;
    
    try {
        const response = await fetch('admin-api.php?action=deleteTag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ index })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Tag eliminato! ✅', 'success');
            loadData();
        } else {
            showMessage(result.message || 'Errore', 'error');
        }
    } catch (error) {
        console.error('Errore:', error);
        showMessage('Errore nell\'eliminazione', 'error');
    }
}
