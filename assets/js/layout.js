const ROLE_NAV_CONFIG = {
    guest: ['home', 'about', 'services', 'patient_flow', 'bed_availability', 'contact'],
    patient: ['home', 'about', 'services', 'patient_flow', 'bed_availability', 'doctor_availability', 'contact'],
    doctor: ['home', 'about', 'services', 'doctor_attendance', 'contact'],
    pharmacist: ['home', 'about', 'services', 'medicine_stock', 'bed_availability', 'doctor_availability', 'contact'],
    admin: ['home', 'about', 'services', 'profile', 'medicine_stock', 'patient_flow', 'bed_availability', 'doctor_availability', 'doctor_attendance', 'contact']
};

const ROLE_DASHBOARDS = {
    admin: 'pages/dashboard/admin.html',
    doctor: 'pages/dashboard/doctor.html',
    pharmacist: 'pages/dashboard/pharmacist.html',
    patient: 'pages/dashboard/patient.html',
    guest: 'index.html'
};

const NAV_ITEMS = [
    { id: 'home', label: 'Home', path: 'index.html', activePattern: 'index.html' },
    { id: 'about', label: 'About', path: 'pages/about.html', activePattern: 'about.html' },
    { id: 'services', label: 'Services', path: 'pages/services.html', activePattern: 'services.html' },
    { id: 'profile', label: 'Profile', path: 'pages/profile.html', activePattern: 'profile.html' },
    { id: 'medicine_stock', label: 'Medicine Stock', path: 'pages/medicine-stock.html', activePattern: 'medicine-stock.html' },
    { id: 'patient_flow', label: 'Patient Flow', path: 'pages/patient-flow.html', activePattern: 'patient-flow.html' },
    { id: 'bed_availability', label: 'Bed Availability', path: 'pages/bed-availability.html', activePattern: 'bed-availability.html' },
    { id: 'doctor_availability', label: 'Doctor Availability', path: 'pages/doctor-availability.html', activePattern: 'doctor-availability.html' },
    { id: 'doctor_attendance', label: 'Doctor Attendance', path: 'pages/doctor-attendance.html', activePattern: 'doctor-attendance.html' },
    { id: 'contact', label: 'Contact', path: 'pages/contact.html', activePattern: 'contact.html' }
];

