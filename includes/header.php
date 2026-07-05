<?php
/**
 * Smart Health - Common Header View
 */

require_once __DIR__ . '/auth.php';

// Generate CSRF token if not set
$csrfToken = generate_csrf_token();

// Resolve paths dynamically
$cssPath = get_relative_url('assets/css/styles.css');
$jsPath = get_relative_url('assets/js/main.js');
$homeUrl = get_relative_url('index.php');
$medicineUrl = get_relative_url('pages/medicine-stock.php');
$patientUrl = get_relative_url('pages/patient-flow.php');
$bedUrl = get_relative_url('pages/bed-availability.php');
$doctorUrl = get_relative_url('pages/doctor-attendance.php');
$contactUrl = get_relative_url('pages/contact.php');
$aboutUrl = get_relative_url('pages/about.php');
$servicesUrl = get_relative_url('pages/services.php');
$galleryUrl = get_relative_url('pages/gallery.php');
$faqUrl = get_relative_url('pages/faq.php');
$feedbackUrl = get_relative_url('pages/feedback.php');
$profileUrl = get_relative_url('pages/profile.php');
$notificationsUrl = get_relative_url('pages/notifications.php');
$loginUrl = get_relative_url('pages/auth/login.php');
$registerUrl = get_relative_url('pages/auth/register.php');
$logoutUrl = get_relative_url('pages/auth/logout.php');

// Dashboard links depending on role
$dashboardUrl = '';
if (isset($_SESSION['user_role'])) {
    switch ($_SESSION['user_role']) {
        case 'admin':
            $dashboardUrl = get_relative_url('pages/dashboard/admin.php');
            break;
        case 'doctor':
            $dashboardUrl = get_relative_url('pages/dashboard/doctor.php');
            break;
        case 'pharmacist':
            $dashboardUrl = get_relative_url('pages/dashboard/pharmacist.php');
            break;
        case 'patient':
        default:
            $dashboardUrl = get_relative_url('pages/dashboard/patient.php');
            break;
    }
}

// Check active page
$currentScriptName = basename($_SERVER['SCRIPT_NAME']);

