/**
 * MIRA E-Commerce - Contact Form Handler
 * js/contact.js
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Contact.js caricato');
    initContactForm();
    initFAQ();
});

function initContactForm() {
    const contactForm = document.getElementById('contactForm');
    const formAlert = document.getElementById('formAlert');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!contactForm) {
        console.log('Form contatti non trovato in questa pagina');
        return;
    }
    
    console.log('Form contatti trovato, verifico autenticazione...');
    
    // Verifica autenticazione
    const token = localStorage.getItem('miraToken');
    const user = localStorage.getItem('miraUser');
    
    if (!token || !user) {
        console.log('Utente NON autenticato');
        showAuthRequired();
        return;
    }
    
    console.log('Utente autenticato, pre-compilo il form');
    
    // Pre-compila il form con i dati utente
    const userData = JSON.parse(user);
    if (userData) {
        const firstNameInput = document.getElementById('firstName');
        const lastNameInput = document.getElementById('lastName');
        const emailInput = document.getElementById('email');
        
        if (firstNameInput) firstNameInput.value = userData.first_name || '';
        if (lastNameInput) lastNameInput.value = userData.last_name || '';
        if (emailInput) emailInput.value = userData.email || '';
        
        // Rendi i campi readonly
        if (firstNameInput) firstNameInput.readOnly = true;
        if (lastNameInput) lastNameInput.readOnly = true;
        if (emailInput) emailInput.readOnly = true;
    }
    
    // Gestisci invio form
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        console.log('Form inviato, elaborazione...');
        
        const messageInput = document.getElementById('message');
        const formData = {
            first_name: document.getElementById('firstName').value,
            last_name: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            message: messageInput.value
        };
        
        console.log('Dati form:', formData);
        
        // Validazione base
        const messageText = formData.message ? formData.message.trim() : '';
        console.log('Lunghezza messaggio:', messageText.length);
        
        if (messageText.length < 10) {
            console.log('Messaggio troppo corto');
            showAlert('Il messaggio deve essere di almeno 10 caratteri', 'error');
            return;
        }
        
        console.log('Validazione OK, invio richiesta...');
        
        // Disabilita bottone
        submitBtn.disabled = true;
        submitBtn.textContent = 'Invio in corso...';
        
        try {
            console.log('Chiamata API sendContactMessage...');
            
            const response = await window.MiraAPI.sendContactMessage(formData);
            
            console.log('Risposta API:', response);
            
            if (response && response.success) {
                showAlert('Messaggio inviato con successo! Ti risponderemo al più presto.', 'success');
                
                // Svuota solo il campo messaggio
                messageInput.value = '';
                
                // Scroll to top
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                console.log('✅ Messaggio inviato con successo');
            } else {
                const errorMsg = response && response.message ? response.message : 'Errore nell\'invio del messaggio';
                throw new Error(errorMsg);
            }
            
        } catch (error) {
            console.error('❌ Errore invio messaggio:', error);
            showAlert(error.message || 'Errore nell\'invio del messaggio. Riprova più tardi.', 'error');
        } finally {
            // Riabilita bottone
            submitBtn.disabled = false;
            submitBtn.textContent = 'Invia Messaggio';
        }
    });
}

function showAuthRequired() {
    const contactForm = document.getElementById('contactForm');
    const formSection = contactForm.closest('.contact-form-section');
    
    if (formSection) {
        formSection.innerHTML = `
            <div style="text-align: center; padding: 60px 40px;">
                <svg width="64" height="64" fill="#9ca3af" viewBox="0 0 16 16" style="margin-bottom: 20px;">
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>
                <h2 style="font-size: 24px; font-weight: 600; color: #000; margin-bottom: 16px;">
                    Accesso Richiesto
                </h2>
                <p style="font-size: 16px; color: #6b7280; margin-bottom: 32px; line-height: 1.6;">
                    Per inviarci un messaggio, devi prima accedere o creare un account.
                    Questo ci aiuta a risponderti in modo più efficace e a gestire meglio le tue richieste.
                </p>
                <a href="auth.html" style="display: inline-block; padding: 14px 32px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                    Accedi / Registrati
                </a>
            </div>
        `;
    }
}

function showAlert(message, type) {
    const formAlert = document.getElementById('formAlert');
    if (!formAlert) {
        console.warn('Elemento formAlert non trovato');
        return;
    }
    
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
    
    formAlert.innerHTML = `
        <div class="alert ${alertClass} show">
            ${message}
        </div>
    `;
    
    console.log('Alert mostrato:', type, message);
    
    // Auto-hide dopo 5 secondi (solo per errori)
    if (type === 'error') {
        setTimeout(() => {
            formAlert.innerHTML = '';
        }, 5000);
    }
}

// FAQ Accordion
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (!faqItems.length) {
        console.log('FAQ non trovate in questa pagina');
        return;
    }
    
    console.log('FAQ trovate:', faqItems.length);
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', () => {
                // Chiudi tutti gli altri
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle corrente
                item.classList.toggle('active');
            });
        }
    });
}