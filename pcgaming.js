document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('productsContainer');
    const productCountEl = document.getElementById('productCount');
    const sortSelect = document.getElementById('sortSelect');
    const filterButtons = document.querySelectorAll('.filter-item');

    if (!productsContainer) return;

    const PRODUCTS_PER_PAGE = 12;
    let allProducts = [];
    let filteredProducts = [];
    let currentPage = 1;
    let currentCategory = 'all';

    // Toggle filtri su mobile
    const filtersSidebar = document.querySelector('.filters-sidebar h2');
    const filterList = document.querySelector('.filter-list');
    
    if (filtersSidebar && filterList) {
        filtersSidebar.addEventListener('click', () => {
            filtersSidebar.classList.toggle('active');
            filterList.classList.toggle('show');
        });
    }

    // Carica prodotti
    fetch('products.json')
        .then(res => res.json())
        .then(products => {
            allProducts = products;
            filteredProducts = [...products];
            updateDisplay();
        })
        .catch(err => console.error('Errore caricamento prodotti:', err));

    // Event Listeners Filtri
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            applyFilter();
        });
    });

    // Event Listener Sort
    sortSelect.addEventListener('change', () => {
        applySort();
    });

    // Applica Filtro
    function applyFilter() {
        if (currentCategory === 'all') {
            filteredProducts = [...allProducts];
        } else {
            filteredProducts = allProducts.filter(p => p.category === currentCategory);
        }
        currentPage = 1;
        applySort();
    }

    // Applica Ordinamento
    function applySort() {
        const sortValue = sortSelect.value;
        
        switch(sortValue) {
            case 'best-seller':
                filteredProducts.sort((a, b) => {
                    const aIsBest = a.category === 'bestseller' ? 1 : 0;
                    const bIsBest = b.category === 'bestseller' ? 1 : 0;
                    return bIsBest - aIsBest;
                });
                break;
            case 'alpha-asc':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'alpha-desc':
                filteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price-asc':
                filteredProducts.sort((a, b) => {
                    const priceA = a.discount ? a.discountPrice : a.price;
                    const priceB = b.discount ? b.discountPrice : b.price;
                    return priceA - priceB;
                });
                break;
            case 'price-desc':
                filteredProducts.sort((a, b) => {
                    const priceA = a.discount ? a.discountPrice : a.price;
                    const priceB = b.discount ? b.discountPrice : b.price;
                    return priceB - priceA;
                });
                break;
            case 'date-asc':
                filteredProducts.sort((a, b) => (a.date || 0) - (b.date || 0));
                break;
            case 'date-desc':
                filteredProducts.sort((a, b) => (b.date || 0) - (a.date || 0));
                break;
            case 'featured':
            default:
                // Ordine originale
                break;
        }
        
        updateDisplay();
    }

    // Aggiorna Display
    function updateDisplay() {
        displayProducts();
        updatePagination();
        updateCounter();
    }

    // Mostra Prodotti
    function displayProducts() {
        const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
        const end = start + PRODUCTS_PER_PAGE;
        const pageProducts = filteredProducts.slice(start, end);
        
        productsContainer.innerHTML = '';
        
        if (pageProducts.length === 0) {
            productsContainer.innerHTML = '<p style="text-align:center; color:#aaa; grid-column:1/-1; font-size:1.2rem; margin:50px 0;">Nessun prodotto trovato in questa categoria.</p>';
            return;
        }
        
        pageProducts.forEach(prod => {
            const div = document.createElement('div');
            div.className = 'product';
            
            if (prod.discount) {
                div.classList.add('discount');
            }
            
            div.dataset.name = prod.name;
            div.dataset.price = prod.discount ? prod.discountPrice : prod.price;
            div.dataset.desc = prod.desc;
            div.dataset.img = prod.img;

            let priceHTML = '';
            if (prod.discount) {
                priceHTML = `
                    <p>
                        <span style="color:#888; text-decoration:line-through; font-size:0.9rem;">€ ${prod.price.toFixed(2)}</span>
                        <span style="color:#9b59b6; font-weight:700; margin-left:10px;">€ ${prod.discountPrice.toFixed(2)}</span>
                    </p>
                `;
            } else {
                priceHTML = `<p style="color:#9b59b6; font-weight:700;">€ ${prod.price.toFixed(2)}</p>`;
            }

            div.innerHTML = `
                <img src="${prod.img}" alt="${prod.name}">
                <h3>${prod.name}</h3>
                <p>${prod.desc}</p>
                ${priceHTML}
                <button class="add-to-cart">Aggiungi al carrello</button>
            `;

            div.addEventListener('click', e => {
                if (!e.target.classList.contains('add-to-cart')) {
                    window.location.href = `product.html?name=${encodeURIComponent(prod.name)}`;
                }
            });

            productsContainer.appendChild(div);
        });

        // Event listeners per add to cart
        const addButtons = document.querySelectorAll('.add-to-cart');
        addButtons.forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const productEl = btn.closest('.product');
                if (!productEl) return;

                const name = productEl.dataset.name;
                const price = parseFloat(productEl.dataset.price);
                const img = productEl.dataset.img;
                const desc = productEl.dataset.desc;

                if (typeof cartObj !== 'undefined') {
                    const existing = cartObj.cart.find(p => p.name === name);
                    if (existing) {
                        existing.qty += 1;
                    } else {
                        cartObj.cart.push({ name, desc, price, img, qty: 1 });
                    }
                    
                    cartObj.updateCart();
                    
                    const cartSidebar = document.getElementById('cartSidebar');
                    if (cartSidebar) {
                        cartSidebar.classList.add('active');
                    }
                    
                    btn.textContent = '✓ Aggiunto';
                    btn.style.background = '#27ae60';
                    setTimeout(() => {
                        btn.textContent = 'Aggiungi al carrello';
                        btn.style.background = '';
                    }, 1500);
                }
            });
        });
    }

    // Aggiorna Paginazione - CREATA DINAMICAMENTE
    function updatePagination() {
        const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
        
        // Cerca o crea il container della paginazione
        let paginationContainer = document.querySelector('.pagination-container');
        
        // Se non esiste, crealo
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.className = 'pagination-container';
            
            // Inseriscilo dopo la griglia prodotti
            const catalogMain = document.querySelector('.catalog-main');
            if (catalogMain) {
                catalogMain.appendChild(paginationContainer);
            }
        }
        
        // Svuota il container
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }
        
        paginationContainer.style.display = 'flex';
        
        // Freccia sinistra
        const prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-arrow';
        prevBtn.innerHTML = '←';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateDisplay();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(prevBtn);
        
        // Info pagina
        const pageInfo = document.createElement('div');
        pageInfo.className = 'pagination-info';
        pageInfo.innerHTML = `
            Pagina 
            <span class="pagination-current">${currentPage}</span>
            di 
            <span>${totalPages}</span>
        `;
        paginationContainer.appendChild(pageInfo);
        
        // Freccia destra
        const nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-arrow';
        nextBtn.innerHTML = '→';
        nextBtn.disabled = currentPage >= totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateDisplay();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
        paginationContainer.appendChild(nextBtn);
    }

    // Aggiorna Counter
    function updateCounter() {
        if (productCountEl) {
            productCountEl.textContent = filteredProducts.length;
        }
    }
});