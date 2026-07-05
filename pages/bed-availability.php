<?php
/**
 * Smart Health - Public Bed Availability Module
 */

$pageTitle = "Ward Bed Occupancy";
$pageDesc = "Live check of ICU, emergency, pediatric, and general ward bed availability across nodes.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

$filter = trim($_GET['ward'] ?? 'all'); // 'all', 'ICU', 'General', 'Pediatric', 'Emergency'

// Fetch stats counts
$totalBeds = 0;
$occupiedBeds = 0;
$freeBeds = 0;

try {
    $totalBeds = $GLOBALS['db']->query("SELECT SUM(`total`) FROM `bed_inventory`")->fetchColumn() ?: 0;
    $occupiedBeds = $GLOBALS['db']->query("SELECT SUM(`occupied`) FROM `bed_inventory`")->fetchColumn() ?: 0;
    $freeBeds = max(0, $totalBeds - $occupiedBeds);
} catch (PDOException $e) {}

// Fetch wards
$wards = [];
try {
    $sql = "SELECT * FROM `bed_inventory` WHERE 1=1";
    $params = [];
    
    if ($filter !== 'all') {
        $sql .= " AND `ward_type` = :ward";
        $params[':ward'] = $filter;
    }
    
    $sql .= " ORDER BY `ward_type` ASC";
    $stmt = $GLOBALS['db']->prepare($sql);
    $stmt->execute($params);
    $wards = $stmt->fetchAll();
} catch (PDOException $e) {
    log_system_error("Failed to fetch public bed inventory: " . $e->getMessage());
}
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 3.5rem;">
        <p class="eyebrow">Referral Tracking</p>
        <h1>Ward Bed Capacity</h1>
        <p class="auth-subtitle">Live database logs tracking ICU admissions, general occupancy, and pediatric reserves.</p>
    </div>
    
    <!-- Stats Row -->
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); margin-bottom: 3rem;">
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">🛏️</span>
            <strong><?= $totalBeds ?></strong>
            <span style="margin-top: 0.5rem;">Total Ward Beds</span>
        </div>
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main); border-bottom: 4px solid var(--color-danger);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">👨‍⚕️</span>
            <strong><?= $occupiedBeds ?></strong>
            <span style="margin-top: 0.5rem;">Occupied / Reserved</span>
        </div>
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main); border-bottom: 4px solid var(--color-success);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">🏥</span>
            <strong><?= $freeBeds ?></strong>
            <span style="margin-top: 0.5rem;">Vacant Beds Left</span>
        </div>
    </div>
    
    <!-- Filter bar -->
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <span>Ward Filter:</span>
            <a href="bed-availability.php?ward=all" class="btn <?= $filter === 'all' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">All Wards</a>
            <a href="bed-availability.php?ward=ICU" class="btn <?= $filter === 'ICU' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">ICU Wards</a>
            <a href="bed-availability.php?ward=General" class="btn <?= $filter === 'General' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">General Care</a>
            <a href="bed-availability.php?ward=Pediatric" class="btn <?= $filter === 'Pediatric' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Pediatrics</a>
            <a href="bed-availability.php?ward=Emergency" class="btn <?= $filter === 'Emergency' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Emergency Care</a>
        </div>
    </div>
    
    <!-- Display Wards list -->
    <div class="card-grid two-up">
        <article class="card">
            <h3>Ward Inventory Overview</h3>
            <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
                <?php if (count($wards) > 0): ?>
                    <?php foreach ($wards as $ward): 
                        $rem = max(0, $ward['total'] - $ward['occupied']);
                        $pct = $ward['total'] > 0 ? round(($ward['occupied'] / $ward['total']) * 100) : 0;
                        $color = $pct > 80 ? 'var(--color-danger)' : ($pct > 50 ? 'var(--color-accent)' : 'var(--color-success)');
                    ?>
                        <div style="border-bottom: 1px solid var(--color-border); padding-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.9rem; margin-bottom: 0.4rem;">
                                <span><?= e($ward['ward_type']) ?> Ward Block</span>
                                <span style="color: <?= $color ?>;"><?= $rem ?> Vacant (<?= intval($ward['occupied']) ?>/<?= intval($ward['total']) ?> Occupied)</span>
                            </div>
                            <div style="background-color: var(--bg-primary); height: 12px; border-radius: var(--radius-full); overflow: hidden;">
                                <div style="background-color: <?= $color ?>; width: <?= $pct ?>%; height: 100%;"></div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="auth-subtitle">No ward matching details found.</p>
                <?php endif; ?>
            </div>
        </article>
        
        <article class="card">
            <h3>Admissions Guidelines</h3>
            <p class="auth-subtitle" style="margin: 0.5rem 0 1.5rem;">Procedure for medical referrals and bed allocation.</p>
            
            <ul class="check-list">
                <li>🏥 <strong>Direct Referrals</strong>: Nearby centers can refer patients by verifying vacant counts.</li>
                <li>🚨 <strong>Emergency Buffer</strong>: 2 beds inside Emergency ward are kept vacant for ambulance arrivals.</li>
                <li>📝 <strong>Booking confirmation</strong>: Requires clocking of patient checkup by medical officer.</li>
            </ul>
            
            <?php if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'patient'): ?>
                <div style="margin-top: 2rem;">
                    <a href="<?= get_relative_url('pages/dashboard/patient.php') ?>" class="btn btn-primary btn-full">🚑 Request Emergency SOS / Bed</a>
                </div>
            <?php endif; ?>
        </article>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