window.ROLE_DASHBOARDS = ROLE_DASHBOARDS;
window.ROLE_NAV_CONFIG = ROLE_NAV_CONFIG;
window.NAV_ITEMS = NAV_ITEMS;

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
            const dest = ROLE_DASHBOARDS[currentUser.role] || ROLE_DASHBOARDS['guest'];
            window.location.href = `${pathPrefix}${dest}`;
            return;
        }
    }

    // 3. Inject Site Header and Navigation
    injectHeader(pathPrefix, currentUser);

    // 4. Inject Site Footer
    injectFooter(pathPrefix);

    // Start real-time Firestore database sync for user roles/profiles
    if (currentUser) {
        setupRealtimeRoleSync(pathPrefix, currentUser);
    }

    // 4.5 Initialize Accessibility Systems for Indian Elderly
    initAccessibilitySystem();

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
        const dashboardPath = ROLE_DASHBOARDS[currentUser.role] || 'pages/dashboard/patient.html';

        const isBase64 = currentUser.profile_photo && currentUser.profile_photo.startsWith('data:');
        const avatarSrc = isBase64 ? currentUser.profile_photo : `${pathPrefix}${currentUser.profile_photo}`;

        const avatarMarkup = currentUser.profile_photo
            ? `<img src="${avatarSrc}" alt="Avatar" class="nav-avatar-img" />`
            : `<div class="nav-avatar-placeholder">${currentUser.name.charAt(0).toUpperCase()}</div>`;

        const dashboardMarkup = `<a href="${pathPrefix}${dashboardPath}" class="btn-dashboard-nav ${isDashboardActive()}">Dashboard</a>`;

        const profileMarkup = `<a href="${pathPrefix}pages/profile.html" class="nav-avatar-link" title="My Profile">
            ${avatarMarkup}
            <span class="nav-username">${currentUser.name.split(' ')[0]}</span>
        </a>`;

        navAuthContent = `
            <a href="${pathPrefix}pages/notifications.html" class="nav-notif-bell ${isLinkActive('notifications.html')}" title="Notifications">
                🔔 <span class="notif-count">${unreadCount}</span>
            </a>
            ${dashboardMarkup}
            <div class="user-menu-wrapper">
                ${profileMarkup}
            </div>
            <button class="btn btn-secondary btn-nav-logout" id="logout-btn">Logout</button>
        `;
    } else {
        navAuthContent = `
            <a href="${pathPrefix}pages/auth/login.html" class="btn btn-secondary">Login</a>
            <a href="${pathPrefix}pages/auth/register.html" class="btn btn-primary">Register</a>
        `;
    }

    const role = currentUser ? (currentUser.role || 'patient').trim().toLowerCase() : 'guest';
    const allowedItems = ROLE_NAV_CONFIG[role] || ROLE_NAV_CONFIG['guest'];

    let navLinks = '';
    NAV_ITEMS.forEach(item => {
        if (allowedItems.includes(item.id)) {
            const isActive = isLinkActive(item.activePattern) || (item.id === 'home' && currentPath.endsWith('/')) ? 'active' : '';
            navLinks += `<a href="${pathPrefix}${item.path}" class="${isActive}">${item.label}</a>\n`;
        }
    });

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
                ${navLinks}
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
                <a href="${pathPrefix}pages/gallery.html">Gallery Portfolio</a>
                <a href="${pathPrefix}pages/faq.html">Help & FAQ</a>
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
window.showToast = function (message, type = 'info') {
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
window.setFlashMessage = function (message, type = 'info') {
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

/* ==========================================================================
   ELDERLY ACCESSIBILITY AND ASSISTANCE MODULE (HINDI & SYSTEM OPTIONS)
   ========================================================================== */

// 1. Language Translation Dictionary
const translationDict = {
    // Navigation / Header / Footer
    "Smart Health": "स्मार्ट हेल्थ",
    "🏥 Smart Health": "🏥 स्मार्ट हेल्थ",
    "Home": "मुख्य पृष्ठ",
    "About": "हमारे बारे में",
    "Services": "सेवाएं",
    "Gallery": "गैलरी (फ़ोटो)",
    "FAQ": "मदद व सवाल",
    "Medicine Stock": "दवाइयों का स्टॉक",
    "Patient Flow": "मरीज़ों की कतार",
    "Bed Availability": "खाली बिस्तर की सूची",
    "Doctor Attendance": "डॉक्टरों की उपस्थिति",
    "Contact": "संपर्क करें",
    "Login": "लॉगिन करें",
    "Register": "पंजीकरण",
    "Logout": "लॉगआऊट",
    "Dashboard": "डैशबोर्ड",
    "My Profile": "मेरी प्रोफाइल",
    "Notifications": "सूचनाएं",
    "Patient Feedback": "मरीज़ों की राय",
    "Information": "जानकारी",
    "About Us": "हमारे बारे में जानें",
    "Core Services": "मुख्य सेवाएं",
    "Gallery Portfolio": "अस्पताल की तस्वीरें",
    "Help & FAQ": "सहायता एवं सवाल",
    "Get Involved": "हमसे जुड़ें",
    "Help Desk & Contact": "मदद डेस्क और संपर्क",
    "Secure clinical operations.": "सुरक्षित क्लिनिकल संचालन।",
    "All rights reserved.": "सर्वाधिकार सुरक्षित।",

    // Landing Page
    "🏥 PHC & CHC Command Hub": "🏥 प्राथमिक एवं सामुदायिक चिकित्सा केंद्र",
    "Real-time digital management for rural and urban healthcare nodes": "ग्रामीण और शहरी स्वास्थ्य केंद्रों के लिए वास्तविक समय डिजिटल प्रबंधन प्रणाली",
    "Smarter clinics. Faster care. Zero guesswork.": "बेहतर क्लिनिक। तुरंत इलाज। आसान संचालन।",
    "Smart Health integrates medicine stocks, patient footfalls, bed occupancy, doctor rosters, and real-time emergency notifications into one elegant digital command center.": "स्मार्ट हेल्थ दवाओं के स्टॉक, मरीज़ों की संख्या, खाली बिस्तरों, डॉक्टरों की उपस्थिति सूची और आपातकालीन अलर्ट को एक सरल डिजिटल कंट्रोल रूम में लाता है।",
    "Explore Live Inventory": "दवाइयों का लाइव स्टॉक देखें",
    "Care Wards": "देखभाल वार्ड",
    "Staff Doctors": "अस्पताल के डॉक्टर",
    "Registered Patients": "पंजीकृत मरीज़",
    "24/7 AI Alerts": "24/7 त्वरित अलर्ट",
    "Live Command Metrics": "लाइव क्लिनिक आंकड़े",
    "Needs Attention": "कम स्टॉक वाली दवाएं",
    "Available Beds": "खाली बिस्तर",
    "Doctor Roster Rate": "डॉक्टर उपस्थिति दर",
    "Sync Accuracy": "डेटा सटीकता",
    "* Automatically synchronizing with clinical records and active databases.": "* मेडिकल रिकॉर्ड और सक्रिय डेटाबेस के साथ स्वचालित रूप से सिंक किया गया।",
    "Operational Modules": "क्लिनिक मॉड्यूल",
    "Everything required to run a smarter clinic": "एक बेहतर क्लिनिक चलाने के लिए जरूरी मॉड्यूल",
    "Track stock levels, expiry alerts, and reorder needs instantly in real time.": "दवाइयों के स्टॉक स्तर, एक्सपायरी चेतावनी और पुनः ऑर्डर की आवश्यकता को तुरंत ट्रैक करें।",
    "View Live Data": "लाइव जानकारी देखें",
    "Understand rush hours, registrations, and specialist consultation demand.": "भीड़भाड़ के घंटे, मरीज़ों के पंजीकरण और विशेषज्ञ डॉक्टरों की मांग को समझें।",
    "Monitor ICU, general, pediatric, and emergency bed occupancy live.": "आईसीयू, सामान्य वार्ड, बच्चों के वार्ड और आपातकालीन बिस्तरों की स्थिति देखें।",
    "Stay on top of shift rosters, punctuality, and staff coverage.": "डॉक्टरों की शिफ्ट, समय की पाबंदी और स्टाफ की उपस्थिति पर नज़र रखें।",
    "Built for clinical roles": "क्लिनिक के कर्मचारियों के लिए",
    "One intelligent dashboard tailored to every worker": "अस्पताल के हर कर्मचारी के लिए उपयुक्त आसान डैशबोर्ड",
    "System Admin": "प्रणाली व्यवस्थापक",
    "Manage system configuration, add user profiles (CRUD), update CMS contents, and review security logs.": "प्रणाली विन्यास प्रबंधित करें, उपयोगकर्ता प्रोफ़ाइल जोड़ें, सामग्री अपडेट करें और लॉग देखें।",
    "Facility Doctor": "ड्यूटी डॉक्टर",
    "Check in/out daily attendance rosters, view waiting queue sizes, and write diagnosis notes.": "दैनिक उपस्थिति दर्ज करें, मरीज़ों की कतार का आकार देखें और नुस्खे लिखें।",
    "OPD Patient": "मरीज़ पोर्टल",
    "Search nearby facilities, check live bed capacity, submit emergency SOS requests, and edit profile photo.": "पास के अस्पतालों को खोजें, बिस्तरों की संख्या देखें, आपातकालीन मदद (SOS) भेजें और फ़ोटो बदलें।",
    "Pharmacist Staff": "दवाखाना कर्मचारी",
    "Manage stocks, get warnings on expired tablets, and adjust reorder alert triggers.": "दवाओं के स्टॉक को संभालें, एक्सपायरी चेतावनी पाएं और थ्रेसहोल्ड को ठीक करें।",
    "AI-Powered Forecasting": "एआई भविष्यवाणी प्रणाली",
    "Predict shortages, rush hours, and occupancy before they impact patients": "मरीज़ों को परेशानी होने से पहले कमी, भीड़ और बिस्तरों की आवश्यकता का पूर्वानुमान लगाएं",
    "Medicine Stock Forecasting": "दवाओं के स्टॉक का पूर्वानुमान",
    "Calculates depletion velocity to suggest reorder cycles 14 days before stockouts.": "दवा समाप्त होने से 14 दिन पहले ही दोबारा ऑर्डर देने का सुझाव देता है।",
    "Patient Flow Prediction": "मरीज़ों के आने का पूर्वानुमान",
    "Identifies historical seasonal peaks (e.g. flu seasons) to optimize check-in queues.": "भीड़भाड़ वाले मौसम की पहचान करके कतारों को छोटा रखने में मदद करता है।",
    "Emergency Bed Reservation": "आपातकालीन बिस्तर आरक्षण",
    "Frees up buffer emergency beds automatically during high local accident rates.": "आस-पास अधिक दुर्घटना होने पर आपातकालीन बिस्तरों को पहले से आरक्षित रखता है।",
    "System Auditing": "प्रणाली सुरक्षा जांच",
    "Live operations tracker and system logs": "लाइव संचालन ट्रैकर और लॉग",
    "All administrative and security actions are continuously logged for auditing. This maintains absolute compliance with medical standards and ensures patient safety.": "सुरक्षा और प्रशासनिक कार्यों को लगातार लॉग किया जाता है। इससे नियमों का पालन सुनिश्चित होता है।",
    "Automated error logging of database issues.": "डेटाबेस समस्याओं का स्वचालित लॉगिंग।",
    "Session timeouts protect user terminals from physical snooping.": "सुरक्षित सत्र समय-सीमा टर्मिनलों को अनधिकृत उपयोग से बचाती है।",
    "Hashed encryption shields credentials in transfer.": "एन्क्रिप्शन के माध्यम से क्रेडेंशियल को सुरक्षित रखता है।",
    "Role-based boundaries block privilege escalation.": "भूमिका-आधारित नियंत्रण सुरक्षा उल्लंघन को रोकता है।",

    // Senior Care Hub Card Keys
    "Medicine Stock": "दवाई की उपलब्धता",
    "Bed Vacancy": "खाली बिस्तर की स्थिति",
    "Doctor Attendance": "डॉक्टर की उपस्थिति",
    "Queue Wait Time": "मरीज़ों की कतार",
    "Senior Citizen Hub": "वरिष्ठ नागरिक सेवा केंद्र",
    "Quick Care Access": "आसान क्लिक द्वारा अस्पताल सेवाओं की जांच करें",

    // Medicine Stock Page
    "Inventory Tracking": "दवाखाना ट्रैकिंग",
    "Clinical Medicine Stock": "दवाइयों का लाइव स्टॉक",
    "Verify drug volumes, safety warning thresholds, and upcoming expiration cycles.": "दवाओं की मात्रा, सुरक्षा सीमा और समाप्त होने वाली दवाओं की सूची जांचें।",
    "Total Units In Stock": "कुल उपलब्ध दवाइयां",
    "Below Safety Margin": "खतरे के निशान के नीचे स्टॉक",
    "Expiring Soon (Expired or within 30 days)": "समाप्त होने वाली दवाएं (30 दिन में)",
    "Filter View:": "फ़िल्टर करें:",
    "All Items": "सभी दवाएं",
    "Critical Low": "बहुत ही कम स्टॉक",
    "Expired": "समाप्त दवाएं (Expired)",
    "Search medicine...": "दवा खोजें...",
    "Search": "खोजें",
    "Stock Registry": "दवा रजिस्ट्री तालिका",
    "Drug Item Name": "दवा का नाम",
    "Available Stock": "उपलब्ध स्टॉक",
    "Alert Threshold": "चेतावनी थ्रेसहोल्ड",
    "Expiration Date": "समाप्ति तिथि",
    "Status": "स्थिति",
    "No medicines matched in stock registry.": "स्टॉक रजिस्ट्री में कोई दवा नहीं मिली।",
    "✏️ Manage Pharmacy Registry": "✏️ दवाखाना स्टॉक प्रबंधित करें",
    "Normal": "सामान्य",
    "Critical": "अति महत्वपूर्ण",
    "Low": "कम स्टॉक",
    "Expired": "समाप्त",

    // Patient Flow Page
    "Footfall Analytics": "मरीज़ों की संख्या",
    "Out-Patient Flow": "ओपीडी मरीज़ कतार",
    "Verify average wait times, active queue size, and workload slot breakdowns.": "औसत प्रतीक्षा समय, कतार का आकार और कार्यभार विवरण देखें।",
    "Consultations Registered Today": "आज कुल पंजीकृत मरीज़",
    "Average Patient Wait Duration": "औसत प्रतीक्षा समय",
    "Active Waiting Queue Size": "कतार में प्रतीक्षारत मरीज़",
    "Daily Consultation Load Breakdown": "दैनिक परामर्श भार विवरण",
    "Distribution of outpatient arrivals across shifts today.": "आज की शिफ्टों में मरीज़ों के आगमन का वितरण।",
    "Morning Shift (08:00 - 12:00)": "सुबह की शिफ्ट (08:00 - 12:00)",
    "Afternoon Shift (12:00 - 16:00)": "दोपहर की शिफ्ट (12:00 - 16:00)",
    "Evening Shift (16:00 - 20:00)": "शाम की शिफ्ट (16:00 - 20:00)",
    "Live Queue Status & Highlights": "लाइव कतार स्थिति और निर्देश",
    "Peak Period Warning": "भीड़भाड़ की चेतावनी",
    "Active Physicians": "ड्यूटी पर उपलब्ध डॉक्टर",
    "Pharmacy Dispatch": "दवा वितरण समय",
    "Emergency Referrals": "आपातकालीन रेफरल",
    "Registration queue lengths usually peak at 10:00 AM on weekdays.": "सप्ताह के दिनों में सुबह 10:00 बजे सबसे अधिक भीड़ होती है।",
    "Ensure checking doctor check-ins before queue registration.": "कतार में लगने से पहले डॉक्टरों की उपस्थिति जांच लें।",
    "Medicines are ready for pick-up within 15 minutes after consulting.": "परामर्श के बाद 15 मिनट में दवाइयां मिल जाती हैं।",
    "Critical SOS requests bypass queue sequence automatically.": "गंभीर आपातकालीन (SOS) मरीज़ों को पहले देखा जाता है।",
    "Join Consultation Queue": "परामर्श के लिए कतार में लगें",

    // Bed Availability Page
    "Bed Occupancy": "बिस्तरों की लाइव स्थिति",
    "Clinical Wards Bed Registry": "अस्पताल वार्ड बिस्तर रजिस्ट्री",
    "Verify active emergency, intensive care unit, and ward bed allocations.": "आपातकालीन, आईसीयू और सामान्य वार्ड बिस्तरों के आवंटन की जांच करें।",
    "Total Beds In Facility": "अस्पताल में कुल बिस्तर",
    "Occupied Clinical Beds": "भरे हुए बिस्तर",
    "Available Referral Beds": "खाली बिस्तर",
    "Live Bed Registry": "लाइव बिस्तर रजिस्ट्री तालिका",
    "Ward Category Name": "वार्ड का प्रकार",
    "Total Beds Capacity": "कुल बिस्तर क्षमता",
    "Active Occupied Beds": "भरे हुए बिस्तर",
    "Available Vacancy": "खाली बिस्तर",
    "✏️ Update Bed Capacity": "✏️ बिस्तरों की संख्या अपडेट करें",
    "ICU": "आईसीयू (ICU)",
    "General": "सामान्य वार्ड (General)",
    "Pediatric": "बच्चों का वार्ड (Pediatric)",
    "Emergency": "आपातकालीन वार्ड (Emergency)",

    // Doctor Attendance Page
    "Roster & Punctuality": "उपस्थिति एवं रोस्टर",
    "Physician Attendance": "डॉक्टरों की लाइव उपस्थिति",
    "Verify medical staff check-ins, duty rosters, and active specialist shifts.": "डॉक्टरों के आने का समय, ड्यूटी सूची और सक्रिय शिफ्ट जांचें।",
    "On-Duty Specialists": "ड्यूटी पर विशेषज्ञ डॉक्टर",
    "Punctuality Roster Rate": "समय की पाबंदी दर",
    "Total Shift Rosters": "कुल शिफ्ट रोस्टर",
    "Live Attendance Roster": "लाइव उपस्थिति तालिका",
    "Doctor / Specialist": "डॉक्टर / विशेषज्ञ",
    "Specialty Role": "विशेषज्ञता",
    "Check-in Time": "आने का समय",
    "Check-out Time": "जाने का समय",
    "Shift Status": "स्थिति",
    "✏️ Mark My Attendance": "✏️ अपनी उपस्थिति दर्ज करें",
    "Not Checked-in": "उपस्थित नहीं",
    "Present": "उपस्थित",
    "On Leave": "छुट्टी पर",

    // Contact Page
    "Get In Touch": "हमसे संपर्क करें",
    "Help Desk Support": "सहायता केंद्र",
    "Submit feedback, log queries, or report clinical supply issues.": "फीडबैक भेजें, प्रश्न पूछें या दवा की कमी की रिपोर्ट करें।",
    "Send Us a Message": "हमें संदेश भेजें",
    "Your Full Name": "आपका पूरा नाम",
    "Your Email Address": "आपका ईमेल पता",
    "Topic / Subject": "विषय",
    "Detailed Message": "विस्तृत संदेश",
    "Send Message": "संदेश भेजें",
    "Form Category": "फार्म श्रेणी",
    "General Inquiry": "सामान्य पूछताछ",
    "Report Inventory Issue": "दवा की कमी की रिपोर्ट",
    "Report System Bug": "सिस्टम बग की रिपोर्ट",
    "Feedback": "फीडबैक",

    // Auth Pages
    "Welcome Back": "स्वागत है",
    "Sign in to access your customized role-based dashboard.": "अपने क्रेडेंशियल्स के साथ लॉगिन करें।",
    "Email address": "ईमेल पता",
    "Password": "पासवर्ड",
    "Sign In": "लॉगिन करें",
    "Don't have an account?": "खाता नहीं है?",
    "Register here": "यहां पंजीकरण करें",
    "Forgot Password?": "पासवर्ड भूल गए?",
    "Create Account": "खाता बनाएं",
    "Register a new profile to join queues and track visits.": "नया खाता पंजीकृत करें।",
    "Full Name": "पूरा नाम",
    "Confirm Password": "पासवर्ड की पुष्टि करें",
    "Account Role Type": "खाता प्रकार",
    "Patient (OPD / Queue)": "मरीज़ (OPD)",
    "Facility Doctor (Roster)": "डॉक्टर",
    "Pharmacist Staff (Inventory)": "दवाखाना कर्मचारी",
    "System Admin (All access)": "एडमिन",
    "Register": "पंजीकरण करें",
    "Already have an account?": "पहले से खाता है?",
    "Login here": "यहां लॉगिन करें",

    // Profile Page
    "User Profile": "उपयोगकर्ता प्रोफ़ाइल",
    "My Account Info": "मेरी खाता जानकारी",
    "Update your profile photo, clinical name, and secure passwords.": "अपनी प्रोफ़ाइल फ़ोटो, नाम और पासवर्ड बदलें।",
    "Profile Settings": "प्रोफ़ाइल सेटिंग",
    "Change Password": "पासवर्ड बदलें",
    "Current Password": "वर्तमान पासवर्ड",
    "New Password": "नया पासवर्ड",
    "Confirm New Password": "नए पासवर्ड की पुष्टि करें",
    "Update Photo": "फ़ोटो अपडेट करें",
    "Update Info": "जानकारी अपडेट करें",
    "Save Changes": "बदलाव सहेजें",

    // Accessibility Modal
    "Emergency Contacts": "आपातकालीन संपर्क सूची",
    "Call these numbers for immediate clinical help.": "तुरंत चिकित्सकीय सहायता के लिए इन नंबरों पर कॉल करें।",
    "National Ambulance Helpline": "राष्ट्रीय एम्बुलेंस हेल्पलाइन",
    "Toll-free emergency ambulance referral": "टोल-फ्री आपातकालीन एम्बुलेंस सेवा",
    "Primary Health Center Helpline": "प्राथमिक स्वास्थ्य केंद्र हेल्पलाइन",
    "Direct contact with clinic medical officer": "चिकित्सा अधिकारी से सीधा संपर्क",
    "Smart Health Command Center": "सहायता केंद्र",
    "Live support desk for general bed availability": "बिस्तरों की उपलब्धता और सामान्य सहायता डेस्क",
    "Close / बंद करें": "बंद करें"
};

// Programmatically build case-insensitive translation map
const lowerTranslationDict = {};
for (let key in translationDict) {
    lowerTranslationDict[key.toLowerCase()] = translationDict[key];
}

// 2. Global State Variable for Language
window.currentLanguage = localStorage.getItem('sh_lang') || 'en';
let voiceHoverActive = localStorage.getItem('sh_voice_hover') === 'active';
let currentFontSize = localStorage.getItem('sh_font_size') || 'standard';
let highContrastActive = localStorage.getItem('sh_contrast') === 'active';
let currentUtterance = null;

// 3. Main Initialization Function
function initAccessibilitySystem() {
    // 3.0 Load Google Translate dynamically
    loadGoogleTranslate();

    // 3.0.5 Load Google Material Icons dynamically
    loadMaterialIcons();

    // 3.1 Inject top bar
    injectAccessibilityBar();

    // 3.2 Inject Emergency SOS Modal
    injectSOSModal();

    // 3.3 Apply stored states
    applyFontSize(currentFontSize);
    applyContrast();
    applyVoiceHover();
    updateLanguageButtons();

    // 3.4 Bind Controls Events
    bindAccessibilityEvents();

    // 3.5 Run Page Translation (Hindi Fallback)
    if (window.currentLanguage === 'hi') {
        window.translatePage();
    }
    // Restore persistent translation
    applyStoredLanguage();

    // 3.5.5 Replace Emojis with Material Icons
    replaceEmojisWithIcons(document.body);

    // 3.6 Inject Click-to-Speak Buttons
    injectSpeakerButtonsForNode(document.body);

    // 3.6.5 Ensure all icons are protected from Google translation
    addNoTranslateToIcons(document.body);

    // 3.7 Start Mutation Observer to automatically handle dynamic nodes (JQuery loads, stats, logs)
    startTranslationObserver();

    // 3.8 Bind Hover Speech listeners
    bindVoiceHoverEvents();

    // 3.8.5 Announce language selection if recently changed
    announceLanguageLoad();
}

function announceLanguageLoad() {
    const justChangedLang = sessionStorage.getItem('sh_just_changed_lang');
    if (justChangedLang) {
        sessionStorage.removeItem('sh_just_changed_lang');
        const langNamesMap = {
            'en': 'English language activated',
            'hi': 'हिन्दी भाषा सक्रिय हो गई है',
            'gu': 'ગુજરાતી ભાષા સક્રિય થઈ છે',
            'mr': 'मराठी भाषा सक्रिय झाली आहे',
            'pa': 'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਸਰਗਰਮ ਹੋ ਗਈ ਹੈ',
            'ta': 'தமிழ் மொழி செயல்படுத்தப்பட்டது',
            'te': 'తెలుగు భాష సక్రియం చేయబడింది',
            'bn': 'বাংলা ভাষা সক্রিয় করা হয়েছে',
            'kn': 'ಕನ್ನಡ ಭಾಷೆ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ',
            'ml': 'മലയാള ഭാಷ ಸജീവമാക്കി',
            'ur': 'اردو زبان فعال ہو گئی ہے'
        };
        const msg = langNamesMap[justChangedLang] || 'Language activated';
        setTimeout(() => {
            speakText(msg, justChangedLang);
        }, 200);
    }
}

// 3.9 Google Translate Dynamic Loader & Custom Cookie Handlers
function loadGoogleTranslate() {
    if (!document.getElementById('google_translate_element')) {
        const div = document.createElement('div');
        div.id = 'google_translate_element';
        div.style.display = 'none';
        document.body.appendChild(div);
    }

    window.googleTranslateElementInit = function () {
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,hi,gu,mr,pa,ta,te,bn,kn,ml,ur',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');
    };

    if (!document.querySelector('script[src*="translate.google.com"]')) {
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        document.head.appendChild(script);
    }
}

function changeLanguage(langCode) {
    const domain = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? '' : '.' + window.location.hostname;

    if (langCode === 'en') {
        // Delete translate cookie
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + domain;
        document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    } else {
        // Set translate cookie
        document.cookie = "googtrans=/en/" + langCode + "; path=/; domain=" + domain;
        document.cookie = "googtrans=/en/" + langCode + "; path=/;";
    }

    localStorage.setItem('sh_lang', langCode);
    window.currentLanguage = langCode;

    // Trigger in-place translation if Google Translate widget combo box is loaded
    const googleSelect = document.querySelector('.goog-te-combo');
    if (googleSelect) {
        googleSelect.value = langCode;
        googleSelect.dispatchEvent(new Event('change'));
    } else {
        // Fallback: Reload page if Google widget is still loading in background
        window.location.reload();
    }
}

function applyStoredLanguage() {
    const storedLang = localStorage.getItem('sh_lang') || 'en';
    if (storedLang === 'en') return;

    let checksCount = 0;
    const interval = setInterval(() => {
        const googleSelect = document.querySelector('.goog-te-combo');
        if (googleSelect) {
            clearInterval(interval);
            if (googleSelect.value !== storedLang) {
                googleSelect.value = storedLang;
                googleSelect.dispatchEvent(new Event('change'));
            }
        }
        checksCount++;
        if (checksCount > 400) { // Timeout after 6 seconds (400 * 15ms)
            clearInterval(interval);
        }
    }, 15);
}

// 3.9.5 Google Material Icons Loaders and Emoji Replacer
function loadMaterialIcons() {
    if (!document.querySelector('link[href*="Material+Icons"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        document.head.appendChild(link);
    }
}

const emojiToIconMap = {
    "🏥": "local_hospital",
    "💊": "medication",
    "👥": "groups",
    "🛏️": "single_bed",
    "🩺": "medical_services",
    "⏳": "hourglass_empty",
    "🚨": "warning",
    "🔔": "notifications",
    "☀️": "light_mode",
    "🌙": "dark_mode",
    "📈": "trending_up",
    "📊": "bar_chart",
    "ℹ️": "info",
    "✅": "check_circle",
    "❌": "cancel",
    "⚠️": "warning",
    "🔒": "lock",
    "⚡": "bolt",
    "👋": "waving_hand",
    "📞": "phone",
    "🚑": "airport_shuttle",
    "✏️": "edit",
    "🔊": "volume_up"
};

function replaceEmojisWithIcons(node) {
    if (!node) return;
    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'IFRAME', 'NOSCRIPT'].includes(node.tagName)) return;
    if (node.classList && (node.classList.contains('material-icons') || node.classList.contains('material-icons-outlined'))) return;

    // Replace inside child text nodes
    for (let child of Array.from(node.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
            let text = child.nodeValue;
            let modified = false;

            // Check for each emoji in the map
            for (let emoji in emojiToIconMap) {
                if (text.includes(emoji)) {
                    const span = document.createElement('span');
                    span.className = 'material-icons notranslate';
                    span.textContent = emojiToIconMap[emoji];

                    const parent = child.parentNode;
                    const parts = text.split(emoji);

                    // Insert preceding text
                    if (parts[0]) {
                        parent.insertBefore(document.createTextNode(parts[0]), child);
                    }
                    // Insert icon span
                    parent.insertBefore(span, child);

                    // Update text to be processed
                    text = parts.slice(1).join(emoji);
                    modified = true;
                }
            }

            if (modified) {
                // Insert remaining text
                if (text) {
                    child.nodeValue = text;
                } else {
                    child.remove();
                }
            }
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            // Recurse into children
            replaceEmojisWithIcons(child);
        }
    }
}
// 4. Inject Accessibility Bar
function injectAccessibilityBar() {
    if (document.getElementById('accessibility-bar')) return;

    const accBar = document.createElement('div');
    accBar.id = 'accessibility-bar';
    accBar.className = 'acc-bar';
    accBar.innerHTML = `
        <div class="acc-bar-title">
            <span class="acc-title-emoji">👵👴</span>
            <span class="acc-title-text-hi">वरिष्ठ सहायता</span>
            <span class="acc-title-sep">/</span>
            <span class="acc-title-text-en">Senior Care & Assist</span>
        </div>
        <div class="acc-controls">
            <div class="acc-control-group">
                <span class="acc-label">
                    <span class="material-icons acc-icon notranslate">language</span>
                    <span class="acc-label-text">भाषा / Language:</span>
                </span>
                <select id="lang-selector" class="acc-select">
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                    <option value="gu">ગુજરાતી (Gujarati)</option>
                    <option value="mr">मराठी (Marathi)</option>
                    <option value="pa">ਪੰਜਾਬੀ (Punjabi)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                    <option value="te">తెలుగు (Telugu)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="kn">ಕನ್ನಡ (Kannada)</option>
                    <option value="ml">മലയാളം (Malayalam)</option>
                    <option value="ur">اردו (Urdu)</option>
                </select>
            </div>
            <div class="acc-control-group">
                <span class="acc-label">
                    <span class="material-icons acc-icon notranslate">format_size</span>
                    <span class="acc-label-text">आकार / Size:</span>
                </span>
                <div class="acc-btn-group">
                    <button type="button" class="acc-btn" id="size-btn-sm" title="Standard text size">A-</button>
                    <button type="button" class="acc-btn" id="size-btn-md" title="Large text size">A</button>
                    <button type="button" class="acc-btn" id="size-btn-lg" title="Extra Large text size">A+</button>
                </div>
            </div>
            <div class="acc-control-group">
                <span class="acc-label">
                    <span class="material-icons acc-icon notranslate">contrast</span>
                    <span class="acc-label-text">रंग / Contrast:</span>
                </span>
                <button type="button" class="acc-btn" id="contrast-toggle">
                    <span class="material-icons btn-icon-only notranslate">contrast</span>
                    <span class="acc-btn-text">Contrast / साफ़ रंग</span>
                </button>
            </div>
            <div class="acc-control-group">
                <span class="acc-label">
                    <span class="material-icons acc-icon notranslate">volume_up</span>
                    <span class="acc-label-text">आवाज़ / Sound:</span>
                </span>
                <button type="button" class="acc-btn" id="voice-hover-toggle">
                    <span class="material-icons btn-icon notranslate" style="font-size: 1.15rem; margin-right: 4px;">volume_up</span>
                    <span class="acc-btn-text">Read / बोलकर सुनें</span>
                </button>
            </div>
            <button type="button" class="acc-btn-sos" id="sos-btn">
                <span class="material-icons btn-icon notranslate" style="font-size: 1.20rem; margin-right: 4px;">warning</span>
                <span class="acc-btn-text">EMERGENCY SOS / आपातकालीन</span>
            </button>
        </div>
    `;

    document.body.insertBefore(accBar, document.body.firstChild);
}

