<?php
/**
 * Smart Health - Forgot Password Request
 */

$pageTitle = "Forgot Password";
$pageDesc = "Recover your Smart Health account credentials.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

$message = "";
$errorMessage = "";
$resetLink = ""; // Dev helper link

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please refresh.";
    } else {
        $email = trim($_POST['email'] ?? '');
        
        if (is_blank($email)) {
            $errorMessage = "Please enter your registered email address.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errorMessage = "Please enter a valid email address.";
        } else {
            try {
                // Fetch user
                $stmt = $GLOBALS['db']->prepare("SELECT * FROM `users` WHERE `email` = :email LIMIT 1");
                $stmt->execute([':email' => $email]);
                $user = $stmt->fetch();
                
                // Set uniform notice to prevent account mining
                $message = "If this email matches an active account, password recovery instructions have been prepared.";
                
                if ($user) {
                    // Generate secure token
                    $token = bin2hex(random_bytes(32));
                    $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour expiration
                    
                    // Update user record
                    $updateStmt = $GLOBALS['db']->prepare("UPDATE `users` SET `reset_token` = :token, `reset_token_expires` = :expires WHERE `id` = :id");
                    $updateStmt->execute([
                        ':token' => $token,
                        ':expires' => $expires,
                        ':id' => $user['id']
                    ]);
                    
                    log_activity("Forgot password token requested", $user['id']);
                    
                    // Since local SMTP is usually not configured, output link on screen for development testing
                    if (DEV_MODE) {
                        $resetLink = 'reset-password.php?token=' . $token;
                    }
                }
            } catch (PDOException $e) {
                log_system_error("Failed to generate password token: " . $e->getMessage(), 'FORGOT_PASS');
                $errorMessage = "A server error occurred. Please try again later.";
            }
        }
    }
}
?>

<div class="container auth-shell">
    <div class="auth-card">
        <p class="eyebrow">Recovery</p>
        <h1>Forgot Password?</h1>
        <p class="auth-subtitle">Enter your registered email address and we will generate a recovery link.</p>
        
        <?php if (!empty($errorMessage)): ?>
            <div class="auth-message auth-message-error"><?= e($errorMessage) ?></div>
        <?php endif; ?>
        
        <?php if (!empty($message)): ?>
            <div class="auth-message"><?= e($message) ?></div>
        <?php endif; ?>
        
        <?php if (!empty($resetLink)): ?>
            <div class="auth-message" style="background-color: #fef3c7; color: #92400e; border: 1px solid #f59e0b; text-align: left;">
                ⚙️ <strong>DEV_MODE HELPER</strong>:<br/>
                We detected local environment setup. Here is the reset link:<br/>
                <a href="<?= e($resetLink) ?>" style="font-weight: 700; text-decoration: underline; color: #b45309;">Reset Password Link</a>
            </div>
        <?php endif; ?>
        
        <form action="forgot-password.php" method="post" class="auth-form">
            <?= csrf_field() ?>
            
            <label>
                Email Address
                <input type="email" name="email" placeholder="you@example.com" required autofocus />
            </label>
            
            <button class="btn btn-primary btn-full" type="submit">Request Reset Link</button>
        </form>
        
        <p class="auth-link"><a href="login.php">Back to Login</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