// Fetch unread notification count
$unreadNotifCount = 0;
if (isset($_SESSION['user_id'])) {
    try {
        $stmt = $GLOBALS['db']->prepare("SELECT COUNT(*) FROM `notifications` WHERE `user_id` = :user_id AND `is_read` = 0");
        $stmt->execute([':user_id' => $_SESSION['user_id']]);
        $unreadNotifCount = $stmt->fetchColumn();
    } catch (PDOException $e) {
        // Fail silently
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?= isset($pageTitle) ? e($pageTitle) . ' | ' . SITE_NAME : SITE_NAME . ' | AI-Powered Healthcare' ?></title>
    <meta name="description" content="<?= isset($pageDesc) ? e($pageDesc) : 'Smart Health provides real-time AI monitoring for healthcare centers.' ?>" />
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    
    <link rel="stylesheet" href="<?= $cssPath ?>" />
</head>
<body class="<?= isset($_COOKIE['theme']) && $_COOKIE['theme'] === 'dark' ? 'dark-theme' : '' ?>">
    <!-- Loader Page Transition -->
    <div id="page-loader" class="page-loader">
        <div class="loader-spinner"></div>
    </div>

    <!-- Navigation Header -->
    <header class="site-header">
        <div class="container nav-row">
            <a href="<?= $homeUrl ?>" class="brand">
                <span class="brand-icon">🏥</span>
                <span><?= SITE_NAME ?></span>
            </a>
            
            <div class="nav-controls">
                <!-- Theme toggle switch -->
                <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle theme" type="button">
                    <span class="sun-icon">☀️</span>
                    <span class="moon-icon">🌙</span>
                </button>
                
                <!-- Hamburger menu -->
                <button class="menu-toggle" aria-label="Toggle menu" aria-expanded="false" id="menu-toggle">
                    <span></span><span></span><span></span>
                </button>
            </div>
            
            <nav class="site-nav" id="site-nav">
                <a href="<?= $homeUrl ?>" class="<?= $currentScriptName === 'index.php' ? 'active' : '' ?>">Home</a>
                <a href="<?= $aboutUrl ?>" class="<?= $currentScriptName === 'about.php' ? 'active' : '' ?>">About</a>
                <a href="<?= $servicesUrl ?>" class="<?= $currentScriptName === 'services.php' ? 'active' : '' ?>">Services</a>
                <a href="<?= $galleryUrl ?>" class="<?= $currentScriptName === 'gallery.php' ? 'active' : '' ?>">Gallery</a>
                <a href="<?= $faqUrl ?>" class="<?= $currentScriptName === 'faq.php' ? 'active' : '' ?>">FAQ</a>
                
                <!-- Dynamic operational pages -->
                <a href="<?= $medicineUrl ?>" class="<?= $currentScriptName === 'medicine-stock.php' ? 'active' : '' ?>">Medicine Stock</a>
                <a href="<?= $patientUrl ?>" class="<?= $currentScriptName === 'patient-flow.php' ? 'active' : '' ?>">Patient Flow</a>
                <a href="<?= $bedUrl ?>" class="<?= $currentScriptName === 'bed-availability.php' ? 'active' : '' ?>">Bed Availability</a>
                <a href="<?= $doctorUrl ?>" class="<?= $currentScriptName === 'doctor-attendance.php' ? 'active' : '' ?>">Doctor Attendance</a>
                <a href="<?= $contactUrl ?>" class="<?= $currentScriptName === 'contact.php' ? 'active' : '' ?>">Contact</a>

                <div class="nav-auth-separator"></div>

                <!-- Session states -->
                <?php if (isset($_SESSION['user_id'])): ?>
                    <!-- Logged in state -->
                    <a href="<?= $notificationsUrl ?>" class="nav-notif-bell <?= $currentScriptName === 'notifications.php' ? 'active' : '' ?>" title="Notifications">
                        🔔 <span class="notif-count"><?= $unreadNotifCount ?></span>
                    </a>
                    <a href="<?= $dashboardUrl ?>" class="btn-dashboard-nav <?= (strpos($_SERVER['SCRIPT_NAME'], '/dashboard/') !== false) ? 'active' : '' ?>">Dashboard</a>
                    <div class="user-menu-wrapper">
                        <a href="<?= $profileUrl ?>" class="nav-avatar-link" title="My Profile">
                            <?php if (!empty($_SESSION['user_photo'])): ?>
                                <img src="<?= get_relative_url($_SESSION['user_photo']) ?>" alt="Avatar" class="nav-avatar-img" />
                            <?php else: ?>
                                <div class="nav-avatar-placeholder"><?= strtoupper(substr($_SESSION['user_name'], 0, 1)) ?></div>
                            <?php endif; ?>
                            <span class="nav-username"><?= e(explode(' ', $_SESSION['user_name'])[0]) ?></span>
                        </a>
                    </div>
                    <a href="<?= $logoutUrl ?>" class="btn btn-secondary btn-nav-logout">Logout</a>
                <?php else: ?>
                    <!-- Guest state -->
                    <a href="<?= $loginUrl ?>" class="btn btn-secondary">Login</a>
                    <a href="<?= $registerUrl ?>" class="btn btn-primary">Register</a>
                <?php endif; ?>
            </nav>
        </div>
    </header>

    <!-- Page Content Main Wrapper -->
    <main class="main-content-layout">
        <?php
        // Dynamic Toast Notifications rendering from Session flash variables
        if (isset($_SESSION['success_message'])): ?>
            <script>
                window.addEventListener('DOMContentLoaded', () => {
                    showToast("<?= e($_SESSION['success_message']) ?>", 'success');
                });
            </script>
            <?php unset($_SESSION['success_message']);
        endif;

        if (isset($_SESSION['error_message'])): ?>
            <script>
                window.addEventListener('DOMContentLoaded', () => {
                    showToast("<?= e($_SESSION['error_message']) ?>", 'error');
                });
            </script>
            <?php unset($_SESSION['error_message']);
        endif;
        
        if (isset($_SESSION['auth_message'])): ?>
            <script>
                window.addEventListener('DOMContentLoaded', () => {
                    showToast("<?= e($_SESSION['auth_message']) ?>", 'info');
                });
            </script>
            <?php unset($_SESSION['auth_message']);
        endif;
        ?>
