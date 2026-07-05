<?php
/**
 * Smart Health - Global Configuration File
 */

// Prevent direct access
if (count(get_included_files()) === 1) {
    http_response_code(403);
    exit('Direct access not permitted.');
}

// Set timezone
date_default_timezone_set('Asia/Kolkata');

// Database Configuration
define('DB_HOST', '127.0.0.1');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'smart_health');

// Application Configuration
define('SITE_NAME', 'Smart Health');
define('SESSION_TIMEOUT', 1800); // 30 minutes in seconds

// Paths
define('ROOT_PATH', dirname(__DIR__));
define('UPLOAD_DIR', ROOT_PATH . '/uploads');
define('LOG_DIR', ROOT_PATH . '/logs');

// Session Settings
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.use_only_cookies', 1);

// Error Reporting (Development Mode: true, Production Mode: false)
define('DEV_MODE', true);
if (DEV_MODE) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Create critical folders if they don't exist
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}
if (!is_dir(LOG_DIR)) {
    mkdir(LOG_DIR, 0755, true);
}
