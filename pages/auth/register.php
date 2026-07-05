<?php
/**
 * Smart Health - Secure Registration Handler
 */

$pageTitle = "Register";
$pageDesc = "Create a free Smart Health account. Set up your node as patient, doctor, admin, or pharmacist.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header("Location: " . get_relative_url('index.php'));
    exit;
}

$errorMessage = "";
$name = "";
$email = "";
$role = "patient";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // 1. CSRF Verification
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please refresh and try again.";
    } else {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        $role = trim($_POST['role'] ?? 'patient');
        
        // Allowed roles validation
        $allowedRoles = ['patient', 'doctor', 'pharmacist', 'admin'];
        
        // Server-side validation
        if (is_blank($name) || is_blank($email) || is_blank($password) || is_blank($confirmPassword)) {
            $errorMessage = "Please fill in all fields.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errorMessage = "Please enter a valid email address.";
        } elseif (strlen($password) < 8) {
            $errorMessage = "Password must be at least 8 characters long.";
        } elseif ($password !== $confirmPassword) {
            $errorMessage = "Passwords do not match.";
        } elseif (!in_array($role, $allowedRoles)) {
            $errorMessage = "Invalid user role selected.";
        } else {
            try {
                // 2. Check if email exists
                $stmt = $GLOBALS['db']->prepare("SELECT COUNT(*) FROM `users` WHERE `email` = :email");
                $stmt->execute([':email' => $email]);
                if ($stmt->fetchColumn() > 0) {
                    $errorMessage = "This email address is already registered.";
                } else {
                    // 3. Register user
                    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $GLOBALS['db']->prepare("INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `status`) VALUES (:name, :email, :password_hash, :role, 'active')");
                    $stmt->execute([
                        ':name' => $name,
                        ':email' => $email,
                        ':password_hash' => $passwordHash,
                        ':role' => $role
                    ]);
                    
                    $newUserId = $GLOBALS['db']->lastInsertId();
                    log_activity("New user registration. Email: $email", $newUserId);
                    
                    // Welcome Notification
                    add_notification($newUserId, "🎉 Welcome to Smart Health, " . e($name) . "! Explore your dynamic dashboard.");
                    
                    $_SESSION['success_message'] = "Registration successful. Please login below.";
                    header("Location: login.php");
                    exit;
                }
            } catch (PDOException $e) {
                log_system_error("Registration database error: " . $e->getMessage(), 'REGISTER');
                $errorMessage = "A server error occurred. Please try again later.";
            }
        }
    }
}
?>

<div class="container auth-shell">
    <div class="auth-card" style="width: min(520px, 100%);">
        <p class="eyebrow">Create Account</p>
        <h1>Join Smart Health</h1>
        <p class="auth-subtitle">Get started with secure database and analytics tracking.</p>
        
        <?php if (!empty($errorMessage)): ?>
            <div class="auth-message auth-message-error"><?= e($errorMessage) ?></div>
        <?php endif; ?>
        
        <form action="register.php" method="post" class="auth-form">
            <?= csrf_field() ?>
            
            <label>
                Full Name
                <input type="text" name="name" value="<?= e($name) ?>" placeholder="e.g. Sunita Devi" required />
            </label>
            
            <label>
                Email Address
                <input type="email" name="email" value="<?= e($email) ?>" placeholder="you@example.com" required />
            </label>
            
            <label>
                Password (Min 8 characters)
                <input type="password" name="password" placeholder="••••••••" required minlength="8" />
            </label>
            
            <label>
                Confirm Password
                <input type="password" name="confirm_password" placeholder="••••••••" required minlength="8" />
            </label>
            
            <label>
                System Role Type
                <select name="role">
                    <option value="patient" <?= $role === 'patient' ? 'selected' : '' ?>>Patient / Citizen</option>
                    <option value="doctor" <?= $role === 'doctor' ? 'selected' : '' ?>>Doctor / Physician</option>
                    <option value="pharmacist" <?= $role === 'pharmacist' ? 'selected' : '' ?>>Pharmacist Staff</option>
                    <option value="admin" <?= $role === 'admin' ? 'selected' : '' ?>>System Administrator</option>
                </select>
            </label>
            
            <button class="btn btn-primary btn-full" type="submit" style="margin-top: 0.5rem;">Register Now</button>
        </form>
        
        <p class="auth-link">Already registered? <a href="login.php">Login here</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>