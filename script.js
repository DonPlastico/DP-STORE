/* ==========================================================================
   1. DATOS Y CONFIGURACIÓN GLOBAL
   Aquí definimos los datos simulados y las tasas de cambio.
   ========================================================================== */

// Datos simulados para el Widget de "Últimas Compras"
const recentPaymentsData = [
    { user: "xX_Kiler_Xx", script: "DP-TextUI", price: "5€", avatar: "Felix" },
    { user: "RoleplayKing", script: "DP-Nitrous", price: "10€", avatar: "Aneka" },
    { user: "Sarah_Dev", script: "DP-Hud", price: "15€", avatar: "Jocelyn" },
    { user: "Don_Gato", script: "DP-Garages", price: "20€", avatar: "Leo" },
    { user: "FiveM_Master", script: "DP-LoadingScreen", price: "12€", avatar: "Jack" },
    { user: "PoliceChief", script: "DP-Menu-DP-Input", price: "18€", avatar: "Avery" },
    { user: "Medic_Girl", script: "DP-PetsShop", price: "25€", avatar: "Maria" },
    { user: "Gangster01", script: "DP-PedsSystem", price: "15€", avatar: "Brian" },
    { user: "Mechanic_Joe", script: "DP-Extras", price: "8€", avatar: "Christopher" },
    { user: "DJ_Mike", script: "DP-Boombox", price: "22€", avatar: "Caleb" },
    { user: "Banker_RP", script: "DP-Banking", price: "30€", avatar: "Sawyer" },
    { user: "Trucker_88", script: "DP-Fuel-V1", price: "10€", avatar: "Nala" },
    { user: "Fashion_Dva", script: "QB-Clothing-Redesign", price: "20€", avatar: "Valentina" },
    { user: "Admin_God", script: "DP-Notify", price: "Free", avatar: "Alexander" },
    { user: "Emote_Lover", script: "DP-Animations", price: "12€", avatar: "Willow" },
    { user: "Hacker_Neo", script: "DP-AntiBackdoor", price: "50€", avatar: "Ryker" },
    { user: "Newbie_Player", script: "Pack Inicio", price: "45€", avatar: "Easton" }
];

// Tasas de cambio aproximadas (Base: 1 EUR)
// Si quieres actualizar precios reales, modifica estos números.
const exchangeRates = {
    EUR: 1.00,
    GBP: 0.86,  // Libra Esterlina
    USD: 1.08,  // Dólar Americano
    PLN: 4.32,  // Zloty Polaco
    RUB: 98.50, // Rublo Ruso
    SEK: 11.20, // Corona Sueca
    DKK: 7.46,  // Corona Danesa
    CZK: 25.30, // Corona Checa
    HUF: 395.00,// Forinto Húngaro
    TRY: 34.50, // Lira Turca
    JPY: 163.00,// Yen Japonés
    KRW: 1450.00 // Won Coreano
};

// Mapa que asocia cada código de idioma con su moneda oficial
const currencyMap = {
    'es': 'EUR', 'fr': 'EUR', 'de': 'EUR', 'it': 'EUR', 'pt': 'EUR',
    'nl': 'EUR', 'fi': 'EUR', 'en': 'GBP', 'pl': 'PLN', 'ru': 'RUB',
    'sv': 'SEK', 'da': 'DKK', 'cs': 'CZK', 'hu': 'HUF', 'tr': 'TRY',
    'ja': 'JPY', 'ko': 'KRW'
};

// Variables de estado global
let translations = {}; // Aquí se cargarán los textos del locales.json
let cart = JSON.parse(localStorage.getItem('dp_cart')) || []; // Cargar carrito guardado o iniciar vacío

/* ==========================================================================
   2. SISTEMA DE TRADUCCIÓN Y MONEDA
   Carga textos, cambia el idioma y recalcula precios.
   ========================================================================== */

/**
 * Carga el archivo JSON de traducciones.
 * Se ejecuta al iniciar la página.
 */
