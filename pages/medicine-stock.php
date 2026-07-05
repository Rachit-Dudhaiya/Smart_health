<?php
/**
 * Smart Health - Public Medicine Stock Module
 */

$pageTitle = "Medicine Stock Inventory";
$pageDesc = "Real-time verification of drug inventory levels, critical items, and shelf lifespans.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

$search = trim($_GET['search'] ?? '');
$filter = trim($_GET['filter'] ?? 'all'); // 'all', 'low', 'expired'

// Fetch stats counts
$totalUnits = 0;
$belowThreshold = 0;
$expiringSoon = 0;

try {
    $totalUnits = $GLOBALS['db']->query("SELECT SUM(`stock`) FROM `medicine_stock`")->fetchColumn() ?: 0;
    $belowThreshold = $GLOBALS['db']->query("SELECT COUNT(*) FROM `medicine_stock` WHERE `stock` <= `threshold` AND `expiry_date` >= CURDATE()")->fetchColumn();
    $expiringSoon = $GLOBALS['db']->query("SELECT COUNT(*) FROM `medicine_stock` WHERE `expiry_date` BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)")->fetchColumn();
} catch (PDOException $e) {}

// Build inventory query
$inventory = [];
try {
    $sql = "SELECT * FROM `medicine_stock` WHERE 1=1";
    $params = [];
    
    if (!empty($search)) {
        $sql .= " AND `name` LIKE :search";
        $params[':search'] = "%$search%";
    }
    
    if ($filter === 'low') {
        $sql .= " AND `stock` <= `threshold` AND `expiry_date` >= CURDATE()";
    } elseif ($filter === 'expired') {
        $sql .= " AND `expiry_date` < CURDATE()";
    }
    
    $sql .= " ORDER BY `name` ASC";
    $stmt = $GLOBALS['db']->prepare($sql);
    $stmt->execute($params);
    $inventory = $stmt->fetchAll();
} catch (PDOException $e) {
    log_system_error("Failed to load public medicine stock: " . $e->getMessage());
}
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 3rem;">
        <p class="eyebrow">Inventory Tracking</p>
        <h1>Clinical Medicine Stock</h1>
        <p class="auth-subtitle">Verify drug volumes, safety warning thresholds, and upcoming expiration cycles.</p>
    </div>
    
    <!-- Stats row -->
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); margin-bottom: 3rem;">
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">💊</span>
            <strong><?= number_format($totalUnits) ?></strong>
            <span style="margin-top: 0.5rem;">Total Units In Stock</span>
        </div>
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main); border-bottom: 4px solid var(--color-accent);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">⚠️</span>
            <strong><?= $belowThreshold ?></strong>
            <span style="margin-top: 0.5rem;">Below Safety Margin</span>
        </div>
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main); border-bottom: 4px solid var(--color-danger);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">🚨</span>
            <strong><?= $expiringSoon ?></strong>
            <span style="margin-top: 0.5rem;">Expiring This Week</span>
        </div>
    </div>
    
    <!-- Filter bar -->
    <div class="card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; gap: 0.5rem; align-items: center;">
            <span>Filter View:</span>
            <a href="medicine-stock.php?filter=all<?= !empty($search) ? '&search=' . urlencode($search) : '' ?>" class="btn <?= $filter === 'all' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">All Items</a>
            <a href="medicine-stock.php?filter=low<?= !empty($search) ? '&search=' . urlencode($search) : '' ?>" class="btn <?= $filter === 'low' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Critical Low</a>
            <a href="medicine-stock.php?filter=expired<?= !empty($search) ? '&search=' . urlencode($search) : '' ?>" class="btn <?= $filter === 'expired' ? 'btn-primary' : 'btn-secondary' ?>" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Expired</a>
        </div>
        
        <form action="medicine-stock.php" method="get" class="search-bar-wrap" style="margin:0;">
            <input type="hidden" name="filter" value="<?= e($filter) ?>" />
            <input type="text" name="search" value="<?= e($search) ?>" placeholder="Search medicine..." style="padding: 0.4rem 1rem;" />
            <button type="submit" class="btn btn-primary" style="padding: 0.4rem 1rem;">Search</button>
        </form>
    </div>
    
    <!-- Inventory table -->
    <div class="card" style="padding: 2rem;">
        <h3>Stock Registry</h3>
        <div class="table-wrap" style="margin-top: 1rem;">
            <table>
                <thead>
                    <tr>
                        <th>Drug Item Name</th>
                        <th>Available Stock</th>
                        <th>Alert Threshold</th>
                        <th>Expiration Date</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (count($inventory) > 0): ?>
                        <?php foreach ($inventory as $med): ?>
                            <tr>
                                <td style="font-weight: 700;"><?= e($med['name']) ?></td>
                                <td style="font-size: 1.05rem;"><strong><?= intval($med['stock']) ?></strong> units</td>
                                <td><?= intval($med['threshold']) ?></td>
                                <td><?= date('d M Y', strtotime($med['expiry_date'])) ?></td>
                                <td>
                                    <span class="badge <?= $med['status'] === 'normal' ? 'badge-success' : ($med['status'] === 'expired' ? 'badge-danger' : 'badge-warning') ?>">
                                        <?= ucfirst(e($med['status'])) ?>
                                    </span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="5" class="auth-subtitle" style="text-align: center; padding: 2rem;">No medicines matched in stock registry.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <?php if (isset($_SESSION['user_role']) && ($_SESSION['user_role'] === 'pharmacist' || $_SESSION['user_role'] === 'admin')): ?>
            <div style="margin-top: 1.5rem; text-align: right;">
                <a href="<?= get_relative_url('pages/dashboard/pharmacist.php') ?>" class="btn btn-secondary">✏️ Manage Pharmacy Registry</a>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
