<?php
/**
 * Smart Health - Authentication, Sessions, CSRF, and RBAC Guard
 */

require_once __DIR__ . '/functions.php';

// Safe Session Start
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// 1. Inactivity Session Timeout Guard
if (isset($_SESSION['user_id'])) {
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > SESSION_TIMEOUT)) {
        // Logout due to timeout
        log_activity("Session timeout logout", $_SESSION['user_id']);
        logout_user();
        $_SESSION['auth_message'] = "You have been logged out due to inactivity.";
        header("Location: " . get_relative_url('pages/auth/login.php'));
        exit;
    }
    $_SESSION['last_activity'] = time();
}

// 2. Remember Me Auto-Login Handler
if (!isset($_SESSION['user_id']) && isset($_COOKIE['remember_me'])) {
    handle_remember_me_login();
}

/**
 * Handle Auto-login using Remember Me cookie
 */
function handle_remember_me_login() {
    global $db;
    
    $cookieValue = $_COOKIE['remember_me'] ?? '';
    if (strpos($cookieValue, ':') === false) {
        return;
    }
    
    list($selector, $validator) = explode(':', $cookieValue);
    
    try {
        $stmt = $db->prepare("SELECT rt.*, u.name, u.email, u.role, u.status, u.profile_photo FROM `remember_tokens` rt JOIN `users` u ON rt.user_id = u.id WHERE rt.selector = :selector AND rt.expires > NOW()");
        $stmt->execute([':selector' => $selector]);
        $tokenRow = $stmt->fetch();
        
        if ($tokenRow && hash_equals($tokenRow['token_hash'], hash('sha256', $validator))) {
            // Verify if user account is active
            if ($tokenRow['status'] === 'active') {
                // Log user in
                $_SESSION['user_id'] = $tokenRow['user_id'];
                $_SESSION['user_name'] = $tokenRow['name'];
                $_SESSION['user_email'] = $tokenRow['email'];
                $_SESSION['user_role'] = $tokenRow['role'];
                $_SESSION['user_photo'] = $tokenRow['profile_photo'];
                $_SESSION['last_activity'] = time();
                
                // Regenerate session ID for security
                session_regenerate_id(true);
                
                log_activity("Logged in via Remember Me cookie", $tokenRow['user_id']);
            }
        } else {
            // Expired or invalid token, clean it
            setcookie('remember_me', '', time() - 3600, '/', '', false, true);
        }
    } catch (PDOException $e) {
        log_system_error("Remember me check failed: " . $e->getMessage(), 'REMEMBER_ME');
    }
}

/**
 * Perform secure login operations
 */
function login_user($userRow, $remember = false) {
    global $db;
    
    $_SESSION['user_id'] = $userRow['id'];
    $_SESSION['user_name'] = $userRow['name'];
    $_SESSION['user_email'] = $userRow['email'];
    $_SESSION['user_role'] = $userRow['role'];
    $_SESSION['user_photo'] = $userRow['profile_photo'];
    $_SESSION['last_activity'] = time();
    
    // Regenerate session ID to prevent Session Fixation
    session_regenerate_id(true);
    
    log_activity("User login success", $userRow['id']);
    
    // If remember me is checked
    if ($remember) {
        $selector = bin2hex(random_bytes(12));
        $validator = bin2hex(random_bytes(32));
        $tokenHash = hash('sha256', $validator);
        
        // Cookie expires in 30 days
        $expires = date('Y-m-d H:i:s', time() + (30 * 24 * 60 * 60));
        
        try {
            $stmt = $db->prepare("INSERT INTO `remember_tokens` (`user_id`, `selector`, `token_hash`, `expires`) VALUES (:user_id, :selector, :token_hash, :expires)");
            $stmt->execute([
                ':user_id' => $userRow['id'],
                ':selector' => $selector,
                ':token_hash' => $tokenHash,
                ':expires' => $expires
            ]);
            
            // Set remember me cookie (HttpOnly, secure, SameSite)
            setcookie('remember_me', "$selector:$validator", time() + (30 * 24 * 60 * 60), '/', '', false, true);
        } catch (PDOException $e) {
            log_system_error("Failed to store remember token: " . $e->getMessage(), 'AUTH');
        }
    }
}

/**
 * Perform logout operations
 */
function logout_user() {
    global $db;
    
    // Remove database remember tokens
    if (isset($_SESSION['user_id'])) {
        try {
            $stmt = $db->prepare("DELETE FROM `remember_tokens` WHERE `user_id` = :user_id");
            $stmt->execute([':user_id' => $_SESSION['user_id']]);
        } catch (PDOException $e) {
            log_system_error("Failed to delete remember tokens on logout: " . $e->getMessage(), 'AUTH');
        }
    }
    
    // Unset all session variables
    $_SESSION = [];
    
    // Destroy session cookie
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    
    // Clear remember me cookie
    setcookie('remember_me', '', time() - 3600, '/', '', false, true);
    
    // Destroy session
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

/**
 * Access Check: Requires user to be logged in
 */
function require_login() {
    if (!isset($_SESSION['user_id'])) {
        $_SESSION['auth_message'] = "Please log in to access this page.";
        header("Location: " . get_relative_url('pages/auth/login.php'));
        exit;
    }
}

/**
 * Access Check: Requires user to have specific roles
 */
function require_role($allowedRoles = []) {
    require_login();
    
    $role = $_SESSION['user_role'] ?? 'patient';
    if (!in_array($role, $allowedRoles)) {
        log_activity("Access violation attempt: tried accessing restricted page. Role: $role");
        
        $_SESSION['error_message'] = "Unauthorized access. You do not have permissions for that page.";
        header("Location: " . get_relative_url('index.php'));
        exit;
    }
}

/**
 * CSRF protection: Generate CSRF token
 */
function generate_csrf_token() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * CSRF protection: Verify CSRF token
 */
function verify_csrf_token($token) {
    if (!isset($_SESSION['csrf_token']) || empty($token)) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * CSRF html form field helper
 */
function csrf_field() {
    $token = generate_csrf_token();
    return '<input type="hidden" name="csrf_token" value="' . e($token) . '" />';
}

/**
 * Resolve relative paths for dynamic routing across folders
 */
function get_relative_url($targetPath) {
    // Current URI path
    $currentPath = $_SERVER['SCRIPT_NAME'];
    $depth = substr_count(trim($currentPath, '/'), '/');
    
    // Determine path back to root
    $backPath = '';
    // If the path includes pages, we need to adjust
    if (strpos($currentPath, '/pages/auth/') !== false) {
        $backPath = '../../';
    } elseif (strpos($currentPath, '/pages/dashboard/') !== false) {
        $backPath = '../../';
    } elseif (strpos($currentPath, '/pages/') !== false) {
        $backPath = '../';
    }
    
    return $backPath . $targetPath;
}