// 5. Inject SOS Modal
function injectSOSModal() {
    if (document.getElementById('sos-modal-overlay')) return;

    const sosOverlay = document.createElement('div');
    sosOverlay.id = 'sos-modal-overlay';
    sosOverlay.className = 'sos-overlay';
    sosOverlay.innerHTML = `
        <div class="sos-modal">
            <div class="sos-modal-header">
                <span class="sos-modal-icon">🚨</span>
                <h3 class="sos-modal-heading">Emergency Contacts</h3>
                <p class="sos-modal-sub">Call these numbers for immediate clinical help.</p>
            </div>
            <div class="sos-numbers">
                <div class="sos-card">
                    <div class="sos-card-info">
                        <h4>National Ambulance Helpline</h4>
                        <p>Toll-free emergency ambulance referral</p>
                    </div>
                    <a href="tel:108" class="sos-tel-btn">📞 108</a>
                </div>
                <div class="sos-card">
                    <div class="sos-card-info">
                        <h4>Primary Health Center Helpline</h4>
                        <p>Direct contact with clinic medical officer</p>
                    </div>
                    <a href="tel:104" class="sos-tel-btn">📞 104</a>
                </div>
                <div class="sos-card">
                    <div class="sos-card-info">
                        <h4>Smart Health Command Center</h4>
                        <p>Live support desk for general bed availability</p>
                    </div>
                    <a href="tel:180011112222" class="sos-tel-btn">📞 1800-1111</a>
                </div>
            </div>
            <button type="button" class="btn btn-danger sos-close-btn" id="sos-close-btn">Close / बंद करें</button>
        </div>
    `;
    document.body.appendChild(sosOverlay);
}

