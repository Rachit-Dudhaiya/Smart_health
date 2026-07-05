<?php
/**
 * Smart Health - About Page
 */

$pageTitle = "About Us";
$pageDesc = "Learn more about Smart Health, our goals, and how we empower medical centers with dynamic database systems.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';

$title = "About Smart Health";
$content = "";

try {
    $stmt = $GLOBALS['db']->prepare("SELECT `title`, `content` FROM `pages_content` WHERE `slug` = 'about'");
    $stmt->execute();
    $cmsRow = $stmt->fetch();
    
    if ($cmsRow) {
        $title = $cmsRow['title'];
        $content = $cmsRow['content'];
    }
} catch (PDOException $e) {
    log_system_error("Failed to fetch CMS page content for about: " . $e->getMessage());
}

// Fallback content if empty
if (empty($content)) {
    $content = "Smart Health is an advanced digital healthcare operations platform designed for Primary Health Centers (PHC) and Community Health Centers (CHC). We unify medicine inventory, doctor attendance rosters, bed capacity trackers, patient queues, and emergency triggers into a single command dashboard. Built with modern, secure code practices, our platform is designed to run efficiently on any device.";
}
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 3rem;">
        <p class="eyebrow">Our Mission</p>
        <h1><?= e($title) ?></h1>
    </div>
    
    <div class="card" style="max-width: 800px; margin: 0 auto; line-height: 1.8; font-size: 1.1rem; padding: 3rem;">
        <p style="margin-bottom: 1.5rem; text-align: justify; white-space: pre-line;">
            <?= e($content) ?>
        </p>
        
        <hr style="border: 0; border-top: 1px solid var(--color-border); margin: 2rem 0;" />
        
        <h3>Key Operational Pillars</h3>
        <ul class="check-list" style="margin-top: 1rem;">
            <li><strong>Automated Data Integration</strong>: Say goodbye to manually maintained books and files. All logs, beds, stock reports are stored in organized tables.</li>
            <li><strong>Secure Authentication Guards</strong>: Complete compliance via session tracking, role checking (RBAC), and brute-force mitigations.</li>
            <li><strong>Optimized Workflows</strong>: Streamlines daily doctor check-ins and emergency SOS alerts for patients.</li>
            <li><strong>Dynamic Content Controls</strong>: Admin panel enables editing key text and managing user rosters dynamically.</li>
        </ul>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
