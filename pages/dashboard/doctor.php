<?php
/**
 * Smart Health - Doctor Dashboard Panel
 */

$pageTitle = "Doctor Portal";
$pageDesc = "Physician roster management, patient queues, and digital diagnosis notes.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

// Access Control
require_role(['doctor', 'admin']);

$doctorId = $_SESSION['user_id'];
$errorMessage = "";
$successMessage = "";

// 1. Handle Attendance Logs
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please retry.";
    } else {
        $action = $_POST['action'];
        
        // ACTION A: Clock In
        if ($action === 'clock_in') {
            try {
                $status = 'present';
                $curTime = date('H:i:s');
                // Calculate lateness: let's say normal starts at 09:00:00
                if (time() > strtotime(date('Y-m-d') . ' 09:15:00')) {
                    $status = 'late';
                }
                
                $stmt = $GLOBALS['db']->prepare("INSERT INTO `doctor_attendance` (`doctor_id`, `record_date`, `status`, `check_in`) VALUES (:doc_id, CURDATE(), :status, :check_in) ON DUPLICATE KEY UPDATE `status` = :status, `check_in` = :check_in");
                $stmt->execute([
                    ':doc_id' => $doctorId,
                    ':status' => $status,
                    ':check_in' => $curTime
                ]);
                
                log_activity("Doctor checked in today ($status at $curTime)");
                $successMessage = "You have successfully clocked in for today at $curTime ($status).";
            } catch (PDOException $e) {
                log_system_error("Clock in database failure: " . $e->getMessage());
                $errorMessage = "Failed to mark check-in roster.";
            }
        }
        
        // ACTION B: Clock Out
        elseif ($action === 'clock_out') {
            try {
                $curTime = date('H:i:s');
                $stmt = $GLOBALS['db']->prepare("UPDATE `doctor_attendance` SET `check_out` = :check_out WHERE `doctor_id` = :doc_id AND `record_date` = CURDATE()");
                $stmt->execute([
                    ':check_out' => $curTime,
                    ':doc_id' => $doctorId
                ]);
                
                log_activity("Doctor checked out today ($curTime)");
                $successMessage = "You have successfully clocked out for today at $curTime.";
            } catch (PDOException $e) {
                log_system_error("Clock out database failure: " . $e->getMessage());
                $errorMessage = "Failed to mark check-out roster.";
            }
        }
        
        // ACTION C: Update Consultation State
        elseif ($action === 'start_consult') {
            $flowId = intval($_POST['flow_id'] ?? 0);
            try {
                // Calculate wait time in minutes
                $flowStmt = $GLOBALS['db']->prepare("SELECT `queue_time` FROM `patient_flow` WHERE `id` = :id LIMIT 1");
                $flowStmt->execute([':id' => $flowId]);
                $qTime = $flowStmt->fetchColumn();
                $waitSec = time() - strtotime($qTime);
                $waitMin = round($waitSec / 60);
                
                $stmt = $GLOBALS['db']->prepare("UPDATE `patient_flow` SET `status` = 'in-consultation', `wait_time_minutes` = :wait WHERE `id` = :id AND `doctor_id` = :doc_id");
                $stmt->execute([
                    ':wait' => $waitMin,
                    ':id' => $flowId,
                    ':doc_id' => $doctorId
                ]);
                
                log_activity("Started consultation for Flow ID: $flowId");
                $successMessage = "Consultation session started.";
            } catch (PDOException $e) {
                log_system_error("Start consult failure: " . $e->getMessage());
                $errorMessage = "Database update error.";
            }
        }
        
        // ACTION D: Complete Consultation with notes
        elseif ($action === 'complete_consult') {
            $flowId = intval($_POST['flow_id'] ?? 0);
            $notes = trim($_POST['notes'] ?? '');
            
            if (is_blank($notes)) {
                $errorMessage = "Diagnosis notes and prescription are required to complete checkup.";
            } else {
                try {
                    // Update patient flow
                    $stmt = $GLOBALS['db']->prepare("UPDATE `patient_flow` SET `status` = 'completed', `diagnosis_notes` = :notes WHERE `id` = :id AND `doctor_id` = :doc_id");
                    $stmt->execute([
                        ':notes' => $notes,
                        ':id' => $flowId,
                        ':doc_id' => $doctorId
                    ]);
                    
                    // Fetch patient details to notify
                    $patStmt = $GLOBALS['db']->prepare("SELECT f.patient_id, u.name FROM `patient_flow` f JOIN `users` u ON f.patient_id = u.id WHERE f.id = :id");
                    $patStmt->execute([':id' => $flowId]);
                    $patRow = $patStmt->fetch();
                    
                    if ($patRow) {
                        add_notification($patRow['patient_id'], "🩺 Dr. " . e($_SESSION['user_name']) . " completed your checkup. View prescription details in dashboard.");
                        
                        // Notify pharmacists to dispense medicines
                        // Fetch pharmacists
                        $pharList = $GLOBALS['db']->query("SELECT `id` FROM `users` WHERE `role` = 'pharmacist'")->fetchAll(PDO::PARAM_COLUMN);
                        foreach ($pharList as $phId) {
                            add_notification($phId, "💊 Prescriptions uploaded for Patient: " . e($patRow['name']) . ". Please prepare dispensary stock.");
                        }
                    }
                    
                    log_activity("Completed consultation flow ID: $flowId");
                    $successMessage = "Consultation marked completed. Alerts sent.";
                } catch (PDOException $e) {
                    log_system_error("Complete consult failure: " . $e->getMessage());
                    $errorMessage = "Database update error.";
                }
            }
        }
    }
}

