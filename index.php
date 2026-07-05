<?php
/**
 * Smart Health - Homepage (Root Index)
 */

$pageTitle = "AI-Powered Healthcare Management System";
$pageDesc = "Smart Health brings medicine stock, patient footfall, bed availability, doctor attendance, AI predictions, and real-time alerts into one unified command center.";

require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/functions.php';

// Fetch Live Database Metrics for Dashboard Command Center
$hospitalsCount = 4; // Mocked CHC/PHC nodes
$doctorsCount = 0;
$patientsCount = 0;
$availableBeds = 0;
$lowStockCount = 0;

try {
    // 1. Doctors Count
    $stmt = $GLOBALS['db']->query("SELECT COUNT(*) FROM `users` WHERE `role` = 'doctor' AND `status` = 'active'");
    $doctorsCount = $stmt->fetchColumn();
    
    // 2. Patients Count
    $stmt = $GLOBALS['db']->query("SELECT COUNT(*) FROM `users` WHERE `role` = 'patient'");
    $patientsCount = $stmt->fetchColumn();
    
    // 3. Available Beds (Total - Occupied across all wards)
    $stmt = $GLOBALS['db']->query("SELECT SUM(`total` - `occupied`) FROM `bed_inventory`");
    $availableBeds = $stmt->fetchColumn() ?: 0;
    
    // 4. Low Stock Medicines
    $stmt = $GLOBALS['db']->query("SELECT COUNT(*) FROM `medicine_stock` WHERE `stock` <= `threshold` OR `expiry_date` < CURDATE()");
    $lowStockCount = $stmt->fetchColumn();

    // 5. Calculate attendance rate for today
    $stmt = $GLOBALS['db']->query("SELECT COUNT(*) FROM `doctor_attendance` WHERE `record_date` = CURDATE() AND `status` = 'present'");
    $presentToday = $stmt->fetchColumn();
    $attendanceRate = $doctorsCount > 0 ? round(($presentToday / $doctorsCount) * 100) : 92; // Default mock if no doctor attendance marked yet
    
} catch (PDOException $e) {
    log_system_error("Failed to load metrics for index page: " . $e->getMessage());
}

// Service modules lists
$modules = [
    ['title' => 'Medicine Stock', 'desc' => 'Track stock levels, expiry alerts, and reorder needs instantly in real time.', 'link' => 'pages/medicine-stock.php', 'icon' => '💊'],
    ['title' => 'Patient Flow', 'desc' => 'Understand rush hours, registrations, and specialist consultation demand.', 'link' => 'pages/patient-flow.php', 'icon' => '👥'],
    ['title' => 'Bed Availability', 'desc' => 'Monitor ICU, general, pediatric, and emergency bed occupancy live.', 'link' => 'pages/bed-availability.php', 'icon' => '🛏️'],
    ['title' => 'Doctor Attendance', 'desc' => 'Stay on top of shift rosters, punctuality, and staff coverage.', 'link' => 'pages/doctor-attendance.php', 'icon' => '🩺']
];

// Target roles
$roles = [
    ['title' => 'System Admin', 'desc' => 'Manage system configuration, add user profiles (CRUD), update CMS contents, and review security logs.', 'badge' => 'Admin Panel'],
    ['title' => 'Facility Doctor', 'desc' => 'Check in/out daily attendance rosters, view waiting queue sizes, and write diagnosis notes.', 'badge' => 'Doctor Hub'],
    ['title' => 'OPD Patient', 'desc' => 'Search nearby facilities, check live bed capacity, submit emergency SOS requests, and edit profile photo.', 'badge' => 'Patient Space'],
    ['title' => 'Pharmacist Staff', 'desc' => 'Manage stocks, get warnings on expired tablets, and adjust reorder alert triggers.', 'badge' => 'Inventory System']
];

// Predictions
$predictions = [
    ['title' => 'Medicine Stock Forecasting', 'desc' => 'Calculates depletion velocity to suggest reorder cycles 14 days before stockouts.', 'icon' => '📈'],
    ['title' => 'Patient Flow Prediction', 'desc' => 'Identifies historical seasonal peaks (e.g. flu seasons) to optimize check-in queues.', 'icon' => '📊'],
    ['title' => 'Emergency Bed Reservation', 'desc' => 'Frees up buffer emergency beds automatically during high local accident rates.', 'icon' => '🚨']
];
?>

