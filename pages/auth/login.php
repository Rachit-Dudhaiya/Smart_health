<?php
/**
 * Smart Health - Secure Login Handler
 */

$pageTitle = "Login";
$pageDesc = "Sign in to access your healthcare dashboard, check stock levels, bed availability, or doctor attendance.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header("Location: " . get_relative_url('index.php'));
    exit;
}

$errorMessage = "";
$email = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. CSRF Verification
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please refresh and try again.";
    } else {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $remember = isset($_POST['remember']);
        
        if (is_blank($email) || is_blank($password)) {
            $errorMessage = "Please enter both email and password.";
        } else {
            try {
                // 2. Fetch User by Email (Prepared statement)
                $stmt = $GLOBALS['db']->prepare("SELECT * FROM `users` WHERE `email` = :email LIMIT 1");
                $stmt->execute([':email' => $email]);
                $user = $stmt->fetch();
                
                // 3. Verify Password Hash
                if ($user && password_verify($password, $user['password_hash'])) {
                    // Check status
                    if ($user['status'] === 'suspended') {
                        $errorMessage = "Your account has been suspended. Please contact support.";
                    } else {
                        // Perform session login
                        login_user($user, $remember);
                        $_SESSION['success_message'] = "Welcome back, " . $user['name'] . "!";
                        
                        // Redirect to specific dashboard
                        $dashboardPath = 'pages/dashboard/patient.php';
                        if ($user['role'] === 'admin') $dashboardPath = 'pages/dashboard/admin.php';
                        elseif ($user['role'] === 'doctor') $dashboardPath = 'pages/dashboard/doctor.php';
                        elseif ($user['role'] === 'pharmacist') $dashboardPath = 'pages/dashboard/pharmacist.php';
                        
                        header("Location: " . get_relative_url($dashboardPath));
                        exit;
                    }
                } else {
                    // Generic warning to prevent user enumeration
                    $errorMessage = "Invalid email or password.";
                    log_activity("Failed login attempt. Email: $email");
                }
            } catch (PDOException $e) {
                log_system_error("Login database execution error: " . $e->getMessage(), 'LOGIN');
                $errorMessage = "A system error occurred. Please try again later.";
            }
        }
    }
}
?>

<div class="container auth-shell">
    <div class="auth-card">
        <p class="eyebrow">Secure Access</p>
        <h1>Welcome Back</h1>
        <p class="auth-subtitle">Sign in to check clinic stocks, ward vacancies, and doctor coverage.</p>
        
        <?php if (!empty($errorMessage)): ?>
            <div class="auth-message auth-message-error"><?= e($errorMessage) ?></div>
        <?php endif; ?>
        
        <form action="login.php" method="post" class="auth-form">
            <?= csrf_field() ?>
            
            <label>
                Email Address
                <input type="email" name="email" value="<?= e($email) ?>" placeholder="you@example.com" required autofocus />
            </label>
            
            <label>
                Password
                <input type="password" name="password" placeholder="••••••••" required />
            </label>
            
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <label style="flex-direction: row; gap: 0.5rem; cursor: pointer; align-items: center;">
                    <input type="checkbox" name="remember" style="width: auto;" /> Remember me
                </label>
                <a href="forgot-password.php" style="font-size: 0.85rem; color: var(--color-primary); font-weight: 600;">Forgot Password?</a>
            </div>
            
            <button class="btn btn-primary btn-full" type="submit">Sign In</button>
        </form>
        
        <p class="auth-link">New to Smart Health? <a href="register.php">Create an Account</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>