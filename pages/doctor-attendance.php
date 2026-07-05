<?php
/**
 * Smart Health - Public Doctor Attendance Module
 */

$pageTitle = "Doctor Roster & Attendance";
$pageDesc = "Real-time doctor attendance roster, checked-in statuses, and active physicians on call.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

$roster = [];
$totalDoctors = 0;
$presentToday = 0;
$absentToday = 0;

try {
    // 1. Total active doctors
    $totalDoctors = $GLOBALS['db']->query("SELECT COUNT(*) FROM `users` WHERE `role` = 'doctor' AND `status` = 'active'")->fetchColumn();
    
    // 2. Doctor attendance today
    $presentToday = $GLOBALS['db']->query("SELECT COUNT(*) FROM `doctor_attendance` WHERE `record_date` = CURDATE() AND `status` IN ('present', 'late')")->fetchColumn();
    $absentToday = max(0, $totalDoctors - $presentToday);
    
    // 3. Fetch full doctor list joined with attendance for today
    $sql = "SELECT u.name, u.email, u.profile_photo, da.status as attendance_status, da.check_in, da.check_out 
            FROM `users` u 
            LEFT JOIN `doctor_attendance` da ON u.id = da.doctor_id AND da.record_date = CURDATE() 
            WHERE u.role = 'doctor' AND u.status = 'active'
            ORDER BY u.name ASC";
    $roster = $GLOBALS['db']->query($sql)->fetchAll();
} catch (PDOException $e) {
    log_system_error("Failed to load doctor attendance rosters: " . $e->getMessage());
}
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 3.5rem;">
        <p class="eyebrow">Roster Tracking</p>
        <h1>Doctor Shift Attendance</h1>
        <p class="auth-subtitle">Verify which clinical physicians are currently checked-in, on call, or off-duty today.</p>
    </div>
    
    <!-- Stats Row -->
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); margin-bottom: 3rem;">
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">🩺</span>
            <strong><?= $totalDoctors ?></strong>
            <span style="margin-top: 0.5rem;">Total Staff Doctors</span>
        </div>
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main); border-bottom: 4px solid var(--color-success);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">🕒</span>
            <strong><?= $presentToday ?></strong>
            <span style="margin-top: 0.5rem;">Physicians Checked-in Today</span>
        </div>
        <div class="mini-card" style="background-color: var(--bg-surface); padding: 2rem; border: 1px solid var(--color-border); box-shadow: var(--shadow-main); border-bottom: 4px solid var(--color-danger);">
            <span style="font-size: 2rem; margin-bottom: 0.5rem;">💤</span>
            <strong><?= $absentToday ?></strong>
            <span style="margin-top: 0.5rem;">Off-Duty / Absent Today</span>
        </div>
    </div>
    
    <!-- Doctor list cards -->
    <div class="card" style="padding: 2.5rem;">
        <h3>Today's Roster Sheet</h3>
        <div class="table-wrap" style="margin-top: 1.2rem;">
            <table>
                <thead>
                    <tr>
                        <th>Physician Name</th>
                        <th>Email Contact</th>
                        <th>Daily Duty State</th>
                        <th>Arrival Clock-In</th>
                        <th>Departure Clock-Out</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (count($roster) > 0): ?>
                        <?php foreach ($roster as $doc): 
                            $status = $doc['attendance_status'] ?: 'absent';
                            $badge = 'badge-danger';
                            if ($status === 'present') $badge = 'badge-success';
                            elseif ($status === 'late') $badge = 'badge-warning';
                            elseif ($status === 'leave') $badge = 'badge-info';
                        ?>
                            <tr>
                                <td style="font-weight: 700; display: flex; align-items: center; gap: 0.8rem;">
                                    <?php if (!empty($doc['profile_photo'])): ?>
                                        <img src="<?= get_relative_url($doc['profile_photo']) ?>" alt="Doctor" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" />
                                    <?php else: ?>
                                        <div style="width: 36px; height: 36px; border-radius: 50%; background-color: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.95rem;">
                                            <?= strtoupper(substr($doc['name'], 0, 1)) ?>
                                        </div>
                                    <?php endif; ?>
                                    <span>Dr. <?= e($doc['name']) ?></span>
                                </td>
                                <td><?= e($doc['email']) ?></td>
                                <td>
                                    <span class="badge <?= $badge ?>">
                                        <?= ucfirst(e($status)) ?>
                                    </span>
                                </td>
                                <td>
                                    <strong><?= $doc['check_in'] ? date('h:i A', strtotime($doc['check_in'])) : '--:--' ?></strong>
                                </td>
                                <td>
                                    <strong><?= $doc['check_out'] ? date('h:i A', strtotime($doc['check_out'])) : '--:--' ?></strong>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr>
                            <td colspan="5" class="auth-subtitle" style="text-align: center; padding: 2rem;">No active physicians registered in clinic rosters.</td>
                        </tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <?php if (isset($_SESSION['user_role']) && ($_SESSION['user_role'] === 'doctor' || $_SESSION['user_role'] === 'admin')): ?>
            <div style="margin-top: 1.5rem; text-align: right;">
                <a href="<?= get_relative_url('pages/dashboard/doctor.php') ?>" class="btn btn-secondary">⏰ Manage Shift Attendance Clocking</a>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