// 6. Bind Accessibility Controls Events
function bindAccessibilityEvents() {
    const langSelector = document.getElementById('lang-selector');
    const sizeBtnSm = document.getElementById('size-btn-sm');
    const sizeBtnMd = document.getElementById('size-btn-md');
    const sizeBtnLg = document.getElementById('size-btn-lg');
    const contrastBtn = document.getElementById('contrast-toggle');
    const voiceBtn = document.getElementById('voice-hover-toggle');
    const sosBtn = document.getElementById('sos-btn');
    const sosCloseBtn = document.getElementById('sos-close-btn');
    const sosOverlay = document.getElementById('sos-modal-overlay');

    // Language Dropdown Selection
    if (langSelector) {
        langSelector.value = window.currentLanguage;
        langSelector.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            sessionStorage.setItem('sh_just_changed_lang', selectedLang);
            changeLanguage(selectedLang);

            // If page didn't reload, speak immediately
            setTimeout(() => {
                if (sessionStorage.getItem('sh_just_changed_lang')) {
                    sessionStorage.removeItem('sh_just_changed_lang');
                    const langNamesMap = {
                        'en': 'English language activated',
                        'hi': 'हिन्दी भाषा सक्रिय हो गई है',
                        'gu': 'ગુજરાતી ભાષા સક્રિય થઈ છે',
                        'mr': 'मराठी भाषा सक्रिय झाली आहे',
                        'pa': 'ਪੰਜਾਬੀ ਭਾਸ਼ਾ ਸਰਗਰਮ ਹੋ ਗਈ ਹੈ',
                        'ta': 'தமிழ் மொழி செயல்படுத்தப்பட்டது',
                        'te': 'తెలుగు భాష సక్రియం చేయబడింది',
                        'bn': 'বাংলা ভাষা সক্রিয় করা হয়েছে',
                        'kn': 'ಕನ್ನಡ ಭಾಷೆ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ',
                        'ml': 'മലയാള ભાಷ ಸജീവമാക്കി',
                        'ur': 'اردو زبان فعال ہو گئی ہے'
                    };
                    const msg = langNamesMap[selectedLang] || 'Language activated';
                    speakText(msg, selectedLang);
                }
            }, 30);
        });
    }

    // Font Sizer
    if (sizeBtnSm) {
        sizeBtnSm.addEventListener('click', () => {
            currentFontSize = 'standard';
            localStorage.setItem('sh_font_size', 'standard');
            applyFontSize(currentFontSize);
        });
    }
    if (sizeBtnMd) {
        sizeBtnMd.addEventListener('click', () => {
            currentFontSize = 'large';
            localStorage.setItem('sh_font_size', 'large');
            applyFontSize(currentFontSize);
        });
    }
    if (sizeBtnLg) {
        sizeBtnLg.addEventListener('click', () => {
            currentFontSize = 'xl';
            localStorage.setItem('sh_font_size', 'xl');
            applyFontSize(currentFontSize);
        });
    }

    // High Contrast Toggle
    if (contrastBtn) {
        contrastBtn.addEventListener('click', () => {
            highContrastActive = !highContrastActive;
            localStorage.setItem('sh_contrast', highContrastActive ? 'active' : 'inactive');
            applyContrast();
        });
    }

    // Voice Hover Toggle
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            voiceHoverActive = !voiceHoverActive;
            localStorage.setItem('sh_voice_hover', voiceHoverActive ? 'active' : 'inactive');
            applyVoiceHover();
        });
    }

    // Emergency Modal toggles
    if (sosBtn && sosOverlay && sosCloseBtn) {
        sosBtn.addEventListener('click', () => {
            sosOverlay.classList.add('open');
            speakText("Emergency contact screen opened. Call 108 for ambulance, 104 for health helpline.", window.currentLanguage);
        });
        sosCloseBtn.addEventListener('click', () => {
            sosOverlay.classList.remove('open');
            if (window.speechSynthesis) window.speechSynthesis.cancel();
        });
        sosOverlay.addEventListener('click', (e) => {
            if (e.target === sosOverlay) {
                sosOverlay.classList.remove('open');
                if (window.speechSynthesis) window.speechSynthesis.cancel();
            }
        });
    }
}

