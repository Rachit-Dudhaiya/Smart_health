/**
 * Smart Health - Core Client-Side Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Page Loader
    const loader = document.getElementById('page-loader');
    if (loader) {
        // Smoothly hide loader
        setTimeout(() => {
            loader.classList.add('hidden');
        }, 150);
    }

    // 2. Set Dynamic Copyright Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 3. Responsive Navigation Drawer
    const menuToggle = document.getElementById('menu-toggle');
    const siteNav = document.getElementById('site-nav');
    
    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', () => {
            const isOpen = siteNav.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
            
            // Hamburger visual toggle
            const spans = menuToggle.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
        
        // Close menu drawer when clicking outside
        document.addEventListener('click', (e) => {
            if (!siteNav.contains(e.target) && !menuToggle.contains(e.target) && siteNav.classList.contains('open')) {
                siteNav.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
                const spans = menuToggle.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // 4. Dark / Light Mode Switcher
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            // Set cookie for 1 year
            document.cookie = `theme=${isDark ? 'dark' : 'light'}; max-age=${365 * 24 * 60 * 60}; path=/; SameSite=Strict`;
        });
    }

    // 5. FAQ Accordion Controls
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(q => {
        q.addEventListener('click', () => {
            const item = q.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close other items
            document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
            
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // 6. Generic Form Validation Guard
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        // Skip validation if not requested
        if (form.classList.contains('no-validate')) return;
        
        form.addEventListener('submit', (e) => {
            let isValid = true;
            
            // Check password match fields
            const password = form.querySelector('input[name="password"]');
            const confirmPassword = form.querySelector('input[name="confirm_password"]');
            
            if (password && confirmPassword && password.value !== confirmPassword.value) {
                isValid = false;
                showToast("Passwords do not match!", "error");
            }
            
            // Check file upload extensions if exists
            const fileInputs = form.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
                if (input.files.length > 0) {
                    const file = input.files[0];
                    const extension = file.name.split('.').pop().toLowerCase();
                    const allowed = ['jpg', 'jpeg', 'png', 'webp'];
                    if (!allowed.includes(extension)) {
                        isValid = false;
                        showToast("Invalid file type. Only JPG, PNG, and WEBP allowed.", "error");
                    }
                    if (file.size > 2 * 1024 * 1024) {
                        isValid = false;
                        showToast("File is too large! Maximum limit is 2MB.", "error");
                    }
                }
            });

            if (!isValid) {
                e.preventDefault();
            }
        });
    });
});

/**
 * Global Toast Alert Helper
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Create Toast Element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    // Icon selection
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <div class="toast-content">${icon} ${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// Expose toast function globally
window.showToast = showToast;
