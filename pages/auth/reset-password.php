<?php
/**
 * Smart Health - Reset Password Handler
 */

$pageTitle = "Reset Password";
$pageDesc = "Set a new password for your Smart Health account.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

$errorMessage = "";
$successMessage = "";
$token = trim($_GET['token'] ?? $_POST['token'] ?? '');
$validToken = false;
$userRow = null;

if (empty($token)) {
    $errorMessage = "Token is missing or invalid.";
} else {
    try {
        // Fetch user with matching unexpired token
        $stmt = $GLOBALS['db']->prepare("SELECT * FROM `users` WHERE `reset_token` = :token AND `reset_token_expires` > NOW() LIMIT 1");
        $stmt->execute([':token' => $token]);
        $userRow = $stmt->fetch();
        
        if ($userRow) {
            $validToken = true;
        } else {
            $errorMessage = "The reset link is invalid or has expired. Please request a new one.";
        }
    } catch (PDOException $e) {
        log_system_error("Error verifying reset token: " . $e->getMessage(), 'RESET_PASS');
        $errorMessage = "A server error occurred. Please try again.";
    }
}

// Handle Form Submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $validToken) {
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please retry.";
    } else {
        $password = $_POST['password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        
        if (is_blank($password) || is_blank($confirmPassword)) {
            $errorMessage = "Please enter both password fields.";
        } elseif (strlen($password) < 8) {
            $errorMessage = "Password must be at least 8 characters long.";
        } elseif ($password !== $confirmPassword) {
            $errorMessage = "Passwords do not match.";
        } else {
            try {
                // Update password and clear reset token
                $passwordHash = password_hash($password, PASSWORD_DEFAULT);
                $updateStmt = $GLOBALS['db']->prepare("UPDATE `users` SET `password_hash` = :password_hash, `reset_token` = NULL, `reset_token_expires` = NULL WHERE `id` = :id");
                $updateStmt->execute([
                    ':password_hash' => $passwordHash,
                    ':id' => $userRow['id']
                ]);
                
                log_activity("Password successfully reset via recovery token", $userRow['id']);
                
                // Add notification
                add_notification($userRow['id'], "🔒 Your account password was successfully reset.");
                
                $_SESSION['success_message'] = "Password reset successful. Please login with your new credentials.";
                header("Location: login.php");
                exit;
            } catch (PDOException $e) {
                log_system_error("Failed to reset password: " . $e->getMessage(), 'RESET_PASS');
                $errorMessage = "A server error occurred. Please try again.";
            }
        }
    }
}
?>

<div class="container auth-shell">
    <div class="auth-card">
        <p class="eyebrow">Credentials</p>
        <h1>Reset Password</h1>
        <p class="auth-subtitle">Choose a strong, unique password to secure your medical records.</p>
        
        <?php if (!empty($errorMessage)): ?>
            <div class="auth-message auth-message-error"><?= e($errorMessage) ?></div>
        <?php endif; ?>
        
        <?php if ($validToken): ?>
            <form action="reset-password.php" method="post" class="auth-form">
                <?= csrf_field() ?>
                <input type="hidden" name="token" value="<?= e($token) ?>" />
                
                <label>
                    New Password (Min 8 chars)
                    <input type="password" name="password" placeholder="••••••••" required minlength="8" autofocus />
                </label>
                
                <label>
                    Confirm New Password
                    <input type="password" name="confirm_password" placeholder="••••••••" required minlength="8" />
                </label>
                
                <button class="btn btn-primary btn-full" type="submit">Update Password</button>
            </form>
        <?php endif; ?>
        
        <p class="auth-link"><a href="login.php">Back to Login</a></p>
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