// 2. Fetch Clock status
$attendanceToday = null;
try {
    $stmt = $GLOBALS['db']->prepare("SELECT * FROM `doctor_attendance` WHERE `doctor_id` = :id AND `record_date` = CURDATE() LIMIT 1");
    $stmt->execute([':id' => $doctorId]);
    $attendanceToday = $stmt->fetch();
} catch (PDOException $e) {}

// 3. Fetch Patient Flow Queues
$waitingQueue = [];
$activeConsult = null;

try {
    // Waiting patients list
    $stmt = $GLOBALS['db']->prepare("SELECT f.*, u.name, u.email FROM `patient_flow` f JOIN `users` u ON f.patient_id = u.id WHERE f.doctor_id = :doc_id AND f.status = 'waiting' ORDER BY f.queue_time ASC");
    $stmt->execute([':doc_id' => $doctorId]);
    $waitingQueue = $stmt->fetchAll();
    
    // Active consultation patient
    $stmt = $GLOBALS['db']->prepare("SELECT f.*, u.name, u.email FROM `patient_flow` f JOIN `users` u ON f.patient_id = u.id WHERE f.doctor_id = :doc_id AND f.status = 'in-consultation' LIMIT 1");
    $stmt->execute([':doc_id' => $doctorId]);
    $activeConsult = $stmt->fetch();
} catch (PDOException $e) {
    log_system_error("Failed to load doctor queues: " . $e->getMessage());
}
?>

