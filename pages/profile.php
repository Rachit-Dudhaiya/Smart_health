<?php
/**
 * Smart Health - User Profile Management
 */

$pageTitle = "My Profile";
$pageDesc = "Update your profile details, change password, or upload a professional avatar.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

require_login();

$userId = $_SESSION['user_id'];
$errorMessage = "";
$successMessage = "";
$user = null;

// Fetch fresh details from DB
try {
    $stmt = $GLOBALS['db']->prepare("SELECT * FROM `users` WHERE `id` = :id LIMIT 1");
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    
    if (!$user) {
        logout_user();
        header("Location: auth/login.php");
        exit;
    }
} catch (PDOException $e) {
    log_system_error("Failed to fetch profile: " . $e->getMessage());
    die("A database error occurred.");
}

// Form Actions Handling
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    // 1. CSRF Verification
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please retry.";
    } else {
        $action = $_POST['action'];
        
        // ACTION A: Update Profile Details
        if ($action === 'update_details') {
            $name = trim($_POST['name'] ?? '');
            $email = trim($_POST['email'] ?? '');
            
            if (is_blank($name) || is_blank($email)) {
                $errorMessage = "Name and Email are required.";
            } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errorMessage = "Please enter a valid email address.";
            } else {
                try {
                    // Check if email is already taken by someone else
                    $chkStmt = $GLOBALS['db']->prepare("SELECT COUNT(*) FROM `users` WHERE `email` = :email AND `id` != :id");
                    $chkStmt->execute([':email' => $email, ':id' => $userId]);
                    if ($chkStmt->fetchColumn() > 0) {
                        $errorMessage = "This email address is already taken by another user.";
                    } else {
                        // Update
                        $updStmt = $GLOBALS['db']->prepare("UPDATE `users` SET `name` = :name, `email` = :email WHERE `id` = :id");
                        $updStmt->execute([':name' => $name, ':email' => $email, ':id' => $userId]);
                        
                        $_SESSION['user_name'] = $name;
                        $_SESSION['user_email'] = $email;
                        
                        log_activity("Updated profile details");
                        $successMessage = "Profile details updated successfully.";
                        
                        // Reload
                        header("Location: profile.php");
                        exit;
                    }
                } catch (PDOException $e) {
                    log_system_error("Profile update DB error: " . $e->getMessage());
                    $errorMessage = "Could not update details. System error.";
                }
            }
        }
        
        // ACTION B: Change Password
        elseif ($action === 'change_password') {
            $currentPassword = $_POST['current_password'] ?? '';
            $newPassword = $_POST['new_password'] ?? '';
            $confirmPassword = $_POST['confirm_password'] ?? '';
            
            if (is_blank($currentPassword) || is_blank($newPassword) || is_blank($confirmPassword)) {
                $errorMessage = "All password fields are required.";
            } elseif (strlen($newPassword) < 8) {
                $errorMessage = "New password must be at least 8 characters long.";
            } elseif ($newPassword !== $confirmPassword) {
                $errorMessage = "New passwords do not match.";
            } else {
                // Verify current password
                if (password_verify($currentPassword, $user['password_hash'])) {
                    try {
                        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
                        $pwStmt = $GLOBALS['db']->prepare("UPDATE `users` SET `password_hash` = :hash WHERE `id` = :id");
                        $pwStmt->execute([':hash' => $newHash, ':id' => $userId]);
                        
                        log_activity("Changed account password");
                        add_notification($userId, "🔑 Your account password was changed successfully.");
                        $successMessage = "Password updated successfully.";
                    } catch (PDOException $e) {
                        log_system_error("Password change DB error: " . $e->getMessage());
                        $errorMessage = "Could not update password.";
                    }
                } else {
                    $errorMessage = "Current password is incorrect.";
                }
            }
        }
        
        // ACTION C: Upload Avatar Photo
        elseif ($action === 'upload_photo') {
            if (isset($_FILES['profile_photo'])) {
                $uploadResult = upload_profile_photo($_FILES['profile_photo'], $userId);
                
                if ($uploadResult['success']) {
                    $webPath = $uploadResult['path'];
                    try {
                        // Update DB
                        $avStmt = $GLOBALS['db']->prepare("UPDATE `users` SET `profile_photo` = :photo WHERE `id` = :id");
                        $avStmt->execute([':photo' => $webPath, ':id' => $userId]);
                        
                        // Update Session
                        $_SESSION['user_photo'] = $webPath;
                        
                        // Delete old profile image file if exists
                        if (!empty($user['profile_photo']) && file_exists(ROOT_PATH . '/' . $user['profile_photo'])) {
                            @unlink(ROOT_PATH . '/' . $user['profile_photo']);
                        }
                        
                        log_activity("Updated profile picture");
                        $successMessage = "Profile photo updated successfully.";
                        
                        header("Location: profile.php");
                        exit;
                    } catch (PDOException $e) {
                        log_system_error("Failed to update profile photo in DB: " . $e->getMessage());
                        $errorMessage = "File uploaded, but database sync failed.";
                    }
                } else {
                    $errorMessage = $uploadResult['message'];
                }
            } else {
                $errorMessage = "No file was selected.";
            }
        }
    }
}
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 3.5rem;">
        <p class="eyebrow">Settings</p>
        <h1>Manage Profile</h1>
        <p class="auth-subtitle">Update user credentials, profile pictures, and password credentials.</p>
    </div>
    
    <?php if (!empty($errorMessage)): ?>
        <div class="auth-message auth-message-error" style="max-width: 800px; margin: 0 auto 1.5rem;"><?= e($errorMessage) ?></div>
    <?php endif; ?>
    
    <?php if (!empty($successMessage)): ?>
        <div class="auth-message" style="max-width: 800px; margin: 0 auto 1.5rem;"><?= e($successMessage) ?></div>
    <?php endif; ?>
    
    <div class="profile-shell" style="max-width: 900px; margin: 0 auto;">
        
        <!-- Sidebar Profile Card -->
        <div class="profile-avatar-card">
            <div class="profile-photo-wrap">
                <?php if (!empty($user['profile_photo'])): ?>
                    <img src="<?= get_relative_url($user['profile_photo']) ?>" alt="Avatar" class="profile-photo-img" />
                <?php else: ?>
                    <div class="profile-avatar-placeholder"><?= strtoupper(substr($user['name'], 0, 1)) ?></div>
                <?php endif; ?>
            </div>
            
            <h3><?= e($user['name']) ?></h3>
            <p class="badge badge-info" style="margin-top: 0.5rem;"><?= ucfirst(e($user['role'])) ?></p>
            <p style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.8rem;">Registered since: <?= date('d M Y', strtotime($user['created_at'])) ?></p>
            
            <!-- Upload Photo Form -->
            <form action="profile.php" method="post" enctype="multipart/form-data" class="auth-form" style="margin-top: 2rem; width: 100%;">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="upload_photo" />
                <label style="align-items: center; cursor: pointer; text-align: center; border: 1px dashed var(--color-border); padding: 1rem; border-radius: var(--radius-md); background-color: var(--bg-primary);">
                    <span>📁 Choose Image</span>
                    <input type="file" name="profile_photo" accept="image/jpeg, image/png, image/webp" style="display: none;" onchange="this.form.submit()" />
                </label>
            </form>
        </div>
        
        <!-- Edit Profile Details & Password -->
        <div style="display: flex; flex-direction: column; gap: 2rem;">
            
            <!-- Card 1: Details -->
            <div class="card" style="padding: 2.5rem;">
                <h3>Personal Information</h3>
                <form action="profile.php" method="post" class="auth-form" style="margin-top: 1.5rem;">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="update_details" />
                    
                    <label>
                        Full Name
                        <input type="text" name="name" value="<?= e($user['name']) ?>" required />
                    </label>
                    
                    <label>
                        Email Address
                        <input type="email" name="email" value="<?= e($user['email']) ?>" required />
                    </label>
                    
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Save Details</button>
                </form>
            </div>
            
            <!-- Card 2: Password -->
            <div class="card" style="padding: 2.5rem;">
                <h3>Change Password</h3>
                <form action="profile.php" method="post" class="auth-form" style="margin-top: 1.5rem;">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="change_password" />
                    
                    <label>
                        Current Password
                        <input type="password" name="current_password" placeholder="••••••••" required />
                    </label>
                    
                    <label>
                        New Password (Min 8 characters)
                        <input type="password" name="new_password" placeholder="••••••••" required minlength="8" />
                    </label>
                    
                    <label>
                        Confirm New Password
                        <input type="password" name="confirm_password" placeholder="••••••••" required minlength="8" />
                    </label>
                    
                    <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Change Password</button>
                </form>
            </div>
            
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
