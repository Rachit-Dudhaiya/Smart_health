<?php
/**
 * Smart Health - Admin Dashboard Panel
 */

$pageTitle = "Admin Dashboard";
$pageDesc = "System administration panel. Manage clinic accounts, CMS text blocks, queries, and activity logs.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

// Access Control
require_role(['admin']);

$tab = trim($_GET['tab'] ?? 'overview');
$errorMessage = "";
$successMessage = "";
$userId = $_SESSION['user_id'];

// Handle POST actions for users CRUD, content updates, etc.
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please refresh and retry.";
    } else {
        $action = $_POST['action'] ?? '';
        
        // 1. ACTION: Create User
        if ($action === 'create_user') {
            $name = trim($_POST['name'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';
            $role = trim($_POST['role'] ?? 'patient');
            $status = trim($_POST['status'] ?? 'active');
            
            if (is_blank($name) || is_blank($email) || is_blank($password)) {
                $errorMessage = "All user details are required.";
            } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $errorMessage = "Please enter a valid email address.";
            } elseif (strlen($password) < 8) {
                $errorMessage = "Password must be at least 8 characters long.";
            } else {
                try {
                    $stmt = $GLOBALS['db']->prepare("SELECT COUNT(*) FROM `users` WHERE `email` = :email");
                    $stmt->execute([':email' => $email]);
                    if ($stmt->fetchColumn() > 0) {
                        $errorMessage = "Email is already registered.";
                    } else {
                        $hash = password_hash($password, PASSWORD_DEFAULT);
                        $stmt = $GLOBALS['db']->prepare("INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `status`) VALUES (:name, :email, :password_hash, :role, :status)");
                        $stmt->execute([
                            ':name' => $name,
                            ':email' => $email,
                            ':password_hash' => $hash,
                            ':role' => $role,
                            ':status' => $status
                        ]);
                        log_activity("Admin created user profile: $email");
                        $successMessage = "User profile created successfully.";
                    }
                } catch (PDOException $e) {
                    log_system_error("Failed admin user create: " . $e->getMessage());
                    $errorMessage = "Database insertion error.";
                }
            }
        }
        
        // 2. ACTION: Update User Details (Role/Status)
        elseif ($action === 'update_user') {
            $targetId = intval($_POST['user_id'] ?? 0);
            $role = trim($_POST['role'] ?? 'patient');
            $status = trim($_POST['status'] ?? 'active');
            
            // Prevent changing own admin status or role to prevent self-lockout
            if ($targetId === $userId && ($role !== 'admin' || $status !== 'active')) {
                $errorMessage = "For security reasons, you cannot change your own admin role or suspend yourself.";
            } else {
                try {
                    $stmt = $GLOBALS['db']->prepare("UPDATE `users` SET `role` = :role, `status` = :status WHERE `id` = :id");
                    $stmt->execute([
                        ':role' => $role,
                        ':status' => $status,
                        ':id' => $targetId
                    ]);
                    log_activity("Admin updated user ID: $targetId (Role: $role, Status: $status)");
                    $successMessage = "User profile updated successfully.";
                } catch (PDOException $e) {
                    log_system_error("Failed admin user update: " . $e->getMessage());
                    $errorMessage = "Database update error.";
                }
            }
        }
        
        // 3. ACTION: Delete User
        elseif ($action === 'delete_user') {
            $targetId = intval($_POST['user_id'] ?? 0);
            if ($targetId === $userId) {
                $errorMessage = "You cannot delete your own active admin account.";
            } else {
                try {
                    // Fetch email first for logging
                    $emStmt = $GLOBALS['db']->prepare("SELECT `email` FROM `users` WHERE `id` = :id");
                    $emStmt->execute([':id' => $targetId]);
                    $targetEmail = $emStmt->fetchColumn();
                    
                    $stmt = $GLOBALS['db']->prepare("DELETE FROM `users` WHERE `id` = :id");
                    $stmt->execute([':id' => $targetId]);
                    
                    log_activity("Admin deleted user profile: $targetEmail");
                    $successMessage = "User deleted successfully.";
                } catch (PDOException $e) {
                    log_system_error("Failed admin user delete: " . $e->getMessage());
                    $errorMessage = "Database deletion error.";
                }
            }
        }
        
        // 4. ACTION: Update CMS Page Content
        elseif ($action === 'update_cms') {
            $slug = trim($_POST['slug'] ?? '');
            $title = trim($_POST['title'] ?? '');
            $content = trim($_POST['content'] ?? '');
            
            if (is_blank($slug) || is_blank($title) || is_blank($content)) {
                $errorMessage = "All fields are required to update CMS contents.";
            } else {
                try {
                    $stmt = $GLOBALS['db']->prepare("INSERT INTO `pages_content` (`slug`, `title`, `content`) VALUES (:slug, :title, :content) ON DUPLICATE KEY UPDATE `title` = :title, `content` = :content");
                    $stmt->execute([
                        ':slug' => $slug,
                        ':title' => $title,
                        ':content' => $content
                    ]);
                    log_activity("Admin updated CMS page: $slug");
                    $successMessage = "CMS Content blocks successfully updated.";
                } catch (PDOException $e) {
                    log_system_error("Failed to update CMS page: " . $e->getMessage());
                    $errorMessage = "Database update error on CMS.";
                }
            }
        }
    }
}