// 7. Apply Settings helpers
function updateLanguageButtons() {
    const langSelector = document.getElementById('lang-selector');
    if (langSelector) {
        langSelector.value = window.currentLanguage;
    }
}

function applyFontSize(size) {
    document.body.classList.remove('accessible-font-large', 'accessible-font-xl');
    if (size === 'large') {
        document.body.classList.add('accessible-font-large');
    } else if (size === 'xl') {
        document.body.classList.add('accessible-font-xl');
    }

    const btnSm = document.getElementById('size-btn-sm');
    const btnMd = document.getElementById('size-btn-md');
    const btnLg = document.getElementById('size-btn-lg');
    if (btnSm && btnMd && btnLg) {
        btnSm.classList.remove('active');
        btnMd.classList.remove('active');
        btnLg.classList.remove('active');
        if (size === 'standard') btnSm.classList.add('active');
        else if (size === 'large') btnMd.classList.add('active');
        else if (size === 'xl') btnLg.classList.add('active');
    }
}

function applyContrast() {
    const btn = document.getElementById('contrast-toggle');
    if (highContrastActive) {
        document.body.classList.add('high-contrast-theme');
        if (btn) btn.classList.add('active');
    } else {
        document.body.classList.remove('high-contrast-theme');
        if (btn) btn.classList.remove('active');
    }
}