async function loadTranslationsData() {
    try {
        const response = await fetch('./locales.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        translations = await response.json();

        // Una vez cargado, aplicamos el idioma guardado (o 'es' por defecto)
        const savedLang = localStorage.getItem('dp_store_lang') || 'es';
        changeLanguage(savedLang);

    } catch (e) {
        console.error("Error al cargar locales.json:", e);
    }
}

/**
 * Función Principal: Cambia todo el sitio al idioma seleccionado.
 * @param {string} lang - Código del idioma (ej: 'es', 'en')
 */
function changeLanguage(lang) {
    // Si el idioma no existe en nuestro JSON, forzamos español
    if (typeof translations === 'undefined' || !translations[lang]) lang = 'es';

    localStorage.setItem('dp_store_lang', lang);

    // 1. Actualizar texto del botón de idioma (Navbar)
    const langText = document.getElementById('current-lang-text');
    if (langText) langText.textContent = lang.toUpperCase();

    // 2. Traducir todos los elementos con atributo 'data-i18n'
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });

    // 3. Marcar el idioma activo en la lista desplegable (estilo visual)
    const allLangs = document.querySelectorAll('#lang-dropdown li');
    allLangs.forEach(li => li.classList.remove('active-lang'));
    const activeItem = document.querySelector(`#lang-dropdown li[data-lang="${lang}"]`);
    if (activeItem) activeItem.classList.add('active-lang');

    // 4. Actualizar Precios en la tienda y Recalcular el Carrito
    updatePrices(lang);
    updateCartUI();

    // 5. Actualizar el sufijo del país en el Footer
    const footerLang = document.getElementById('footer-lang-code');
    if (footerLang) footerLang.textContent = lang.toUpperCase() + ".";

    // 6. Cerrar menú desplegable y refrescar widget de pagos
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown) dropdown.classList.remove('active');

    renderPayments(false);
}

/**
 * Recalcula los precios mostrados en el grid de productos.
 * Usa 'Intl.NumberFormat' para poner el símbolo de moneda correcto (£, €, ¥).
 */
function updatePrices(lang) {
    const currency = currencyMap[lang] || 'EUR';
    const rate = exchangeRates[currency] || 1;

    const priceElements = document.querySelectorAll('.price');

    priceElements.forEach(el => {
        // Obtenemos el precio base en EUR desde el HTML
        const basePrice = parseFloat(el.getAttribute('data-base-price'));

        if (!isNaN(basePrice)) {
            const newPrice = basePrice * rate;
            el.textContent = new Intl.NumberFormat(lang, {
                style: 'currency',
                currency: currency
            }).format(newPrice);
        }
    });
}

// Alternar visualización del menú de idiomas
function toggleLangDropdown() {
    const dropdown = document.getElementById('lang-dropdown');
    const cartDropdown = document.getElementById('cart-dropdown');

    if (cartDropdown) cartDropdown.classList.remove('active'); // Cerrar carrito si está abierto
    if (dropdown) dropdown.classList.toggle('active');
}

/* ==========================================================================
   3. SISTEMA DE CARRITO DE COMPRAS (SHOPPING CART)
   Lógica para añadir, borrar y guardar productos en el navegador.
   ========================================================================== */

// Alternar visualización del panel del carrito
function toggleCartDropdown() {
    const dropdown = document.getElementById('cart-dropdown');
    const langDropdown = document.getElementById('lang-dropdown');

    if (langDropdown) langDropdown.classList.remove('active'); // Cerrar idioma si está abierto
    if (dropdown) dropdown.classList.toggle('active');
}

/**
 * Añade un producto al carrito.
 * Se llama desde el HTML con: onclick="addToCart(this)"
 */
function addToCart(btn) {
    const product = {
        id: btn.getAttribute('data-id'),
        name: btn.getAttribute('data-name'),
        price: parseFloat(btn.getAttribute('data-base-price')), // Guardamos precio base en EUR
        img: btn.getAttribute('data-img'),
        descKey: btn.getAttribute('data-desc') // Guardamos la CLAVE de traducción, no el texto
    };

    cart.push(product); // Añadir al array
    saveCart();         // Guardar en LocalStorage
    updateCartUI();     // Refrescar visualmente

    // Feedback visual en el botón (cambia a verde 1 segundo)
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.style.background = '#2ecc71';
    btn.style.color = '#fff';

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        btn.style.color = '';
    }, 1000);

    // Abrir automáticamente el carrito para que el usuario lo vea
    const dropdown = document.getElementById('cart-dropdown');
    if (dropdown) dropdown.classList.add('active');
}

