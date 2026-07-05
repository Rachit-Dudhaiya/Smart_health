<?php
/**
 * Smart Health - Services Page
 */

$pageTitle = "Core Services";
$pageDesc = "Explore the digital infrastructure services provided by Smart Health, from medicine stock alerts to bed capacity analytics.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';

$title = "Our Core Digital Services";
$content = "";

try {
    $stmt = $GLOBALS['db']->prepare("SELECT `title`, `content` FROM `pages_content` WHERE `slug` = 'services'");
    $stmt->execute();
    $cmsRow = $stmt->fetch();
    
    if ($cmsRow) {
        $title = $cmsRow['title'];
        $content = $cmsRow['content'];
    }
} catch (PDOException $e) {
    log_system_error("Failed to fetch CMS page content for services: " . $e->getMessage());
}

if (empty($content)) {
    $content = "We offer a suite of integrated services designed to modernize public health hubs. Each service utilizes real-time database queries to ensure accuracy.";
}

$services = [
    [
        'title' => 'Real-Time Inventory',
        'desc' => 'Track stock levels, record transactions, and check upcoming expiry dates on medicine stock tables.',
        'icon' => '💊'
    ],
    [
        'title' => 'Queue Analytics',
        'desc' => 'Allows clinicians to log consultation queues and tracks average client waiting time in out-patient wards.',
        'icon' => '👥'
    ],
    [
        'title' => 'Emergency SOS ambulance',
        'desc' => 'Allows patients to instantly alert the command center, booking available beds and sending notification details.',
        'icon' => '🚑'
    ],
    [
        'title' => 'Roster Tracking',
        'desc' => 'Enables doctors to log daily attendance records, reducing manual payroll errors and tracking leaves.',
        'icon' => '🩺'
    ]
];
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 4rem;">
        <p class="eyebrow">Smart Infrastructure</p>
        <h1><?= e($title) ?></h1>
        <p class="auth-subtitle" style="max-width: 600px; margin: 1rem auto 0; font-size: 1.05rem;">
            <?= e($content) ?>
        </p>
    </div>
    
    <div class="card-grid">
        <?php foreach ($services as $svc): ?>
            <article class="card">
                <div class="card-icon" style="font-size: 2.5rem; margin-bottom: 1.5rem;"><?= $svc['icon'] ?></div>
                <h3><?= e($svc['title']) ?></h3>
                <p><?= e($svc['desc']) ?></p>
            </article>
        <?php endforeach; ?>
    </div>
    
    <div class="card" style="margin-top: 4rem; padding: 3rem; text-align: center; background-color: var(--color-primary-light);">
        <h2>Need to register your health facility?</h2>
        <p style="margin: 1rem 0 2rem; color: var(--color-text-muted);">
            Join our network of smart clinics. Set up custom alerts for your doctors, pharmacists, and local community.
        </p>
        <a class="btn btn-primary" href="<?= get_relative_url('pages/auth/register.php') ?>">Create Free Account</a>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
