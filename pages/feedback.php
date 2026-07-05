<?php
/**
 * Smart Health - Patient Feedback Page
 */

$pageTitle = "Patient Feedback";
$pageDesc = "Share your clinical experience. Help us improve healthcare facilities across nodes.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

$errorMessage = "";
$successMessage = "";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // CSRF verification
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please refresh and try again.";
    } else {
        $name = trim($_POST['name'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $rating = trim($_POST['rating'] ?? '5');
        $message = trim($_POST['message'] ?? '');
        
        // Server-side validation
        if (is_blank($name) || is_blank($email) || is_blank($message)) {
            $errorMessage = "Please fill in all required fields.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errorMessage = "Please enter a valid email address.";
        } else {
            try {
                $subject = "Rating: " . $rating . " Stars";
                $stmt = $GLOBALS['db']->prepare("INSERT INTO `contact_feedback` (`name`, `email`, `form_type`, `subject`, `message`) VALUES (:name, :email, 'feedback', :subject, :message)");
                $stmt->execute([
                    ':name' => $name,
                    ':email' => $email,
                    ':subject' => $subject,
                    ':message' => $message
                ]);
                
                // Add notification to Admin
                $adminIdStmt = $GLOBALS['db']->query("SELECT `id` FROM `users` WHERE `role` = 'admin' LIMIT 1");
                $adminId = $adminIdStmt->fetchColumn();
                if ($adminId) {
                    add_notification($adminId, "⭐ New Patient Feedback from " . e($name) . " (" . e($rating) . "/5 stars)");
                }
                
                log_activity("Submitted patient feedback rating: $rating");
                
                $successMessage = "Thank you for sharing your feedback. We review all patient experiences to upgrade care delivery.";
                
                // Clear fields
                $name = $email = $message = "";
            } catch (PDOException $e) {
                log_system_error("Failed to save feedback: " . $e->getMessage());
                $errorMessage = "A server error occurred. Please try again later.";
            }
        }
    }
}
?>

<div class="container" style="padding: 4rem 0; max-width: 600px;">
    <div class="page-header" style="text-align: center; margin-bottom: 3.5rem;">
        <p class="eyebrow">Patient Voice</p>
        <h1>Submit Feedback</h1>
        <p class="auth-subtitle">Help us measure doctor attendance, ward bed conditions, and pharmacist response rates.</p>
    </div>
    
    <div class="card" style="padding: 3rem;">
        <h3>Feedback Form</h3>
        
        <?php if (!empty($errorMessage)): ?>
            <div class="auth-message auth-message-error" style="margin-top: 1rem;"><?= e($errorMessage) ?></div>
        <?php endif; ?>
        
        <?php if (!empty($successMessage)): ?>
            <div class="auth-message" style="margin-top: 1rem;"><?= e($successMessage) ?></div>
        <?php endif; ?>
        
        <form action="feedback.php" method="post" class="auth-form" style="margin-top: 1.5rem;">
            <?= csrf_field() ?>
            
            <label>
                Full Name
                <input type="text" name="name" value="<?= isset($name) ? e($name) : '' ?>" placeholder="Your name" required />
            </label>
            
            <label>
                Email Address
                <input type="email" name="email" value="<?= isset($email) ? e($email) : '' ?>" placeholder="you@example.com" required />
            </label>
            
            <label>
                Experience Rating
                <select name="rating">
                    <option value="5" selected>⭐⭐⭐⭐⭐ (Excellent Care)</option>
                    <option value="4">⭐⭐⭐⭐ (Good Care)</option>
                    <option value="3">⭐⭐⭐ (Average Care)</option>
                    <option value="2">⭐⭐ (Needs Improvement)</option>
                    <option value="1">⭐ (Unsatisfactory)</option>
                </select>
            </label>
            
            <label>
                Share your Experience
                <textarea name="message" rows="5" placeholder="Let us know how we did. Mention doctor name, bed hygiene, or medicine stock availability if relevant..." required><?= isset($message) ? e($message) : '' ?></textarea>
            </label>
            
            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Submit Feedback</button>
        </form>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