// Eliminar un producto del carrito por su índice
function removeFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartUI();
}

// Guardar el estado actual del carrito en la memoria del navegador
function saveCart() {
    localStorage.setItem('dp_cart', JSON.stringify(cart));
}

/**
 * Renderiza el HTML del carrito (Lista de items, total y contador).
 * Esta función es clave porque maneja la traducción dinámica de los items guardados.
 */
function updateCartUI() {
    // 1. Actualizar el contador (número al lado del icono)
    const countElement = document.getElementById('cart-count');
    if (countElement) countElement.textContent = `(${cart.length})`;

    // 2. Renderizar lista de productos
    const container = document.getElementById('cart-items-container');
    const totalElement = document.getElementById('cart-total-price');

    if (!container) return;

    container.innerHTML = '';
    let totalPriceEUR = 0;

    // Obtener configuración actual
    const currentLang = localStorage.getItem('dp_store_lang') || 'es';
    const targetCurrency = currencyMap[currentLang] || 'EUR';
    const rate = exchangeRates[targetCurrency] || 1;

    if (cart.length === 0) {
        // Mensaje de carrito vacío (Traducido)
        let emptyText = "Tu carrito está vacío.";
        if (translations[currentLang] && translations[currentLang]['cart_empty']) {
            emptyText = translations[currentLang]['cart_empty'];
        }
        container.innerHTML = `<div class="empty-cart-msg">${emptyText}</div>`;

    } else {
        // Recorrer productos y generar HTML
        cart.forEach((item, index) => {
            totalPriceEUR += item.price;

            // --- LÓGICA DE TRADUCCIÓN DE DESCRIPCIONES ---
            // Forzamos la búsqueda en minúsculas para evitar errores (ej: desc_Animations vs desc_animations)
            let desc = item.descKey;
            let lookupKey = item.descKey ? item.descKey.toLowerCase() : '';

            if (translations[currentLang] && translations[currentLang][lookupKey]) {
                desc = translations[currentLang][lookupKey];
            }
            // ---------------------------------------------

            // Formatear precio
            const displayPrice = new Intl.NumberFormat(currentLang, {
                style: 'currency', currency: targetCurrency
            }).format(item.price * rate);

            const html = `
                <div class="cart-item">
                    <img src="${item.img}" class="cart-item-img" alt="${item.name}">
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.name}</div>
                        <div class="cart-item-desc">${desc}</div>
                        <div class="cart-item-price">${displayPrice}</div>
                    </div>
                    <button class="remove-item-btn" onclick="removeFromCart(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.innerHTML += html;
        });
    }

    // 3. Actualizar Precio Total Global
    if (totalElement) {
        const displayTotal = new Intl.NumberFormat(currentLang, {
            style: 'currency', currency: targetCurrency
        }).format(totalPriceEUR * rate);
        totalElement.textContent = displayTotal;
    }
}

/* ==========================================================================
   4. WIDGET DE PAGOS RECIENTES
   Renderiza la lista de últimas compras en el Hero.
   ========================================================================== */

function renderPayments(showAll = false) {
    const listContainer = document.getElementById('payments-list-content');
    const viewBtn = document.getElementById('view-all-payments');

    if (!listContainer) return;

    const currentLang = localStorage.getItem('dp_store_lang') || 'es';
    let boughtText = 'Compró';

    // Traducir la palabra "Compró"
    if (translations[currentLang] && translations[currentLang]['txt_bought']) {
        boughtText = translations[currentLang]['txt_bought'];
    }

    listContainer.innerHTML = '';

    // Mostrar 4 items por defecto, o todos si se pide
    const limit = showAll ? recentPaymentsData.length : 4;
    const dataToShow = recentPaymentsData.slice(0, limit);

    dataToShow.forEach(item => {
        const html = `
            <div class="payment-item fade-in">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatar}" class="avatar" alt="User">
                <div class="pay-info">
                    <span class="pay-user">${item.user}</span>
                    <span class="pay-detail">${boughtText} <strong>${item.script}</strong></span>
                </div>
                <span class="pay-price">${item.price}</span>
            </div>
        `;
        listContainer.innerHTML += html;
    });

    // Controlar botón "Ver Todos"
    if (viewBtn) {
        if (showAll) {
            viewBtn.innerHTML = 'VER MENOS <i class="fas fa-chevron-up"></i>';
            viewBtn.onclick = () => renderPayments(false);
            listContainer.classList.add('scrollable');
        } else {
            viewBtn.innerHTML = `VER TODOS (${recentPaymentsData.length}) <i class="fas fa-chevron-down"></i>`;
            viewBtn.onclick = () => renderPayments(true);
            listContainer.classList.remove('scrollable');
        }
    }
}

/* ==========================================================================
   5. SISTEMA DE LOGIN Y EVENTOS GLOBALES
   Manejo de clics, modales y sesión de usuario simulada.
   ========================================================================== */

// Evento Global: Cerrar menús al hacer click fuera de ellos
document.addEventListener('click', (e) => {
    // 1. Dropdown Idioma
    const langDropdown = document.getElementById('lang-dropdown');
    const langTrigger = document.querySelector('.lang-selector');
    if (langDropdown && langTrigger && !langDropdown.contains(e.target) && !langTrigger.contains(e.target)) {
        langDropdown.classList.remove('active');
    }

    // 2. Dropdown Carrito
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartTrigger = document.querySelector('.cart-selector');

    // Ignoramos si el click fue en botones de eliminar o añadir (para no cerrar el carrito al usarlo)
    if (cartDropdown && cartTrigger &&
        !cartDropdown.contains(e.target) &&
        !cartTrigger.contains(e.target) &&
        !e.target.closest('.remove-item-btn') &&
        !e.target.closest('.add-cart-btn')) {

        cartDropdown.classList.remove('active');
    }
});

// Botón de Login (Abrir Modal)
const loginBtn = document.querySelector('.login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Si ya está logueado, cerrar sesión. Si no, abrir modal.
        if (localStorage.getItem('dp_user_logged') === 'true') {
            logoutUser();
        } else {
            document.getElementById('login-modal').classList.add('active');
        }
    });
}

function closeLoginModal() {
    document.getElementById('login-modal').classList.remove('active');
}

// Simular proceso de login (Delay artificial)
function simulateLogin(provider) {
    const modalBody = document.querySelector('.modal-body');
    const originalContent = modalBody.innerHTML;

    // Mostrar spinner de carga
    modalBody.innerHTML = `<div style="padding:40px; color:white;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--accent-primary)"></i><p style="margin-top:15px">Conectando con ${provider}...</p></div>`;

    setTimeout(() => {
        // Datos de usuario simulados
        const userData = {
            name: 'DonPlastico',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DonPlastico',
            provider: provider
        };

        // Guardar sesión
        localStorage.setItem('dp_user_logged', 'true');
        localStorage.setItem('dp_user_data', JSON.stringify(userData));

        closeLoginModal();

        // Restaurar modal por si se abre de nuevo
        setTimeout(() => modalBody.innerHTML = originalContent, 500);

        // Actualizar interfaz
        checkLoginState();
    }, 1500);
}

// Verificar si hay usuario logueado al cargar
function checkLoginState() {
    const isLogged = localStorage.getItem('dp_user_logged');
    const loginContainer = document.querySelector('.nav-right .login-btn');

    if (isLogged === 'true' && loginContainer) {
        const userData = JSON.parse(localStorage.getItem('dp_user_data'));

        // Reemplazar botón de "Acceder" por perfil de usuario
        loginContainer.outerHTML = `
            <div class="user-profile-nav" onclick="logoutUser()">
                <img src="${userData.avatar}" class="nav-avatar">
                <span class="nav-username">${userData.name}</span>
                <i class="fas fa-sign-out-alt" style="font-size:0.7rem; color:#ff4757; margin-left:5px;"></i>
            </div>
        `;
    }
}

// Cerrar sesión
function logoutUser() {
    if (confirm("¿Cerrar sesión?")) {
        localStorage.removeItem('dp_user_logged');
        localStorage.removeItem('dp_user_data');
        location.reload(); // Recargar para limpiar estado
    }
}

/* ==========================================================================
   6. INICIALIZACIÓN (MAIN)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    loadTranslationsData(); // Cargar textos y aplicar idioma guardado
    checkLoginState();      // Verificar si el usuario ya hizo login
    updateCartUI();         // Renderizar el carrito guardado
});