// Fetch stats for overview
$totalUsers = 0;
$totalMeds = 0;
$occupiedBeds = 0;
$pendingQueries = 0;

try {
    $totalUsers = $GLOBALS['db']->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    $totalMeds = $GLOBALS['db']->query("SELECT COUNT(*) FROM `medicine_stock`")->fetchColumn();
    $occupiedBeds = $GLOBALS['db']->query("SELECT SUM(`occupied`) FROM `bed_inventory`")->fetchColumn() ?: 0;
    $pendingQueries = $GLOBALS['db']->query("SELECT COUNT(*) FROM `contact_feedback`")->fetchColumn();
} catch (PDOException $e) {
    log_system_error("Stats fetch failure inside admin dashboard: " . $e->getMessage());
}
?>

<div class="container" style="padding: 2rem 0;">
    <div class="dashboard-grid">
        
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
            <h4>Control Center</h4>
            <div class="sidebar-nav">
                <a href="admin.php?tab=overview" class="<?= $tab === 'overview' ? 'active' : '' ?>">📊 Operations Overview</a>
                <a href="admin.php?tab=users" class="<?= $tab === 'users' ? 'active' : '' ?>">👥 User Management</a>
                <a href="admin.php?tab=cms" class="<?= $tab === 'cms' ? 'active' : '' ?>">📝 Content Manager</a>
                <a href="admin.php?tab=queries" class="<?= $tab === 'queries' ? 'active' : '' ?>">📬 Help Queries</a>
                <a href="admin.php?tab=logs" class="<?= $tab === 'logs' ? 'active' : '' ?>">📁 Activity Auditing</a>
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
            
            <!-- OVERVIEW TAB -->
            <?php if ($tab === 'overview'): ?>
                <div class="page-header">
                    <h1>Operations Overview</h1>
                    <p class="auth-subtitle">Live health node performance metrics and data summaries.</p>
                </div>
                
                <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));">
                    <div class="mini-card" style="padding: 1.8rem; background-color: var(--bg-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-main);">
                        <strong><?= $totalUsers ?></strong>
                        <span style="margin-top: 0.5rem;">Registered Users</span>
                    </div>
                    <div class="mini-card" style="padding: 1.8rem; background-color: var(--bg-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-main);">
                        <strong><?= $totalMeds ?></strong>
                        <span style="margin-top: 0.5rem;">Medicines Registered</span>
                    </div>
                    <div class="mini-card" style="padding: 1.8rem; background-color: var(--bg-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-main);">
                        <strong><?= $occupiedBeds ?></strong>
                        <span style="margin-top: 0.5rem;">Beds Occupied</span>
                    </div>
                    <div class="mini-card" style="padding: 1.8rem; background-color: var(--bg-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-main);">
                        <strong><?= $pendingQueries ?></strong>
                        <span style="margin-top: 0.5rem;">Inquiries Received</span>
                    </div>
                </div>

                <!-- Simple visual dashboard reporting charts (HTML-based) -->
                <div class="card" style="padding: 2.5rem; margin-top: 1rem;">
                    <h3>Bed Occupancy Breakdown</h3>
                    <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
                        <?php
                        try {
                            $stmt = $GLOBALS['db']->query("SELECT * FROM `bed_inventory`");
                            $bedsList = $stmt->fetchAll();
                            foreach ($bedsList as $bed):
                                $pct = $bed['total'] > 0 ? round(($bed['occupied'] / $bed['total']) * 100) : 0;
                                $color = $pct > 80 ? 'var(--color-danger)' : ($pct > 50 ? 'var(--color-accent)' : 'var(--color-success)');
                        ?>
                                <div>
                                    <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem; margin-bottom: 0.3rem;">
                                        <span><?= e($bed['ward_type']) ?> Ward</span>
                                        <span><?= intval($bed['occupied']) ?>/<?= intval($bed['total']) ?> Occupied (<?= $pct ?>%)</span>
                                    </div>
                                    <div style="background-color: var(--bg-primary); height: 12px; border-radius: var(--radius-full); overflow: hidden;">
                                        <div style="background-color: <?= $color ?>; width: <?= $pct ?>%; height: 100%;"></div>
                                    </div>
                                </div>
                        <?php
                            endforeach;
                        } catch (PDOException $e) {
                            echo '<p class="auth-subtitle">Failed to load bed occupancy visual reporting.</p>';
                        }
                        ?>
                    </div>
                </div>
            
            <!-- USERS CRUD TAB -->
            <?php elseif ($tab === 'users'): ?>
                <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h1>User Profile Management</h1>
                        <p class="auth-subtitle">Create, view, update status, and delete accounts.</p>
                    </div>
                </div>
                
                <!-- Add User Form -->
                <div class="card" style="padding: 2rem; margin-bottom: 2rem;">
                    <h3>Create New Profile</h3>
                    <form action="admin.php?tab=users" method="post" class="auth-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.2rem;">
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="create_user" />
                        
                        <label>
                            Full Name
                            <input type="text" name="name" placeholder="User name" required />
                        </label>
                        
                        <label>
                            Email Address
                            <input type="email" name="email" placeholder="you@example.com" required />
                        </label>
                        
                        <label>
                            Account Password
                            <input type="password" name="password" placeholder="••••••••" required minlength="8" />
                        </label>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                            <label>
                                Roster Role
                                <select name="role">
                                    <option value="patient" selected>Patient</option>
                                    <option value="doctor">Doctor</option>
                                    <option value="pharmacist">Pharmacist</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </label>
                            <label>
                                Status
                                <select name="status">
                                    <option value="active" selected>Active</option>
                                    <option value="pending">Pending</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </label>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="grid-column: span 2; margin-top: 0.5rem;">Create Profile</button>
                    </form>
                </div>
                
                <!-- List Users -->
                <div class="card" style="padding: 2rem;">
                    <h3>Active System Accounts</h3>
                    <div class="table-wrap" style="margin-top: 1rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Change Role/Status</th>
                                    <th>Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $uPage = intval($_GET['upage'] ?? 1);
                                if ($uPage < 1) $uPage = 1;
                                $uLimit = 10;
                                $uOffset = ($uPage - 1) * $uLimit;
                                
                                try {
                                    $uTotal = $GLOBALS['db']->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
                                    $uTotalPages = ceil($uTotal / $uLimit);
                                    
                                    $stmt = $GLOBALS['db']->prepare("SELECT * FROM `users` ORDER BY `created_at` DESC LIMIT :limit OFFSET :offset");
                                    $stmt->bindValue(':limit', $uLimit, PDO::PARAM_INT);
                                    $stmt->bindValue(':offset', $uOffset, PDO::PARAM_INT);
                                    $stmt->execute();
                                    $usersList = $stmt->fetchAll();
                                    
                                    foreach ($usersList as $usr):
                                ?>
                                        <tr>
                                            <td style="font-weight: 700;"><?= e($usr['name']) ?></td>
                                            <td><?= e($usr['email']) ?></td>
                                            <td><span class="badge badge-info"><?= ucfirst(e($usr['role'])) ?></span></td>
                                            <td>
                                                <span class="badge <?= $usr['status'] === 'active' ? 'badge-success' : ($usr['status'] === 'suspended' ? 'badge-danger' : 'badge-warning') ?>">
                                                    <?= ucfirst(e($usr['status'])) ?>
                                                </span>
                                            </td>
                                            <td>
                                                <!-- Update Form -->
                                                <form action="admin.php?tab=users" method="post" style="display: flex; gap: 0.5rem; align-items: center;">
                                                    <?= csrf_field() ?>
                                                    <input type="hidden" name="action" value="update_user" />
                                                    <input type="hidden" name="user_id" value="<?= intval($usr['id']) ?>" />
                                                    
                                                    <select name="role" style="padding: 0.2rem; font-size: 0.8rem; border-radius: var(--radius-sm);">
                                                        <option value="patient" <?= $usr['role'] === 'patient' ? 'selected' : '' ?>>Patient</option>
                                                        <option value="doctor" <?= $usr['role'] === 'doctor' ? 'selected' : '' ?>>Doctor</option>
                                                        <option value="pharmacist" <?= $usr['role'] === 'pharmacist' ? 'selected' : '' ?>>Pharmacist</option>
                                                        <option value="admin" <?= $usr['role'] === 'admin' ? 'selected' : '' ?>>Admin</option>
                                                    </select>
                                                    
                                                    <select name="status" style="padding: 0.2rem; font-size: 0.8rem; border-radius: var(--radius-sm);">
                                                        <option value="active" <?= $usr['status'] === 'active' ? 'selected' : '' ?>>Active</option>
                                                        <option value="pending" <?= $usr['status'] === 'pending' ? 'selected' : '' ?>>Pending</option>
                                                        <option value="suspended" <?= $usr['status'] === 'suspended' ? 'selected' : '' ?>>Suspended</option>
                                                    </select>
                                                    
                                                    <button type="submit" class="btn btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Save</button>
                                                </form>
                                            </td>
                                            <td>
                                                <!-- Delete Form -->
                                                <form action="admin.php?tab=users" method="post">
                                                    <?= csrf_field() ?>
                                                    <input type="hidden" name="action" value="delete_user" />
                                                    <input type="hidden" name="user_id" value="<?= intval($usr['id']) ?>" />
                                                    <button type="submit" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;" onclick="return confirm('Delete this user? All associated records will be cleared.');">Delete</button>
                                                </form>
                                            </td>
                                        </tr>
                                <?php
                                    endforeach;
                                } catch (PDOException $e) {
                                    echo '<tr><td colspan="6">Failed to load system accounts.</td></tr>';
                                }
                                ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
                        <?= render_pagination($uTotalPages, $uPage, 'admin.php?tab=users&upage={page}') ?>
                    </div>
                </div>
            
            <!-- CMS EDIT TAB -->
            <?php elseif ($tab === 'cms'): ?>
                <div class="page-header">
                    <h1>Content Management System (CMS)</h1>
                    <p class="auth-subtitle">Modify key text blocks on about and services screens dynamically.</p>
                </div>
                
                <?php
                // Fetch CMS fields
                $aboutTitle = $aboutContent = $svcTitle = $svcContent = "";
                try {
                    $ab = $GLOBALS['db']->query("SELECT * FROM `pages_content` WHERE `slug` = 'about'")->fetch();
                    $sv = $GLOBALS['db']->query("SELECT * FROM `pages_content` WHERE `slug` = 'services'")->fetch();
                    
                    $aboutTitle = $ab['title'] ?? 'About Smart Health';
                    $aboutContent = $ab['content'] ?? '';
                    $svcTitle = $sv['title'] ?? 'Our Core Digital Care Services';
                    $svcContent = $sv['content'] ?? '';
                } catch (PDOException $e) {}
                ?>
                
                <div style="display: flex; flex-direction: column; gap: 2rem;">
                    <div class="card" style="padding: 2.5rem;">
                        <h3>Edit "About Us" Screen Block</h3>
                        <form action="admin.php?tab=cms" method="post" class="auth-form" style="margin-top: 1.5rem;">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="update_cms" />
                            <input type="hidden" name="slug" value="about" />
                            
                            <label>
                                Page Title H1
                                <input type="text" name="title" value="<?= e($aboutTitle) ?>" required />
                            </label>
                            <label>
                                Paragraph Content Text
                                <textarea name="content" rows="6" required><?= e($aboutContent) ?></textarea>
                            </label>
                            
                            <button type="submit" class="btn btn-primary">Update About Us Content</button>
                        </form>
                    </div>
                    
                    <div class="card" style="padding: 2.5rem;">
                        <h3>Edit "Services" Screen Block</h3>
                        <form action="admin.php?tab=cms" method="post" class="auth-form" style="margin-top: 1.5rem;">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="update_cms" />
                            <input type="hidden" name="slug" value="services" />
                            
                            <label>
                                Page Title H1
                                <input type="text" name="title" value="<?= e($svcTitle) ?>" required />
                            </label>
                            <label>
                                Paragraph Content Text
                                <textarea name="content" rows="6" required><?= e($svcContent) ?></textarea>
                            </label>
                            
                            <button type="submit" class="btn btn-primary">Update Services Content</button>
                        </form>
                    </div>
                </div>
            
            <!-- HELP QUERIES TAB -->
            <?php elseif ($tab === 'queries'): ?>
                <div class="page-header">
                    <h1>Help Queries & Ratings</h1>
                    <p class="auth-subtitle">Submissions from contact forms and client feedback reviews.</p>
                </div>
                
                <div class="card" style="padding: 2rem;">
                    <h3>Submissions Stream</h3>
                    <div class="table-wrap" style="margin-top: 1.2rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>Sender</th>
                                    <th>Email</th>
                                    <th>Form Type</th>
                                    <th>Subject / Sentiment</th>
                                    <th>Message Details</th>
                                    <th>Submitted On</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $qPage = intval($_GET['qpage'] ?? 1);
                                if ($qPage < 1) $qPage = 1;
                                $qLimit = 10;
                                $qOffset = ($qPage - 1) * $qLimit;
                                
                                try {
                                    $qTotal = $GLOBALS['db']->query("SELECT COUNT(*) FROM `contact_feedback`")->fetchColumn();
                                    $qTotalPages = ceil($qTotal / $qLimit);
                                    
                                    $stmt = $GLOBALS['db']->prepare("SELECT * FROM `contact_feedback` ORDER BY `created_at` DESC LIMIT :limit OFFSET :offset");
                                    $stmt->bindValue(':limit', $qLimit, PDO::PARAM_INT);
                                    $stmt->bindValue(':offset', $qOffset, PDO::PARAM_INT);
                                    $stmt->execute();
                                    $queries = $stmt->fetchAll();
                                    
                                    if (count($queries) > 0) {
                                        foreach ($queries as $query):
                                ?>
                                            <tr>
                                                <td style="font-weight: 700;"><?= e($query['name']) ?></td>
                                                <td><?= e($query['email']) ?></td>
                                                <td>
                                                    <span class="badge <?= $query['form_type'] === 'contact' ? 'badge-info' : 'badge-warning' ?>">
                                                        <?= ucfirst(e($query['form_type'])) ?>
                                                    </span>
                                                </td>
                                                <td style="font-weight: 600;"><?= e($query['subject']) ?></td>
                                                <td style="font-size: 0.85rem; max-width: 250px; white-space: pre-wrap;"><?= e($query['message']) ?></td>
                                                <td style="font-size: 0.8rem;"><?= format_datetime($query['created_at']) ?></td>
                                            </tr>
                                <?php
                                        endforeach;
                                    } else {
                                        echo '<tr><td colspan="6">No queries or ratings submitted yet.</td></tr>';
                                    }
                                } catch (PDOException $e) {
                                    echo '<tr><td colspan="6">Failed to retrieve support inquiries.</td></tr>';
                                }
                                ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
                        <?= render_pagination($qTotalPages, $qPage, 'admin.php?tab=queries&qpage={page}') ?>
                    </div>
                </div>
            
            <!-- SYSTEM AUDIT TAB -->
            <?php elseif ($tab === 'logs'): ?>
                <div class="page-header">
                    <h1>Activity Auditing Logs</h1>
                    <p class="auth-subtitle">Chronological record of clinical and security actions.</p>
                </div>
                
                <div class="card" style="padding: 2rem;">
                    <h3>Action Logs Stream</h3>
                    <div class="table-wrap" style="margin-top: 1.2rem;">
                        <table>
                            <thead>
                                <tr>
                                    <th>User Account</th>
                                    <th>System Action</th>
                                    <th>IP Address</th>
                                    <th>User Agent</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $lPage = intval($_GET['lpage'] ?? 1);
                                if ($lPage < 1) $lPage = 1;
                                $lLimit = 15;
                                $lOffset = ($lPage - 1) * $lLimit;
                                
                                try {
                                    $lTotal = $GLOBALS['db']->query("SELECT COUNT(*) FROM `activity_logs`")->fetchColumn();
                                    $lTotalPages = ceil($lTotal / $lLimit);
                                    
                                    $stmt = $GLOBALS['db']->prepare("SELECT al.*, u.name, u.email FROM `activity_logs` al LEFT JOIN `users` u ON al.user_id = u.id ORDER BY al.created_at DESC LIMIT :limit OFFSET :offset");
                                    $stmt->bindValue(':limit', $lLimit, PDO::PARAM_INT);
                                    $stmt->bindValue(':offset', $lOffset, PDO::PARAM_INT);
                                    $stmt->execute();
                                    $logs = $stmt->fetchAll();
                                    
                                    if (count($logs) > 0) {
                                        foreach ($logs as $log):
                                ?>
                                            <tr>
                                                <td style="font-weight: 700;">
                                                    <?= $log['name'] ? e($log['name']) . '<br/><span style="font-size: 0.75rem; font-weight: normal; color: var(--color-text-muted);">' . e($log['email']) . '</span>' : 'Guest User' ?>
                                                </td>
                                                <td style="font-weight: 600;"><?= e($log['action']) ?></td>
                                                <td><?= e($log['ip_address']) ?></td>
                                                <td style="font-size: 0.75rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="<?= e($log['user_agent']) ?>"><?= e($log['user_agent']) ?></td>
                                                <td style="font-size: 0.8rem;"><?= format_datetime($log['created_at']) ?></td>
                                            </tr>
                                <?php
                                        endforeach;
                                    } else {
                                        echo '<tr><td colspan="5">No logs available in database.</td></tr>';
                                    }
                                } catch (PDOException $e) {
                                    echo '<tr><td colspan="5">Failed to fetch activity logs.</td></tr>';
                                }
                                ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
                        <?= render_pagination($lTotalPages, $lPage, 'admin.php?tab=logs&lpage={page}') ?>
                    </div>
                </div>
            <?php endif; ?>
            
        </main>
        
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
