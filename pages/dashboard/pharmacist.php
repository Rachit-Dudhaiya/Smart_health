<?php
/**
 * Smart Health - Pharmacist Dashboard Panel
 */

$pageTitle = "Pharmacist Hub";
$pageDesc = "Dispense prescription medicines, check expiry risk levels, and manage pharmacy stock.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

// Access Control
require_role(['pharmacist', 'admin']);

$errorMessage = "";
$successMessage = "";

// Handle POST actions for inventory management
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please retry.";
    } else {
        $action = $_POST['action'];
        
        // 1. ACTION: Create Medicine
        if ($action === 'create_med') {
            $name = trim($_POST['name'] ?? '');
            $stock = intval($_POST['stock'] ?? 0);
            $threshold = intval($_POST['threshold'] ?? 10);
            $expiry = trim($_POST['expiry_date'] ?? '');
            
            if (is_blank($name) || is_blank($expiry)) {
                $errorMessage = "Medicine name and expiry date are required.";
            } else {
                try {
                    // Determine initial status
                    $status = 'normal';
                    if (strtotime($expiry) < time()) {
                        $status = 'expired';
                    } elseif ($stock <= 0) {
                        $status = 'critical';
                    } elseif ($stock <= $threshold) {
                        $status = 'low';
                    }
                    
                    $stmt = $GLOBALS['db']->prepare("INSERT INTO `medicine_stock` (`name`, `stock`, `threshold`, `expiry_date`, `status`) VALUES (:name, :stock, :threshold, :expiry, :status)");
                    $stmt->execute([
                        ':name' => $name,
                        ':stock' => $stock,
                        ':threshold' => $threshold,
                        ':expiry' => $expiry,
                        ':status' => $status
                    ]);
                    
                    log_activity("Pharmacist added medicine: $name");
                    $successMessage = "Medicine '$name' added to inventory.";
                } catch (PDOException $e) {
                    log_system_error("Failed to add medicine: " . $e->getMessage());
                    $errorMessage = "Database insertion failed.";
                }
            }
        }
        
        // 2. ACTION: Quick Stock Adjust (+/-)
        elseif ($action === 'adjust_stock') {
            $medId = intval($_POST['med_id'] ?? 0);
            $delta = intval($_POST['delta'] ?? 0);
            
            try {
                // Fetch current details
                $fetchStmt = $GLOBALS['db']->prepare("SELECT * FROM `medicine_stock` WHERE `id` = :id LIMIT 1");
                $fetchStmt->execute([':id' => $medId]);
                $med = $fetchStmt->fetch();
                
                if ($med) {
                    $newStock = max(0, $med['stock'] + $delta);
                    
                    // Re-calculate status
                    $status = 'normal';
                    if (strtotime($med['expiry_date']) < time()) {
                        $status = 'expired';
                    } elseif ($newStock <= 0) {
                        $status = 'critical';
                    } elseif ($newStock <= $med['threshold']) {
                        $status = 'low';
                    }
                    
                    $updStmt = $GLOBALS['db']->prepare("UPDATE `medicine_stock` SET `stock` = :stock, `status` = :status WHERE `id` = :id");
                    $updStmt->execute([
                        ':stock' => $newStock,
                        ':status' => $status,
                        ':id' => $medId
                    ]);
                    
                    // If critical, trigger notification to pharmacist and admin
                    if ($status === 'critical' || $status === 'low') {
                        $users = $GLOBALS['db']->query("SELECT `id` FROM `users` WHERE `role` IN ('admin', 'pharmacist')")->fetchAll(PDO::PARAM_COLUMN);
                        foreach ($users as $uId) {
                            add_notification($uId, "⚠️ STOCK WARNING: '" . e($med['name']) . "' stock level is critically low ($newStock left).");
                        }
                    }
                    
                    log_activity("Adjusted medicine stock (ID: $medId, Delta: $delta, New: $newStock)");
                    $successMessage = "Stock for '" . e($med['name']) . "' adjusted to $newStock.";
                } else {
                    $errorMessage = "Medicine not found.";
                }
            } catch (PDOException $e) {
                log_system_error("Failed quick adjust: " . $e->getMessage());
                $errorMessage = "Database update failed.";
            }
        }
        
        // 3. ACTION: Delete Medicine
        elseif ($action === 'delete_med') {
            $medId = intval($_POST['med_id'] ?? 0);
            try {
                $stmt = $GLOBALS['db']->prepare("DELETE FROM `medicine_stock` WHERE `id` = :id");
                $stmt->execute([':id' => $medId]);
                log_activity("Pharmacist deleted medicine ID: $medId");
                $successMessage = "Medicine removed from database.";
            } catch (PDOException $e) {
                log_system_error("Failed to delete medicine: " . $e->getMessage());
                $errorMessage = "Database deletion failed.";
            }
        }
    }
}