function applyVoiceHover() {
    const btn = document.getElementById('voice-hover-toggle');
    if (btn) {
        if (voiceHoverActive) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
}

// 8. HTML Translation Logic
function translateElement(el) {
    if (!el || !el.tagName) return;
    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'IFRAME', 'NOSCRIPT'].includes(el.tagName)) return;
    if (el.classList.contains('acc-bar') || el.closest('.acc-bar')) return; // Don't translate the accessibility bar itself

    // Translate inputs and placeholder texts
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        const placeholderVal = el.placeholder;
        if (placeholderVal) {
            const cleanPlaceholder = placeholderVal.trim().toLowerCase();
            if (window.currentLanguage === 'hi') {
                if (lowerTranslationDict[cleanPlaceholder]) {
                    if (!el.getAttribute('data-orig-placeholder')) {
                        el.setAttribute('data-orig-placeholder', placeholderVal);
                    }
                    el.placeholder = lowerTranslationDict[cleanPlaceholder];
                }
            } else {
                const origPlaceholder = el.getAttribute('data-orig-placeholder');
                if (origPlaceholder) {
                    el.placeholder = origPlaceholder;
                }
            }
        }
    }

    // Traverse Child Nodes for direct Text Translation
    for (let child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            const textVal = child.nodeValue.trim();
            if (!textVal) continue;

            const childIndex = Array.from(el.childNodes).indexOf(child);
            const dataAttributeName = 'data-orig-text-' + childIndex;
            let parentOrigText = el.getAttribute(dataAttributeName);

            // Fetch or register the original English text
            if (!parentOrigText) {
                let matched = false;
                const cleanKey = textVal.toLowerCase();
                if (lowerTranslationDict[cleanKey]) {
                    matched = true;
                } else if (cleanKey.endsWith(" units") || cleanKey.endsWith(" min") || cleanKey.endsWith(" patients")) {
                    matched = true;
                } else if (cleanKey.includes(" patients (") && cleanKey.endsWith("%)")) {
                    matched = true;
                }

                if (matched) {
                    el.setAttribute(dataAttributeName, textVal);
                    parentOrigText = textVal;
                }
            }

            // Translate text node value
            if (parentOrigText) {
                if (window.currentLanguage === 'hi') {
                    const cleanKey = parentOrigText.toLowerCase();
                    let translatedVal = lowerTranslationDict[cleanKey];

                    // Handle dynamic quantities/units translations
                    if (!translatedVal) {
                        if (cleanKey.endsWith(" units")) {
                            const num = parentOrigText.replace(/ units/i, "").trim();
                            translatedVal = num + " इकाई";
                        } else if (cleanKey.endsWith(" min")) {
                            const num = parentOrigText.replace(/ min/i, "").trim();
                            translatedVal = num + " मिनट";
                        } else if (cleanKey.endsWith(" patients")) {
                            const num = parentOrigText.replace(/ patients/i, "").trim();
                            translatedVal = num + " मरीज़";
                        } else if (cleanKey.includes(" patients (") && cleanKey.endsWith("%)")) {
                            const parts = parentOrigText.split(/ patients \(/i);
                            const num = parts[0].trim();
                            const pct = parts[1].replace(")", "").trim();
                            translatedVal = `${num} मरीज़ (${pct})`;
                        }
                    }

                    if (translatedVal) {
                        child.nodeValue = child.nodeValue.replace(textVal, translatedVal);
                    }
                } else {
                    // Restore English
                    child.nodeValue = child.nodeValue.replace(textVal, parentOrigText);
                }
            }
        }
    }
}
window.translatePage = function () {
    const allElements = document.getElementsByTagName('*');
    for (let el of allElements) {
        translateElement(el);
    }
};

