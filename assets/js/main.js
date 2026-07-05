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

    // 6. jQuery Validation Integration
    if (typeof $.fn.validate !== 'undefined') {
        // Custom file extension validator
        $.validator.addMethod("fileExtension", function(value, element, param) {
            if (element.files.length === 0) return true;
            const ext = value.split('.').pop().toLowerCase();
            return param.indexOf(ext) !== -1;
        }, "Invalid file format.");

        // Custom file size validator
        $.validator.addMethod("fileSize", function(value, element, param) {
            if (element.files.length === 0) return true;
            return element.files[0].size <= param;
        }, "File size exceeds the limit.");

        // Setup validation globally for all forms
        $('form').each(function() {
            const $form = $(this);
            
            if ($form.hasClass('no-validate')) return;
            
            $form.validate({
                errorElement: 'label',
                errorClass: 'error',
                highlight: function(element, errorClass, validClass) {
                    $(element).addClass(errorClass).removeClass(validClass);
                },
                unhighlight: function(element, errorClass, validClass) {
                    $(element).removeClass(errorClass).addClass(validClass);
                },
                rules: {
                    name: {
                        required: true,
                        minlength: 2
                    },
                    email: {
                        required: true,
                        email: true
                    },
                    password: {
                        required: true,
                        minlength: 8
                    },
                    confirm_password: {
                        required: true,
                        minlength: 8,
                        equalTo: "input[name='password']"
                    },
                    subject: {
                        required: true,
                        minlength: 4
                    },
                    message: {
                        required: true,
                        minlength: 10
                    },
                    caption: {
                        required: true
                    },
                    stock: {
                        required: true,
                        digits: true
                    },
                    threshold: {
                        required: true,
                        digits: true
                    },
                    expiry_date: {
                        required: true,
                        date: true
                    },
                    notes: {
                        required: true,
                        minlength: 10
                    },
                    profile_photo: {
                        fileExtension: ['jpg', 'jpeg', 'png', 'webp'],
                        fileSize: 2 * 1024 * 1024
                    },
                    gallery_file: {
                        required: true,
                        fileExtension: ['jpg', 'jpeg', 'png', 'webp'],
                        fileSize: 3 * 1024 * 1024
                    }
                },
                messages: {
                    name: {
                        required: "Please enter your full name",
                        minlength: "Name must be at least 2 characters"
                    },
                    email: {
                        required: "Please enter your email address",
                        email: "Please enter a valid email address"
                    },
                    password: {
                        required: "Please enter your password",
                        minlength: "Password must be at least 8 characters long"
                    },
                    confirm_password: {
                        required: "Please repeat your password",
                        equalTo: "Passwords do not match"
                    },
                    subject: {
                        required: "Please specify a subject",
                        minlength: "Subject must be at least 4 characters long"
                    },
                    message: {
                        required: "Please enter a detailed message",
                        minlength: "Message must be at least 10 characters long"
                    },
                    stock: {
                        required: "Specify initial stock count",
                        digits: "Stock must be a positive integer"
                    },
                    threshold: {
                        required: "Specify safety warning threshold limit",
                        digits: "Threshold must be a positive integer"
                    },
                    expiry_date: {
                        required: "Please specify a valid expiration date",
                        date: "Invalid date format"
                    },
                    notes: {
                        required: "Please add medical diagnosis/prescription details",
                        minlength: "Prescription must be at least 10 characters long"
                    },
                    profile_photo: {
                        fileExtension: "Only JPG, PNG, and WEBP formats are allowed",
                        fileSize: "Avatar image size must be less than 2MB"
                    },
                    gallery_file: {
                        required: "Please select an image file to upload",
                        fileExtension: "Only JPG, PNG, and WEBP formats are allowed",
                        fileSize: "Gallery image size must be less than 3MB"
                    }
                }
            });
        });
    }
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