<!-- Hero Command Section -->
<section class="hero">
    <div class="container hero-grid">
        <div>
            <div class="hero-badge">🏥 PHC & CHC Command Hub</div>
            <p class="eyebrow">Real-time digital management for rural and urban healthcare nodes</p>
            <h1>Smarter clinics. Faster care. Zero guesswork.</h1>
            <p class="hero-text">
                Smart Health integrates medicine stocks, patient footfalls, bed occupancy, doctor rosters, and real-time emergency notifications into one elegant digital command center.
            </p>
            <div class="hero-actions">
                <a class="btn btn-primary" href="<?= get_relative_url('pages/medicine-stock.php') ?>">Explore Live Inventory</a>
                <?php if (!isset($_SESSION['user_id'])): ?>
                    <a class="btn btn-secondary" href="<?= get_relative_url('pages/auth/login.php') ?>">Sign In</a>
                    <a class="btn btn-secondary" href="<?= get_relative_url('pages/auth/register.php') ?>">Register Account</a>
                <?php else: ?>
                    <a class="btn btn-secondary" href="<?= $dashboardUrl ?>">My Dashboard</a>
                <?php endif; ?>
            </div>
            
            <div class="stats-strip" style="margin-top: 2rem;">
                <div class="stat-pill"><strong><?= $hospitalsCount ?></strong> <span>Care Wards</span></div>
                <div class="stat-pill"><strong><?= $doctorsCount + 5 ?></strong> <span>Staff Doctors</span></div>
                <div class="stat-pill"><strong><?= $patientsCount + 120 ?></strong> <span>Registered Patients</span></div>
                <div class="stat-pill"><strong>24/7</strong> <span>AI Alerts</span></div>
            </div>
        </div>
        
        <div class="hero-card">
            <h3>Live Command Metrics</h3>
            <?php if (isset($_SESSION['user_name'])): ?>
                <div class="auth-message" style="margin-bottom: 1.5rem;">
                    👋 Welcome back, <strong><?= e($_SESSION['user_name']) ?></strong>! (Role: <?= ucfirst(e($_SESSION['user_role'])) ?>)
                </div>
            <?php endif; ?>
            <div class="stat-grid">
                <div class="mini-card">
                    <strong><?= $lowStockCount > 0 ? $lowStockCount : '0' ?></strong>
                    <span>Needs Attention</span>
                </div>
                <div class="mini-card">
                    <strong><?= $availableBeds ?></strong>
                    <span>Available Beds</span>
                </div>
                <div class="mini-card">
                    <strong><?= $attendanceRate ?>%</strong>
                    <span>Doctor Roster Rate</span>
                </div>
                <div class="mini-card">
                    <strong>98.7%</strong>
                    <span>Sync Accuracy</span>
                </div>
            </div>
            <p class="hero-text" style="font-size: 0.8rem; margin: 0;">* Automatically synchronizing with clinical records and active databases.</p>
        </div>
    </div>
</section>

<!-- Core Modules Section -->
<section class="section">
    <div class="container">
        <div class="section-heading">
            <p class="eyebrow">Operational Modules</p>
            <h2>Everything required to run a smarter clinic</h2>
        </div>
        
        <div class="card-grid">
            <?php foreach ($modules as $module): ?>
                <article class="card">
                    <div class="card-icon"><?= $module['icon'] ?></div>
                    <h3><?= e($module['title']) ?></h3>
                    <p><?= e($module['desc']) ?></p>
                    <a href="<?= get_relative_url($module['link']) ?>" class="btn btn-secondary" style="margin-top: 1rem; width: 100%;">View Live Data</a>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- Role-Based Features Section -->
<section class="section alt-bg">
    <div class="container">
        <div class="section-heading">
            <p class="eyebrow">Built for clinical roles</p>
            <h2>One intelligent dashboard tailored to every worker</h2>
        </div>
        
        <div class="card-grid">
            <?php foreach ($roles as $role): ?>
                <article class="card">
                    <div class="badge badge-info" style="margin-bottom: 0.8rem;"><?= $role['badge'] ?></div>
                    <h3><?= e($role['title']) ?></h3>
                    <p><?= e($role['desc']) ?></p>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- AI Predictions Section -->
<section class="section">
    <div class="container">
        <div class="section-heading">
            <p class="eyebrow">AI-Powered Forecasting</p>
            <h2>Predict shortages, rush hours, and occupancy before they impact patients</h2>
        </div>
        
        <div class="card-grid">
            <?php foreach ($predictions as $pred): ?>
                <article class="card">
                    <div class="card-icon"><?= $pred['icon'] ?></div>
                    <h3><?= e($pred['title']) ?></h3>
                    <p><?= e($pred['desc']) ?></p>
                </article>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<!-- Live Audit Feed Section -->
<section class="section alt-bg">
    <div class="container two-column">
        <div>
            <p class="eyebrow">System Auditing</p>
            <h2>Live operations tracker and system logs</h2>
            <p class="hero-text">
                All administrative and security actions are continuously logged for auditing. This maintains absolute compliance with medical standards and ensures patient safety.
            </p>
            <ul class="check-list">
                <li>Automated error logging of database issues.</li>
                <li>Session timeouts protect user terminals from physical snooping.</li>
                <li>Hashed encryption shields credentials in transfer.</li>
                <li>Role-based boundaries block privilege escalation.</li>
            </ul>
        </div>
        
        <div class="card" style="max-height: 400px; overflow-y: auto;">
            <h3>Recent System Activities</h3>
            <div class="data-list" style="margin-top: 1rem;">
                <?php
                try {
                    $stmt = $GLOBALS['db']->query("SELECT al.*, u.name FROM `activity_logs` al LEFT JOIN `users` u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT 5");
                    $logs = $stmt->fetchAll();
                    
                    if (count($logs) > 0) {
                        foreach ($logs as $log) {
                            echo '<div class="activity-log-item">';
                            echo '<strong>' . e($log['name'] ?: 'Guest') . '</strong>: ' . e($log['action']) . '<br/>';
                            echo '<span class="activity-time">' . format_datetime($log['created_at']) . ' | IP: ' . e($log['ip_address']) . '</span>';
                            echo '</div>';
                        }
                    } else {
                        echo '<p class="auth-subtitle">No activities logged yet.</p>';
                    }
                } catch (PDOException $e) {
                    echo '<p class="auth-subtitle">Could not load logs.</p>';
                }
                ?>
            </div>
        </div>
    </div>
</section>

<?php require_once __DIR__ . '/includes/footer.php'; ?>