// Fetch warnings (low/expired medicines)
$criticalMeds = [];
try {
    $stmt = $GLOBALS['db']->query("SELECT * FROM `medicine_stock` WHERE `status` IN ('low', 'critical', 'expired') ORDER BY `status` ASC, `name` ASC");
    $criticalMeds = $stmt->fetchAll();
} catch (PDOException $e) {}

// Search & Pagination setup
$search = trim($_GET['search'] ?? '');
$itemsPerPage = 10;
$currentPage = intval($_GET['page'] ?? 1);
if ($currentPage < 1) $currentPage = 1;
$offset = ($currentPage - 1) * $itemsPerPage;

$inventory = [];
$totalPages = 0;

try {
    // Count query
    if (!empty($search)) {
        $cntStmt = $GLOBALS['db']->prepare("SELECT COUNT(*) FROM `medicine_stock` WHERE `name` LIKE :search");
        $cntStmt->execute([':search' => "%$search%"]);
        $totalItems = $cntStmt->fetchColumn();
        
        $stmt = $GLOBALS['db']->prepare("SELECT * FROM `medicine_stock` WHERE `name` LIKE :search ORDER BY `name` ASC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':search', "%$search%", PDO::PARAM_STR);
    } else {
        $totalItems = $GLOBALS['db']->query("SELECT COUNT(*) FROM `medicine_stock`")->fetchColumn();
        $stmt = $GLOBALS['db']->prepare("SELECT * FROM `medicine_stock` ORDER BY `name` ASC LIMIT :limit OFFSET :offset");
    }
    
    $totalPages = ceil($totalItems / $itemsPerPage);
    $stmt->bindValue(':limit', $itemsPerPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $inventory = $stmt->fetchAll();
    
} catch (PDOException $e) {
    log_system_error("Failed pharmacist inventory load: " . $e->getMessage());
}
?>

<div class="container" style="padding: 2rem 0;">
    <div class="dashboard-grid">
        
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
            <h4 style="margin-bottom: 1.5rem;">Inventory Alerts</h4>
            
            <div class="card" style="padding: 1.5rem; background-color: var(--bg-primary);">
                <h4>Low & Expired Drugs</h4>
                <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.8rem;">
                    <?php if (count($criticalMeds) > 0): ?>
                        <?php foreach ($criticalMeds as $med): ?>
                            <div style="font-size: 0.8rem; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem;">
                                <strong><?= e($med['name']) ?></strong><br/>
                                <span>Stock: <?= intval($med['stock']) ?></span> | 
                                <span class="badge <?= $med['status'] === 'expired' ? 'badge-danger' : 'badge-warning' ?>" style="font-size:0.6rem; padding: 1px 4px;"><?= ucfirst(e($med['status'])) ?></span>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <p class="auth-subtitle" style="font-size: 0.8rem;">All medicines are in normal stock levels.</p>
                    <?php endif; ?>
                </div>
            </div>
        </aside>
        
        <!-- Main Area -->
        <main class="dashboard-main">
            
            <?php if (!empty($errorMessage)): ?>
                <div class="auth-message auth-message-error"><?= e($errorMessage) ?></div>
            <?php endif; ?>
            
            <?php if (!empty($successMessage)): ?>
                <div class="auth-message"><?= e($successMessage) ?></div>
            <?php endif; ?>
            
            <!-- Add Medicine Card -->
            <section class="card" style="padding: 2rem;">
                <h3>Add New Medicine / Drug Item</h3>
                <form action="pharmacist.php" method="post" class="auth-form" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 1rem; align-items: end; margin-top: 1.2rem;">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="create_med" />
                    
                    <label>
                        Drug / Medicine Name
                        <input type="text" name="name" placeholder="e.g. Paracetamol 500mg" required />
                    </label>
                    
                    <label>
                        Initial Stock
                        <input type="number" name="stock" value="0" min="0" required />
                    </label>
                    
                    <label>
                        Alert Threshold
                        <input type="number" name="threshold" value="10" min="0" required />
                    </label>
                    
                    <label>
                        Expiry Date
                        <input type="date" name="expiry_date" required />
                    </label>
                    
                    <button type="submit" class="btn btn-primary" style="grid-column: span 4; width: 100%;">Add to Inventory Database</button>
                </form>
            </section>
            
            <!-- List Inventory -->
            <section class="card" style="padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                    <h3>Dispensation & Stock Table</h3>
                    
                    <form action="pharmacist.php" method="get" class="search-bar-wrap" style="margin: 0;">
                        <input type="text" name="search" value="<?= e($search) ?>" placeholder="Search medicine..." style="padding: 0.5rem 1rem;" />
                        <button type="submit" class="btn btn-primary" style="padding: 0.5rem 1rem;">Search</button>
                    </form>
                </div>
                
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Medicine Name</th>
                                <th>Stock Left</th>
                                <th>Warning Limit</th>
                                <th>Expiry Date</th>
                                <th>State</th>
                                <th>Adjust Stock</th>
                                <th>Delete</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (count($inventory) > 0): ?>
                                <?php foreach ($inventory as $med): ?>
                                    <tr>
                                        <td style="font-weight: 700;"><?= e($med['name']) ?></td>
                                        <td style="font-size: 1.1rem;"><strong><?= intval($med['stock']) ?></strong> units</td>
                                        <td><?= intval($med['threshold']) ?></td>
                                        <td><?= date('d M Y', strtotime($med['expiry_date'])) ?></td>
                                        <td>
                                            <span class="badge <?= $med['status'] === 'normal' ? 'badge-success' : ($med['status'] === 'expired' ? 'badge-danger' : 'badge-warning') ?>">
                                                <?= ucfirst(e($med['status'])) ?>
                                            </span>
                                        </td>
                                        <td>
                                            <div style="display: flex; gap: 0.4rem;">
                                                <form action="pharmacist.php" method="post">
                                                    <?= csrf_field() ?>
                                                    <input type="hidden" name="action" value="adjust_stock" />
                                                    <input type="hidden" name="med_id" value="<?= intval($med['id']) ?>" />
                                                    <input type="hidden" name="delta" value="10" />
                                                    <button type="submit" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" title="Add 10">+10</button>
                                                </form>
                                                <form action="pharmacist.php" method="post">
                                                    <?= csrf_field() ?>
                                                    <input type="hidden" name="action" value="adjust_stock" />
                                                    <input type="hidden" name="med_id" value="<?= intval($med['id']) ?>" />
                                                    <input type="hidden" name="delta" value="-10" />
                                                    <button type="submit" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" title="Deduct 10" <?= $med['stock'] <= 0 ? 'disabled' : '' ?>>-10</button>
                                                </form>
                                            </div>
                                        </td>
                                        <td>
                                            <form action="pharmacist.php" method="post">
                                                <?= csrf_field() ?>
                                                <input type="hidden" name="action" value="delete_med" />
                                                <input type="hidden" name="med_id" value="<?= intval($med['id']) ?>" />
                                                <button type="submit" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="return confirm('Remove this drug entry?');">Delete</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="7" class="auth-subtitle" style="text-align: center; padding: 2rem;">No medicines matched in inventory table.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
                    <?= render_pagination($totalPages, $currentPage, 'pharmacist.php?page={page}' . (!empty($search) ? '&search=' . urlencode($search) : '')) ?>
                </div>
            </section>
            
        </main>
        
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
