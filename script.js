/* =========================================
   LÓGICA WIDGET PAGOS (RECENT PAYMENTS)
   ========================================= */

// 1. Datos simulados (17 Usuarios)
const recentPaymentsData = [
    { user: "xX_Kiler_Xx", script: "DP-TextUI", price: "5€", avatar: "Felix" },
    { user: "RoleplayKing", script: "DP-Nitrous", price: "10€", avatar: "Aneka" },
    { user: "Sarah_Dev", script: "DP-Hud", price: "15€", avatar: "Jocelyn" },
    { user: "Don_Gato", script: "DP-Garages", price: "20€", avatar: "Leo" },
    { user: "FiveM_Master", script: "DP-LoadingScreen", price: "12€", avatar: "Jack" },
    { user: "PoliceChief", script: "DP-Menu-DP-Input", price: "18€", avatar: "Avery" },
    { user: "Medic_Girl", script: "DP-PetsShop", price: "25€", avatar: "Maria" },
    // --- Ocultos inicialmente ---
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

// 2. Función para renderizar la lista
function renderPayments(showAll = false) {
    const listContainer = document.getElementById('payments-list-content');
    const viewBtn = document.getElementById('view-all-payments');

    if (!listContainer) return;

    // A. OBTENER IDIOMA ACTUAL PARA TRADUCIR "COMPRÓ"
    const currentLang = localStorage.getItem('dp_store_lang') || 'es';
    let boughtText = 'Compró'; // Fallback por defecto

    // Si existen las traducciones, cogemos la palabra correcta (ej: "Bought", "Kaufte", etc.)
    if (typeof translations !== 'undefined' && translations[currentLang] && translations[currentLang]['txt_bought']) {
        boughtText = translations[currentLang]['txt_bought'];
    }

    // Limpiamos la lista actual
    listContainer.innerHTML = '';

    // Decidimos cuántos mostrar (7 o todos)
    const limit = showAll ? recentPaymentsData.length : 4;
    const dataToShow = recentPaymentsData.slice(0, limit);

    dataToShow.forEach(item => {
        // B. USAR LA VARIABLE 'boughtText' EN EL HTML
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

    // Actualizamos el botón
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

// Inicializar widget de pagos al cargar
document.addEventListener('DOMContentLoaded', () => {
    renderPayments(false);
});

// ABRIR / CERRAR MENÚ (INTERRUPTOR)
function toggleLangDropdown() {
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// CERRAR AL HACER CLICK FUERA
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('lang-dropdown');
    const trigger = document.querySelector('.lang-selector');

    // Si el click NO fue en el dropdown NI en el botón de abrir
    if (dropdown && trigger && !dropdown.contains(e.target) && !trigger.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

// --- SISTEMA DE TRADUCCIÓN ---

// 1. Variable global para almacenar las traducciones
let translations = {};

// 2. Función para cargar el JSON externo (NUEVA FUNCIÓN)
async function loadTranslationsData() {
    try {
        // Hacemos la petición al archivo .json
        const response = await fetch('./locales.json');

        // Verificamos si la carga fue correcta
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Convertimos la respuesta a objeto JS y la guardamos en la variable global
        translations = await response.json();

        // Una vez cargados los datos, aplicamos el idioma guardado
        const savedLang = localStorage.getItem('dp_store_lang') || 'es';
        changeLanguage(savedLang);

    } catch (e) {
        console.error("Error al cargar translations.json:", e);
        // Fallback: Si falla la carga, podríamos forzar un texto por defecto aquí
    }
}

// 3. Función Principal para cambiar idioma (MODIFICADA LEVEMENTE)
function changeLanguage(lang) {
    if (typeof translations === 'undefined' || !translations[lang]) lang = 'es';

    localStorage.setItem('dp_store_lang', lang);

    const langText = document.getElementById('current-lang-text');
    if (langText) langText.textContent = lang.toUpperCase();

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.innerHTML = translations[lang][key];
        }
    });

    // --- NUEVO: MARCAR EL IDIOMA SELECCIONADO EN LA LISTA ---

    // 1. Quitar la clase 'active-lang' de todos
    const allLangs = document.querySelectorAll('#lang-dropdown li');
    allLangs.forEach(li => li.classList.remove('active-lang'));

    // 2. Añadir la clase al seleccionado usando el atributo data-lang
    const activeItem = document.querySelector(`#lang-dropdown li[data-lang="${lang}"]`);
    if (activeItem) {
        activeItem.classList.add('active-lang');
    }

    // -------------------------------------------------------

    // 1. CERRAR EL DROPDOWN AL ELEGIR
    const dropdown = document.getElementById('lang-dropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }

    // 2. RE-RENDERIZAR LISTA DE PAGOS
    renderPayments(false);
}

// 4. Inicialización al cargar la página (REEMPLAZA TU DOMContentLoaded ANTERIOR)
document.addEventListener('DOMContentLoaded', () => {
    // Iniciamos la carga asíncrona de las traducciones
    loadTranslationsData();
});

// --- LÓGICA DE LOGIN (SIMULACIÓN) ---

// 1. Abrir Modal de Login
// Busca donde tienes el evento del botón login o créalo
const loginBtn = document.querySelector('.login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Si ya estamos logueados, hacemos logout (opcional) o nada
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

// 2. Simular proceso de Login
function simulateLogin(provider) {
    const modalBody = document.querySelector('.modal-body');
    const originalContent = modalBody.innerHTML;

    // A. Efecto de carga
    modalBody.innerHTML = `<div style="padding:40px; color:white;"><i class="fas fa-circle-notch fa-spin fa-2x" style="color:var(--accent-primary)"></i><p style="margin-top:15px">Conectando con ${provider}...</p></div>`;

    // B. Esperar 1.5 segundos y "Loguear"
    setTimeout(() => {
        // Guardar estado en navegador
        const userData = {
            name: 'PROXIMAMENTE', // Tu nombre simulado
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PROXIMAMENTE', // Tu avatar simulado
            provider: provider
        };
        localStorage.setItem('dp_user_logged', 'true');
        localStorage.setItem('dp_user_data', JSON.stringify(userData));

        // Cerrar modal y actualizar UI
        closeLoginModal();
        // Restaurar contenido modal por si se abre luego
        setTimeout(() => modalBody.innerHTML = originalContent, 500);

        checkLoginState(); // Actualizar la barra de navegación
    }, 1500);
}

// 3. Comprobar estado al cargar la página
function checkLoginState() {
    const isLogged = localStorage.getItem('dp_user_logged');
    const loginContainer = document.querySelector('.nav-right .login-btn'); // El botón original

    if (isLogged === 'true' && loginContainer) {
        const userData = JSON.parse(localStorage.getItem('dp_user_data'));

        // Reemplazar botón LOGIN por PERFIL
        // Ojo: Cambiamos el outerHTML o el contenido
        loginContainer.outerHTML = `
            <div class="user-profile-nav" onclick="logoutUser()">
                <img src="${userData.avatar}" class="nav-avatar">
                <span class="nav-username">${userData.name}</span>
                <i class="fas fa-sign-out-alt" style="font-size:0.7rem; color:#ff4757; margin-left:5px;"></i>
            </div>
        `;
    }
}

// 4. Logout
function logoutUser() {
    if (confirm("¿Cerrar sesión?")) {
        localStorage.removeItem('dp_user_logged');
        localStorage.removeItem('dp_user_data');
        location.reload(); // Recargar para volver al estado original
    }
}

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    checkLoginState();
});