<div class="container" style="padding: 2rem 0;">
    <div class="dashboard-grid">
        
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
            <h4 style="margin-bottom: 1.5rem;">Clock Terminal</h4>
            
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">🩺</div>
                <h3>Dr. <?= e($_SESSION['user_name']) ?></h3>
                <p class="badge badge-success" style="margin-top: 0.5rem;">On Call</p>
            </div>
            
            <!-- Clock form block -->
            <div class="card" style="padding: 1.5rem; text-align: center; background-color: var(--bg-primary);">
                <h4>Shift Roster Status</h4>
                <div style="margin: 1rem 0;">
                    <?php if (!$attendanceToday): ?>
                        <p class="badge badge-danger">Not Clocked In</p>
                    <?php elseif (!$attendanceToday['check_out']): ?>
                        <p class="badge badge-success">Clocked In at <?= e($attendanceToday['check_in']) ?></p>
                    <?php else: ?>
                        <p class="badge badge-info">Shift Completed (In: <?= e($attendanceToday['check_in']) ?> | Out: <?= e($attendanceToday['check_out']) ?>)</p>
                    <?php endif; ?>
                </div>
                
                <form action="doctor.php" method="post">
                    <?= csrf_field() ?>
                    <?php if (!$attendanceToday): ?>
                        <input type="hidden" name="action" value="clock_in" />
                        <button type="submit" class="btn btn-primary btn-full">⏰ Check In Shift</button>
                    <?php elseif (!$attendanceToday['check_out']): ?>
                        <input type="hidden" name="action" value="clock_out" />
                        <button type="submit" class="btn btn-danger btn-full">⏰ Check Out Shift</button>
                    <?php else: ?>
                        <button class="btn btn-secondary btn-full" disabled>Shift Ended</button>
                    <?php endif; ?>
                </form>
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
            
            <!-- Active consultation card -->
            <?php if ($activeConsult): ?>
                <section class="card" style="border-color: var(--color-primary); border-width: 2px; padding: 2.5rem;">
                    <div class="badge badge-success" style="margin-bottom: 0.8rem;">IN CONSULTATION</div>
                    <h2>Active Patient: <?= e($activeConsult['name']) ?></h2>
                    <p class="auth-subtitle" style="margin-bottom: 1.5rem;">Email: <?= e($activeConsult['email']) ?> | Queue Entry: <?= format_datetime($activeConsult['queue_time']) ?></p>
                    
                    <form action="doctor.php" method="post" class="auth-form">
                        <?= csrf_field() ?>
                        <input type="hidden" name="action" value="complete_consult" />
                        <input type="hidden" name="flow_id" value="<?= intval($activeConsult['id']) ?>" />
                        
                        <label>
                            Diagnosis Notes & Prescriptions (Medicines to dispense)
                            <textarea name="notes" rows="6" placeholder="e.g. Diagnosed with seasonal flu. Prescribed: Paracetamol 650mg twice daily for 3 days. Take bed rest." required></textarea>
                        </label>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Complete Consultation & Upload Notes</button>
                    </form>
                </section>
            <?php endif; ?>
            
            <!-- Queue Section -->
            <section class="card" style="padding: 2rem;">
                <h3>Out-Patient Waiting Queue (<?= count($waitingQueue) ?> patients)</h3>
                
                <div class="table-wrap" style="margin-top: 1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Patient Name</th>
                                <th>Email</th>
                                <th>Joined Queue At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (count($waitingQueue) > 0): ?>
                                <?php foreach ($waitingQueue as $row): ?>
                                    <tr>
                                        <td style="font-weight: 700;"><?= e($row['name']) ?></td>
                                        <td><?= e($row['email']) ?></td>
                                        <td><?= format_datetime($row['queue_time']) ?></td>
                                        <td>
                                            <?php if ($activeConsult): ?>
                                                <button class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" disabled>Wait Active</button>
                                            <?php else: ?>
                                                <form action="doctor.php" method="post">
                                                    <?= csrf_field() ?>
                                                    <input type="hidden" name="action" value="start_consult" />
                                                    <input type="hidden" name="flow_id" value="<?= intval($row['id']) ?>" />
                                                    <button type="submit" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Start Checkup</button>
                                                </form>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="4" class="auth-subtitle" style="text-align: center; padding: 2rem;">No patients waiting in queue currently.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </section>
            
            <!-- History checkup logs -->
            <section class="card" style="padding: 2rem;">
                <h3>Recent Completed Checkups</h3>
                <div class="table-wrap" style="margin-top: 1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Checkup Time</th>
                                <th>Wait Duration</th>
                                <th>Diagnosis Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            try {
                                $stmt = $GLOBALS['db']->prepare("SELECT f.*, u.name FROM `patient_flow` f JOIN `users` u ON f.patient_id = u.id WHERE f.doctor_id = :doc_id AND f.status = 'completed' ORDER BY f.queue_time DESC LIMIT 5");
                                $stmt->execute([':doc_id' => $doctorId]);
                                $completed = $stmt->fetchAll();
                                
                                if (count($completed) > 0) {
                                    foreach ($completed as $c):
                                ?>
                                        <tr>
                                            <td style="font-weight: 700;"><?= e($c['name']) ?></td>
                                            <td><?= format_datetime($c['queue_time']) ?></td>
                                            <td><span class="badge badge-info"><?= intval($c['wait_time_minutes']) ?> min</span></td>
                                            <td style="font-size: 0.85rem; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="<?= e($c['diagnosis_notes']) ?>"><?= e($c['diagnosis_notes']) ?></td>
                                        </tr>
                                <?php
                                    endforeach;
                                } else {
                                    echo '<tr><td colspan="4" class="auth-subtitle" style="text-align: center; padding: 1rem;">No checkups completed today.</td></tr>';
                                }
                            } catch (PDOException $e) {}
                            ?>
                        </tbody>
                    </table>
                </div>
            </section>
            
        </main>
        
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
