/**
 * Smart Health - Layout Injector, Theme Controller, Access Guard, & Toast System
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Determine relative path prefix from body attribute
    const bodyEl = document.body;
    const pathPrefix = bodyEl.getAttribute('data-path-prefix') || './';
    
    // 2. Perform authorization check before rendering layout
    const restrictedRolesAttr = bodyEl.getAttribute('data-restricted-roles');
    const currentUser = window.db ? window.db.getCurrentUser() : null;

    if (restrictedRolesAttr) {
        const allowedRoles = restrictedRolesAttr.split(',').map(r => r.trim());
        if (!currentUser) {
            // Set flash message for login page
            setFlashMessage('Access denied. Please log in first.', 'error');
            window.location.href = `${pathPrefix}pages/auth/login.html`;
            return;
        } else if (!allowedRoles.includes(currentUser.role)) {
            // Redirect to appropriate dashboard or home
            setFlashMessage('You are not authorized to view this page.', 'error');
            let dest = 'index.html';
            if (currentUser.role === 'admin') dest = 'pages/dashboard/admin.html';
            else if (currentUser.role === 'doctor') dest = 'pages/dashboard/doctor.html';
            else if (currentUser.role === 'pharmacist') dest = 'pages/dashboard/pharmacist.html';
            else if (currentUser.role === 'patient') dest = 'pages/dashboard/patient.html';
            
            window.location.href = `${pathPrefix}${dest}`;
            return;
        }
    }

    // 3. Inject Site Header and Navigation
    injectHeader(pathPrefix, currentUser);

    // 4. Inject Site Footer
    injectFooter(pathPrefix);

    // 5. Initialize Theme (Light / Dark Mode)
    initTheme();

    // 6. Bind Event Listeners (Hamburger menu, Logout buttons, Dynamic Elements)
    bindEvents(pathPrefix);

    // 7. Check for Flash Toast Messages
    showFlashMessage();

    // 8. Remove Page Loader Spinner
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.classList.add('fade-out');
        setTimeout(() => loader.style.display = 'none', 400);
    }
});

/**
 * Injects the header dynamically into the top of the body
 */
function injectHeader(pathPrefix, currentUser) {
    const headerEl = document.createElement('header');
    headerEl.className = 'site-header';
    
    // Active link detection
    const currentPath = window.location.pathname;
    const isLinkActive = (filename) => currentPath.endsWith(filename) ? 'active' : '';
    const isDashboardActive = () => currentPath.includes('/dashboard/') ? 'active' : '';

    let navAuthContent = '';
    if (currentUser) {
        // Notification bell with unread count
        const unreadCount = window.db ? window.db.getUnreadNotificationsCount(currentUser.id) : 0;
        let dashboardPath = 'pages/dashboard/patient.html';
        if (currentUser.role === 'admin') dashboardPath = 'pages/dashboard/admin.html';
        else if (currentUser.role === 'doctor') dashboardPath = 'pages/dashboard/doctor.html';
        else if (currentUser.role === 'pharmacist') dashboardPath = 'pages/dashboard/pharmacist.html';

        const avatarMarkup = currentUser.profile_photo 
            ? `<img src="${pathPrefix}${currentUser.profile_photo}" alt="Avatar" class="nav-avatar-img" />`
            : `<div class="nav-avatar-placeholder">${currentUser.name.charAt(0).toUpperCase()}</div>`;

        navAuthContent = `
            <a href="${pathPrefix}pages/notifications.html" class="nav-notif-bell ${isLinkActive('notifications.html')}" title="Notifications">
                🔔 <span class="notif-count">${unreadCount}</span>
            </a>
            <a href="${pathPrefix}${dashboardPath}" class="btn-dashboard-nav ${isDashboardActive()}">Dashboard</a>
            <div class="user-menu-wrapper">
                <a href="${pathPrefix}pages/profile.html" class="nav-avatar-link" title="My Profile">
                    ${avatarMarkup}
                    <span class="nav-username">${currentUser.name.split(' ')[0]}</span>
                </a>
            </div>
            <button class="btn btn-secondary btn-nav-logout" id="logout-btn">Logout</button>
        `;
    } else {
        navAuthContent = `
            <a href="${pathPrefix}pages/auth/login.html" class="btn btn-secondary">Login</a>
            <a href="${pathPrefix}pages/auth/register.html" class="btn btn-primary">Register</a>
        `;
    }

    headerEl.innerHTML = `
        <div class="container nav-row">
            <a href="${pathPrefix}index.html" class="brand">
                <span class="brand-icon">🏥</span>
                <span>Smart Health</span>
            </a>
            
            <div class="nav-controls">
                <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle theme" type="button">
                    <span class="sun-icon">☀️</span>
                    <span class="moon-icon">🌙</span>
                </button>
                <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false" id="menu-toggle">
                    <span></span><span></span><span></span>
                </button>
            </div>
            
            <nav class="site-nav" id="site-nav">
                <a href="${pathPrefix}index.html" class="${isLinkActive('index.html') || currentPath.endsWith('/') ? 'active' : ''}">Home</a>
                <a href="${pathPrefix}pages/about.html" class="${isLinkActive('about.html')}">About</a>
                <a href="${pathPrefix}pages/services.html" class="${isLinkActive('services.html')}">Services</a>
                
                <a href="${pathPrefix}pages/medicine-stock.html" class="${isLinkActive('medicine-stock.html')}">Medicine Stock</a>
                <a href="${pathPrefix}pages/patient-flow.html" class="${isLinkActive('patient-flow.html')}">Patient Flow</a>
                <a href="${pathPrefix}pages/bed-availability.html" class="${isLinkActive('bed-availability.html')}">Bed Availability</a>
                <a href="${pathPrefix}pages/doctor-attendance.html" class="${isLinkActive('doctor-attendance.html')}">Doctor Attendance</a>
                <a href="${pathPrefix}pages/contact.html" class="${isLinkActive('contact.html')}">Contact</a>

                <div class="nav-auth-separator"></div>
                ${navAuthContent}
            </nav>
        </div>
    `;

    // Append at the beginning of body
    document.body.insertBefore(headerEl, document.body.firstChild);

    // Create Page Loader spinner if missing
    if (!document.getElementById('page-loader')) {
        const loaderEl = document.createElement('div');
        loaderEl.id = 'page-loader';
        loaderEl.className = 'page-loader';
        loaderEl.innerHTML = '<div class="loader-spinner"></div>';
        document.body.insertBefore(loaderEl, headerEl);
    }
}