// 9. MutationObserver for Dynamic Updates (tables, rosters, clocks, metrics)
let translationObserver = null;
function startTranslationObserver() {
    if (translationObserver) return;

    translationObserver = new MutationObserver((mutations) => {
        translationObserver.disconnect();

        for (let mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Translate new element
                        translateElement(node);
                        const children = node.getElementsByTagName('*');
                        for (let child of children) {
                            translateElement(child);
                        }
                        // Replace Emojis with Material Icons in new node
                        replaceEmojisWithIcons(node);
                        // Add speak buttons to headings
                        injectSpeakerButtonsForNode(node);
                        // Shield icons from Google Translate
                        addNoTranslateToIcons(node);
                    }
                });
            } else if (mutation.type === 'characterData') {
                const parent = mutation.target.parentElement;
                if (parent) {
                    translateElement(parent);
                    replaceEmojisWithIcons(parent);
                    addNoTranslateToIcons(parent);
                }
            }
        }

        translationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    });

    translationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// 10. Text-to-Speech (TTS) Voice Helpers
function speakText(text, lang = 'en') {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Terminate preceding queues

    const utterance = new SpeechSynthesisUtterance(text);

    // Map lang codes to Indian voice locales
    const langLocaleMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'gu': 'gu-IN',
        'mr': 'mr-IN',
        'pa': 'pa-IN',
        'ta': 'ta-IN',
        'te': 'te-IN',
        'bn': 'bn-IN',
        'kn': 'kn-IN',
        'ml': 'ml-IN',
        'ur': 'ur-IN'
    };

    utterance.lang = langLocaleMap[lang] || 'en-IN';

    // Try to find a voice that matches this locale in synthesis voices
    if (window.speechSynthesis.getVoices) {
        const voices = window.speechSynthesis.getVoices();
        const matchedVoice = voices.find(voice => voice.lang.toLowerCase().startsWith(lang.toLowerCase()) || voice.lang.toLowerCase().includes(lang.toLowerCase() + '-in'));
        if (matchedVoice) {
            utterance.voice = matchedVoice;
        }
    }

    utterance.rate = 0.82; // Slower speed specifically optimized for elderly users
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
    currentUtterance = utterance;
}

