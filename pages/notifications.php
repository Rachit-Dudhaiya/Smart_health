<?php
/**
 * Smart Health - Notifications Panel
 */

$pageTitle = "My Notifications";
$pageDesc = "Check clinical alerts, appointment reminders, and low-stock alerts.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

require_login();

$userId = $_SESSION['user_id'];
$errorMessage = "";
$successMessage = "";

// Handle POST actions
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired.";
    } else {
        $action = $_POST['action'];
        
        // Action 1: Mark All as Read
        if ($action === 'mark_all_read') {
            try {
                $stmt = $GLOBALS['db']->prepare("UPDATE `notifications` SET `is_read` = 1 WHERE `user_id` = :user_id");
                $stmt->execute([':user_id' => $userId]);
                $_SESSION['success_message'] = "All notifications marked as read.";
                header("Location: notifications.php");
                exit;
            } catch (PDOException $e) {
                log_system_error("Failed to mark all notifications read: " . $e->getMessage());
                $errorMessage = "A server error occurred.";
            }
        }
        
        // Action 2: Mark Individual as Read
        elseif ($action === 'mark_read') {
            $notifId = intval($_POST['notif_id'] ?? 0);
            try {
                $stmt = $GLOBALS['db']->prepare("UPDATE `notifications` SET `is_read` = 1 WHERE `id` = :id AND `user_id` = :user_id");
                $stmt->execute([':id' => $notifId, ':user_id' => $userId]);
                $_SESSION['success_message'] = "Notification marked as read.";
                header("Location: notifications.php");
                exit;
            } catch (PDOException $e) {
                log_system_error("Failed to mark notification read: " . $e->getMessage());
                $errorMessage = "A server error occurred.";
            }
        }
        
        // Action 3: Delete Notification
        elseif ($action === 'delete_notif') {
            $notifId = intval($_POST['notif_id'] ?? 0);
            try {
                $stmt = $GLOBALS['db']->prepare("DELETE FROM `notifications` WHERE `id` = :id AND `user_id` = :user_id");
                $stmt->execute([':id' => $notifId, ':user_id' => $userId]);
                $_SESSION['success_message'] = "Notification deleted.";
                header("Location: notifications.php");
                exit;
            } catch (PDOException $e) {
                log_system_error("Failed to delete notification: " . $e->getMessage());
                $errorMessage = "A server error occurred.";
            }
        }
    }
}

// Pagination setup
$itemsPerPage = 10;
$currentPage = intval($_GET['page'] ?? 1);
if ($currentPage < 1) $currentPage = 1;
$offset = ($currentPage - 1) * $itemsPerPage;

$notifications = [];
$totalPages = 0;

try {
    // Count total items
    $cntStmt = $GLOBALS['db']->prepare("SELECT COUNT(*) FROM `notifications` WHERE `user_id` = :user_id");
    $cntStmt->execute([':user_id' => $userId]);
    $totalItems = $cntStmt->fetchColumn();
    $totalPages = ceil($totalItems / $itemsPerPage);
    
    // Fetch items
    $stmt = $GLOBALS['db']->prepare("SELECT * FROM `notifications` WHERE `user_id` = :user_id ORDER BY `created_at` DESC LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $itemsPerPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $notifications = $stmt->fetchAll();
    
} catch (PDOException $e) {
    log_system_error("Failed to fetch user notifications: " . $e->getMessage());
    $errorMessage = "A database error occurred while fetching notifications.";
}
?>

<div class="container" style="padding: 4rem 0; max-width: 800px;">
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <div>
            <p class="eyebrow">User Alerts</p>
            <h1>My Notifications</h1>
        </div>
        
        <?php if (count($notifications) > 0): ?>
            <form action="notifications.php" method="post">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="mark_all_read" />
                <button type="submit" class="btn btn-secondary">Mark All as Read</button>
            </form>
        <?php endif; ?>
    </div>
    
    <?php if (!empty($errorMessage)): ?>
        <div class="auth-message auth-message-error" style="margin-bottom: 1.5rem;"><?= e($errorMessage) ?></div>
    <?php endif; ?>
    
    <?php if (count($notifications) > 0): ?>
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <?php foreach ($notifications as $notif): ?>
                <div class="card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; border-left: 5px solid <?= $notif['is_read'] ? 'var(--color-border)' : 'var(--color-primary)' ?>;">
                    <div style="flex: 1; padding-right: 1.5rem;">
                        <p style="color: var(--color-text-main); font-weight: <?= $notif['is_read'] ? '500' : '700' ?>; font-size: 0.95rem;">
                            <?= e($notif['message']) ?>
                        </p>
                        <span style="font-size: 0.75rem; color: var(--color-text-muted); display: block; margin-top: 0.4rem;">
                            🕒 <?= format_datetime($notif['created_at']) ?>
                        </span>
                    </div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <?php if (!$notif['is_read']): ?>
                            <form action="notifications.php" method="post">
                                <?= csrf_field() ?>
                                <input type="hidden" name="action" value="mark_read" />
                                <input type="hidden" name="notif_id" value="<?= intval($notif['id']) ?>" />
                                <button type="submit" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" title="Mark as Read">✓</button>
                            </form>
                        <?php endif; ?>
                        
                        <form action="notifications.php" method="post">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="delete_notif" />
                            <input type="hidden" name="notif_id" value="<?= intval($notif['id']) ?>" />
                            <button type="submit" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-color: var(--color-danger); color: var(--color-danger);" title="Delete" onclick="return confirm('Are you sure you want to delete this notification?');">&times;</button>
                        </form>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
        
        <div style="margin-top: 2rem; display: flex; justify-content: center;">
            <?= render_pagination($totalPages, $currentPage, 'notifications.php?page={page}') ?>
        </div>
        
    <?php else: ?>
        <div class="card" style="text-align: center; padding: 4rem 2rem;">
            <p class="auth-subtitle">No notifications found.</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem;">You are all caught up! Clinical updates or doctor shift changes will appear here.</p>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
