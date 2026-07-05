<?php
/**
 * Smart Health - FAQ Page
 */

$pageTitle = "Help & FAQ";
$pageDesc = "Find answers to frequently asked questions about Smart Health operations, stock tracking, and user dashboards.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';

$faqs = [
    [
        'q' => 'What is Smart Health and who is it built for?',
        'a' => 'Smart Health is a dynamic healthcare administrative tool. It is built to coordinate operations inside Primary Health Centers (PHC) and Community Health Centers (CHC). It empowers facility admins, doctors, pharmacists, and visiting patients to access real-time operational data.'
    ],
    [
        'q' => 'How does the Medicine Stock threshold alert work?',
        'a' => 'Each medicine is registered with a minimum threshold limit. When stock falls below this number, the database flag switches status to "low" or "critical". Pharmacists are immediately warned on their dashboard to replenish the items.'
    ],
    [
        'q' => 'Can a patient request emergency support through the system?',
        'a' => 'Yes. Registered patients can log in to their dashboard and trigger an SOS ambulance request. The system marks a bed as pending and sends instant alerts to the center admin and on-duty doctors.'
    ],
    [
        'q' => 'How is data security handled inside the platform?',
        'a' => 'We follow strict secure coding practices: SQL injections are prevented using PDO prepared statements; inputs are escaped before rendering using special filters to prevent XSS; POST operations require a CSRF token; files are validated for size and MIME before storage; and sessions time out automatically after 30 minutes of inactivity.'
    ],
    [
        'q' => 'Can doctors check their attendance reports?',
        'a' => 'Yes. Doctors can check-in and check-out on their private dashboard. The logs automatically register timestamps in our database, which are paginated and searchable by the administrator.'
    ]
];
?>

<div class="container" style="padding: 4rem 0; max-width: 800px;">
    <div class="page-header" style="text-align: center; margin-bottom: 3.5rem;">
        <p class="eyebrow">Support Center</p>
        <h1>Frequently Asked Questions</h1>
        <p class="auth-subtitle">Get instant answers regarding operations, accounts, and clinical features.</p>
    </div>
    
    <div class="faq-list">
        <?php foreach ($faqs as $faq): ?>
            <div class="faq-item">
                <div class="faq-question">
                    <?= e($faq['q']) ?>
                    <span>➕</span>
                </div>
                <div class="faq-answer">
                    <?= e($faq['a']) ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    
    <div class="card" style="margin-top: 4rem; padding: 2.5rem; text-align: center;">
        <h3>Still have questions?</h3>
        <p style="margin: 0.5rem 0 1.5rem; color: var(--color-text-muted);">
            If you could not find the solution you were looking for, please submit a query via our help desk.
        </p>
        <a class="btn btn-primary" href="<?= get_relative_url('pages/contact.php') ?>">Contact Support</a>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