// Helper to remove nested text elements from read text
function getCleanText(el) {
    const clone = el.cloneNode(true);
    const speakBtns = clone.querySelectorAll('.tts-speak-btn');
    speakBtns.forEach(btn => btn.remove());

    // Also remove the mobile hamburger menu icon inside brands or links
    const iconSpan = clone.querySelector('.brand-icon');
    if (iconSpan) iconSpan.remove();

    return clone.textContent.trim();
}

function injectSpeakerButtonsForNode(container) {
    // Only scan headings and card labels
    const selectors = ['h1', 'h2', 'h3', '.card-icon + h3', '.mini-card strong', '.section-heading h2'];
    const elements = container.querySelectorAll ? container.querySelectorAll(selectors.join(',')) : [];

    elements.forEach(el => {
        // Skip accessibility bar, speak buttons themselves, or already-injected elements
        if (el.closest('.acc-bar')) return;
        if (el.querySelector('.tts-speak-btn') || el.classList.contains('tts-speak-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'tts-speak-btn';
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-label', 'Read Aloud / बोलकर सुनें');

        const iconSpan = document.createElement('span');
        iconSpan.className = 'material-icons notranslate';
        iconSpan.style.marginRight = '0';
        iconSpan.textContent = 'volume_up';
        btn.appendChild(iconSpan);

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const textToSpeak = getCleanText(el);
            speakText(textToSpeak, window.currentLanguage);
        });

        el.appendChild(btn);
    });
}

function addNoTranslateToIcons(rootNode = document.body) {
    const icons = rootNode.querySelectorAll ? rootNode.querySelectorAll('.material-icons') : [];
    icons.forEach(icon => {
        if (!icon.classList.contains('notranslate')) {
            icon.classList.add('notranslate');
        }
    });
}

// 11. Hover-based Voice Reader Events
function bindVoiceHoverEvents() {
    document.body.addEventListener('mouseover', (e) => {
        if (!voiceHoverActive) return;

        const el = e.target;
        // Target headings, lists, cards, tables, buttons, and links
        const isTarget = ['H1', 'H2', 'H3', 'H4', 'P', 'LABEL', 'TH', 'TD', 'BUTTON', 'A'].includes(el.tagName) ||
            el.classList.contains('card') ||
            el.classList.contains('mini-card') ||
            el.classList.contains('stat-pill');

        if (isTarget) {
            if (el.closest('.acc-bar')) return; // Avoid reading controls
            if (el.dataset.speaking === 'true') return;

            el.dataset.speaking = 'true';
            const cleanText = getCleanText(el);
            if (cleanText.length > 1) {
                speakText(cleanText, window.currentLanguage);
                el.classList.add('tts-active');
            }
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const el = e.target;
        if (el.dataset.speaking === 'true') {
            el.removeAttribute('data-speaking');
            el.classList.remove('tts-active');
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        }
    });
}

function loadScript(url) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

async function setupRealtimeRoleSync(pathPrefix, currentUser) {
    if (!currentUser) return;

    // Check if firebase is already loaded. If not, load the compatibility libraries
    if (typeof firebase === 'undefined') {
        try {
            await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js');
            await loadScript('https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore-compat.js');
            await loadScript(`${pathPrefix}assets/js/firebase-auth.js`);
            // Wait for firebase init promise to resolve
            if (window.firebaseAuthPromise) {
                await window.firebaseAuthPromise;
            }
        } catch (e) {
            console.error("Failed to load Firebase scripts for real-time role sync:", e);
            return;
        }
    }

    const uid = currentUser.firebase_uid || currentUser.id;
    if (!uid) return;

    try {
        firebase.firestore().collection('users').doc(String(uid)).onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                let changed = false;

                // Compare role, name, status
                const normalizedFirestoreRole = data.role ? data.role.trim().toLowerCase() : '';
                if (normalizedFirestoreRole !== currentUser.role) {
                    currentUser.role = normalizedFirestoreRole;
                    changed = true;
                }
                if (data.name !== currentUser.name) {
                    currentUser.name = data.name;
                    changed = true;
                }
                if (data.status !== currentUser.status) {
                    currentUser.status = data.status;
                    changed = true;
                }
                if (data.profile_photo !== currentUser.profile_photo) {
                    currentUser.profile_photo = data.profile_photo;
                    changed = true;
                }

                if (changed) {
                    // Update sessionStorage
                    sessionStorage.setItem('sh_current_user', JSON.stringify(currentUser));

                    // Update local DB cache
                    if (window.db) {
                        const localUsers = window.db.getUsers();
                        const idx = localUsers.findIndex(u => String(u.id) === String(uid) || u.email.toLowerCase() === currentUser.email.toLowerCase());
                        if (idx !== -1) {
                            localUsers[idx] = { ...localUsers[idx], ...currentUser };
                            window.db.saveUsers(localUsers);
                        }
                    }

                    // If on restricted dashboard and role has changed, redirect to correct one
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/dashboard/') || currentPath.includes('/profile.html')) {
                        const bodyEl = document.body;
                        const restrictedRolesAttr = bodyEl.getAttribute('data-restricted-roles');
                        if (restrictedRolesAttr) {
                            const allowedRoles = restrictedRolesAttr.split(',').map(r => r.trim());
                            if (!allowedRoles.includes(currentUser.role)) {
                                setFlashMessage('Your account profile has been updated by the administrator.', 'warning');
                                const dest = ROLE_DASHBOARDS[currentUser.role] || ROLE_DASHBOARDS['guest'];
                                window.location.href = `${pathPrefix}${dest}`;
                            } else {
                                // Just reload the page to refresh UI elements
                                window.location.reload();
                            }
                        }
                    } else {
                        // On a public page, just reload the page to refresh navigation header
                        window.location.reload();
                    }
                }
            }
        });
    } catch (e) {
        console.error("Error setting up Firestore role snapshot listener:", e);
    }
}