/**
 * Injects the footer dynamically at the bottom of the body
 */
function injectFooter(pathPrefix) {
    const footerEl = document.createElement('footer');
    footerEl.className = 'site-footer';
    footerEl.innerHTML = `
        <div class="container footer-content-grid">
            <div class="footer-brand-info">
                <h3>🏥 Smart Health</h3>
                <p>Digital intelligence system built to empower clinics, clinicians, patients, and pharmacists for seamless healthcare delivery.</p>
            </div>
            <div class="footer-links-group">
                <h4>Information</h4>
                <a href="${pathPrefix}pages/about.html">About Us</a>
                <a href="${pathPrefix}pages/services.html">Core Services</a>
                <a href="${pathPrefix}pages/contact.html#faq">Help & FAQ</a>
            </div>
            <div class="footer-links-group">
                <h4>Get Involved</h4>
                <a href="${pathPrefix}pages/contact.html">Help Desk & Contact</a>
                <a href="${pathPrefix}pages/feedback.html">Patient Feedback</a>
            </div>
        </div>
        <div class="container footer-bottom-row">
            <p>&copy; <span id="year">${new Date().getFullYear()}</span> Smart Health. All rights reserved. Secure clinical operations.</p>
            <div class="footer-meta-stamps">
                <span>🔒 SSL SECURE</span>
                <span>⚡ REAL-TIME AI</span>
            </div>
        </div>
    `;

    // Toast Container (if not present)
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    document.body.appendChild(footerEl);
}

/**
 * Handles Dark/Light theme toggle initialization
 */
function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const activeTheme = localStorage.getItem('sh_theme') || 'light';
    
    if (activeTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('sh_theme', isDark ? 'dark' : 'light');
        });
    }
}

/**
 * Binds DOM event listeners like Mobile Hamburger Menu and Logout click
 */
function bindEvents(pathPrefix) {
    // Mobile Hamburger Menu
    const menuToggle = document.getElementById('menu-toggle');
    const siteNav = document.getElementById('site-nav');

    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', () => {
            const expanded = menuToggle.getAttribute('aria-expanded') === 'true' || false;
            menuToggle.setAttribute('aria-expanded', !expanded);
            siteNav.classList.toggle('open');
        });
    }

    // Logout Action
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.db) {
                window.db.logout();
                setFlashMessage('You have logged out successfully.', 'success');
                window.location.href = `${pathPrefix}index.html`;
            }
        });
    }
}

/**
 * Toast System global methods
 */
window.showToast = function(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto-remove toast after 4 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

/**
 * Set a message to be displayed as a Toast on the next page load
 */
window.setFlashMessage = function(message, type = 'info') {
    localStorage.setItem('sh_flash_msg', JSON.stringify({ message, type }));
};

/**
 * Checks for a saved Toast message and displays it
 */
function showFlashMessage() {
    const flash = localStorage.getItem('sh_flash_msg');
    if (flash) {
        try {
            const { message, type } = JSON.parse(flash);
            window.showToast(message, type);
        } catch (e) {
            console.error('Failed to parse flash message');
        }
        localStorage.removeItem('sh_flash_msg');
    }
}
