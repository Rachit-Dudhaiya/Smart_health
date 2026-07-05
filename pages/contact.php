<?php
/**
 * Smart Health - Contact Page
 */

$pageTitle = "Contact Support";
$pageDesc = "Reach out to the Smart Health help desk. Send us questions, feedback, or report operational issues.";

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
        $subject = trim($_POST['subject'] ?? '');
        $message = trim($_POST['message'] ?? '');
        
        // Server-side validation
        if (is_blank($name) || is_blank($email) || is_blank($subject) || is_blank($message)) {
            $errorMessage = "All fields are required.";
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errorMessage = "Please enter a valid email address.";
        } else {
            try {
                $stmt = $GLOBALS['db']->prepare("INSERT INTO `contact_feedback` (`name`, `email`, `form_type`, `subject`, `message`) VALUES (:name, :email, 'contact', :subject, :message)");
                $stmt->execute([
                    ':name' => $name,
                    ':email' => $email,
                    ':subject' => $subject,
                    ':message' => $message
                ]);
                
                // Add notification to System Admin
                // Fetch first admin id
                $adminIdStmt = $GLOBALS['db']->query("SELECT `id` FROM `users` WHERE `role` = 'admin' LIMIT 1");
                $adminId = $adminIdStmt->fetchColumn();
                if ($adminId) {
                    add_notification($adminId, "📬 New Contact Inquiry from " . e($name) . ": " . e($subject));
                }
                
                log_activity("Submitted contact form query. Email: $email");
                
                $successMessage = "Your query has been submitted successfully. Our support desk will contact you soon.";
                
                // Clear fields
                $name = $email = $subject = $message = "";
            } catch (PDOException $e) {
                log_system_error("Failed to save contact query: " . $e->getMessage());
                $errorMessage = "A server error occurred. Please try again later.";
            }
        }
    }
}
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 3.5rem;">
        <p class="eyebrow">Help Desk</p>
        <h1>Get in Touch</h1>
        <p class="auth-subtitle">Have questions or want to register a new clinical node? Submit your inquiry below.</p>
    </div>
    
    <div class="two-column" style="max-width: 900px; margin: 0 auto; align-items: start;">
        <div class="card" style="padding: 2.5rem;">
            <h3>Contact Information</h3>
            <p style="margin: 1rem 0 2rem;">If you are an administrator trying to connect your CHC/PHC nodes, please mention your clinical code.</p>
            
            <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="font-size: 1.8rem;">📍</span>
                    <div>
                        <strong>Physical Location</strong>
                        <p style="font-size: 0.85rem; color: var(--color-text-muted);">Smart Health HQ, Sect 62, Noida, UP, India</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="font-size: 1.8rem;">📞</span>
                    <div>
                        <strong>Phone Support</strong>
                        <p style="font-size: 0.85rem; color: var(--color-text-muted);">+91 98765 43210 (Mon-Sat, 9AM-6PM)</p>
                    </div>
                </div>
                
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <span style="font-size: 1.8rem;">✉️</span>
                    <div>
                        <strong>Electronic Mail</strong>
                        <p style="font-size: 0.85rem; color: var(--color-text-muted);">support@smarthealth.com</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card" style="padding: 2.5rem;">
            <h3>Submit a Query</h3>
            
            <?php if (!empty($errorMessage)): ?>
                <div class="auth-message auth-message-error" style="margin-top: 1rem;"><?= e($errorMessage) ?></div>
            <?php endif; ?>
            
            <?php if (!empty($successMessage)): ?>
                <div class="auth-message" style="margin-top: 1rem;"><?= e($successMessage) ?></div>
            <?php endif; ?>
            
            <form action="contact.php" method="post" class="auth-form" style="margin-top: 1.5rem;">
                <?= csrf_field() ?>
                
                <label>
                    Full Name
                    <input type="text" name="name" value="<?= isset($name) ? e($name) : '' ?>" placeholder="e.g. Rahul Sen" required />
                </label>
                
                <label>
                    Email Address
                    <input type="email" name="email" value="<?= isset($email) ? e($email) : '' ?>" placeholder="you@example.com" required />
                </label>
                
                <label>
                    Subject
                    <input type="text" name="subject" value="<?= isset($subject) ? e($subject) : '' ?>" placeholder="What is this regarding?" required />
                </label>
                
                <label>
                    Detailed Message
                    <textarea name="message" rows="5" placeholder="Write your question here..." required><?= isset($message) ? e($message) : '' ?></textarea>
                </label>
                
                <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Submit Query</button>
            </form>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
