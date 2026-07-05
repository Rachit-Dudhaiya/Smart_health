<?php
/**
 * Smart Health - Patient Dashboard Panel
 */

$pageTitle = "Patient Dashboard";
$pageDesc = "Book specialist appointments, raise ambulance SOS requests, and check medical history.";

require_once __DIR__ . '/../../includes/header.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth.php';

// Access Control
require_role(['patient', 'admin']);

$patientId = $_SESSION['user_id'];
$errorMessage = "";
$successMessage = "";

// Handle POST actions
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $errorMessage = "Security session expired. Please retry.";
    } else {
        $action = $_POST['action'];
        
        // ACTION A: Trigger Ambulance SOS
        if ($action === 'trigger_sos') {
            try {
                // Add notification to all admins and doctors
                $recipientsStmt = $GLOBALS['db']->query("SELECT `id`, `name` FROM `users` WHERE `role` IN ('admin', 'doctor')");
                $recipients = $recipientsStmt->fetchAll();
                
                $msg = "🚨 EMERGENCY: Patient " . e($_SESSION['user_name']) . " raised an Ambulance SOS Request! Ward check initiated.";
                foreach ($recipients as $recipient) {
                    add_notification($recipient['id'], $msg);
                }
                
                log_activity("Triggered Emergency SOS Ambulance request");
                $successMessage = "🚨 Emergency SOS ambulance requested successfully. Wards and ambulance staff have been notified.";
            } catch (PDOException $e) {
                log_system_error("SOS triggering failure: " . $e->getMessage());
                $errorMessage = "Failed to raise SOS request.";
            }
        }
        
        // ACTION B: Book consultation / Join Queue
        elseif ($action === 'book_consult') {
            $doctorId = intval($_POST['doctor_id'] ?? 0);
            
            if ($doctorId <= 0) {
                $errorMessage = "Please select a valid Doctor.";
            } else {
                try {
                    // Check if already in queue (waiting or in-consultation)
                    $chkStmt = $GLOBALS['db']->prepare("SELECT COUNT(*) FROM `patient_flow` WHERE `patient_id` = :pat_id AND `status` IN ('waiting', 'in-consultation')");
                    $chkStmt->execute([':pat_id' => $patientId]);
                    
                    if ($chkStmt->fetchColumn() > 0) {
                        $errorMessage = "You are already active in the consultation queue. Please complete or cancel your current checkup first.";
                    } else {
                        // Insert flow record
                        $stmt = $GLOBALS['db']->prepare("INSERT INTO `patient_flow` (`patient_id`, `doctor_id`, `status`) VALUES (:pat_id, :doc_id, 'waiting')");
                        $stmt->execute([
                            ':pat_id' => $patientId,
                            ':doc_id' => $doctorId
                        ]);
                        
                        // Notify doctor
                        $docNameStmt = $GLOBALS['db']->prepare("SELECT `name` FROM `users` WHERE `id` = :id");
                        $docNameStmt->execute([':id' => $doctorId]);
                        $docName = $docNameStmt->fetchColumn();
                        
                        add_notification($doctorId, "🔔 New Patient queued: " . e($_SESSION['user_name']));
                        
                        log_activity("Joined wait queue for Doctor ID: $doctorId");
                        $successMessage = "Successfully joined consultation queue for Dr. " . e($docName) . ". Wait times are updated live.";
                    }
                } catch (PDOException $e) {
                    log_system_error("Failed to join queue: " . $e->getMessage());
                    $errorMessage = "Failed to register appointment.";
                }
            }
        }
    }
}

// Fetch list of doctors for dropdown
$doctors = [];
try {
    $stmt = $GLOBALS['db']->query("SELECT `id`, `name` FROM `users` WHERE `role` = 'doctor' AND `status` = 'active'");
    $doctors = $stmt->fetchAll();
} catch (PDOException $e) {}

// Fetch active queue status
$activeFlow = null;
try {
    $stmt = $GLOBALS['db']->prepare("SELECT f.*, u.name as doctor_name FROM `patient_flow` f JOIN `users` u ON f.doctor_id = u.id WHERE f.patient_id = :id AND f.status IN ('waiting', 'in-consultation') LIMIT 1");
    $stmt->execute([':id' => $patientId]);
    $activeFlow = $stmt->fetch();
} catch (PDOException $e) {}

// Fetch prescription history
$history = [];
try {
    $stmt = $GLOBALS['db']->prepare("SELECT f.*, u.name as doctor_name FROM `patient_flow` f JOIN `users` u ON f.doctor_id = u.id WHERE f.patient_id = :id AND f.status = 'completed' ORDER BY f.queue_time DESC");
    $stmt->execute([':id' => $patientId]);
    $history = $stmt->fetchAll();
} catch (PDOException $e) {}
?>

<div class="container" style="padding: 2rem 0;">
    <div class="dashboard-grid">
        
        <!-- Sidebar -->
        <aside class="dashboard-sidebar">
            <h4 style="margin-bottom: 1.5rem;">Emergency Tools</h4>
            
            <div class="card" style="padding: 1.5rem; text-align: center; border-color: var(--color-danger); background-color: #fef2f2;">
                <span style="font-size: 3rem;">🚑</span>
                <h4 style="color: var(--color-danger); margin-top: 0.5rem;">Need an Ambulance?</h4>
                <p style="font-size: 0.8rem; color: #7f1d1d; margin: 0.5rem 0 1.2rem;">Clicking the button below broadcasts an emergency SOS request to clinical dispatchers.</p>
                
                <form action="patient.php" method="post" onsubmit="return confirm('WARNING: Are you sure you want to trigger an Ambulance SOS Emergency? False requests are logged.');">
                    <?= csrf_field() ?>
                    <input type="hidden" name="action" value="trigger_sos" />
                    <button type="submit" class="btn btn-danger btn-full">🚨 Trigger SOS Request</button>
                </form>
            </div>
            
            <div class="card" style="padding: 1.5rem; margin-top: 1.5rem; text-align: center;">
                <h4>Ward bed status</h4>
                <div style="margin-top: 1rem; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem; text-align: left;">
                    <?php
                    try {
                        $stmt = $GLOBALS['db']->query("SELECT * FROM `bed_inventory`");
                        $beds = $stmt->fetchAll();
                        foreach ($beds as $bed) {
                            $free = $bed['total'] - $bed['occupied'];
                            echo '<div style="display:flex; justify-content:space-between;">';
                            echo '<span>' . e($bed['ward_type']) . ' ward:</span>';
                            echo '<strong>' . $free . ' free beds</strong>';
                            echo '</div>';
                        }
                    } catch (PDOException $e) {}
                    ?>
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
            
            <!-- Live Active Queue Status -->
            <?php if ($activeFlow): ?>
                <div class="card" style="border-left: 6px solid var(--color-primary); padding: 2.5rem;">
                    <div class="badge badge-info" style="margin-bottom: 0.8rem;">
                        <?= $activeFlow['status'] === 'waiting' ? 'WAITING IN QUEUE' : 'IN CONSULTATION ROOM' ?>
                    </div>
                    <h2>Active Checkup: Dr. <?= e($activeFlow['doctor_name']) ?></h2>
                    <p style="margin: 0.5rem 0 1rem; color: var(--color-text-muted);">
                        Joined Queue: <?= format_datetime($activeFlow['queue_time']) ?>
                    </p>
                    
                    <?php if ($activeFlow['status'] === 'waiting'): ?>
                        <div style="background-color: var(--color-primary-light); padding: 1rem; border-radius: var(--radius-md);">
                            ⏳ <strong>Current Status</strong>: Please wait near the Out-Patient block. Dr. <?= e($activeFlow['doctor_name']) ?> has been notified and will call your name soon.
                        </div>
                    <?php else: ?>
                        <div style="background-color: #dbeafe; color: #1e40af; padding: 1rem; border-radius: var(--radius-md);">
                            🩺 <strong>Current Status</strong>: You are currently inside the consultation room. Physician is diagnosing your symptoms.
                        </div>
                    <?php endif; ?>
                </div>
            <?php else: ?>
                <!-- Book appointment card -->
                <div class="card" style="padding: 2.5rem;">
                    <h3>Book Consultation / Join Queue</h3>
                    <p class="auth-subtitle" style="margin-bottom: 1.5rem;">Select an on-duty doctor from the list to join their live queue.</p>
                    
                    <?php if (count($doctors) > 0): ?>
                        <form action="patient.php" method="post" class="auth-form">
                            <?= csrf_field() ?>
                            <input type="hidden" name="action" value="book_consult" />
                            
                            <label>
                                Choose Physician
                                <select name="doctor_id">
                                    <option value="" selected>-- Select Doctor --</option>
                                    <?php foreach ($doctors as $doc): ?>
                                        <option value="<?= intval($doc['id']) ?>">Dr. <?= e($doc['name']) ?> (On Call)</option>
                                    <?php endforeach; ?>
                                </select>
                            </label>
                            
                            <button type="submit" class="btn btn-primary" style="margin-top: 0.5rem;">Join Doctor's Queue</button>
                        </form>
                    <?php else: ?>
                        <div style="background-color: #fee2e2; color: #991b1b; padding: 1rem; border-radius: var(--radius-md);">
                            ⚠️ No doctors are currently checked-in or on call. Please try again later.
                        </div>
                    <?php endif; ?>
                </div>
            <?php endif; ?>
            
            <!-- Prescription History -->
            <div class="card" style="padding: 2rem;">
                <h3>My Consultation History & Prescriptions</h3>
                <div class="table-wrap" style="margin-top: 1rem;">
                    <table>
                        <thead>
                            <tr>
                                <th>Physician</th>
                                <th>Date</th>
                                <th>Wait Time</th>
                                <th>Diagnosis Notes & Prescription</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php if (count($history) > 0): ?>
                                <?php foreach ($history as $row): ?>
                                    <tr>
                                        <td style="font-weight: 700;">Dr. <?= e($row['doctor_name']) ?></td>
                                        <td><?= format_datetime($row['queue_time']) ?></td>
                                        <td><span class="badge badge-info"><?= intval($row['wait_time_minutes']) ?> min</span></td>
                                        <td style="font-size: 0.85rem; white-space: pre-wrap; font-family: monospace; background-color: var(--bg-primary); padding: 0.8rem; border-radius: var(--radius-sm); border: 1px solid var(--color-border);"><?= e($row['diagnosis_notes']) ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            <?php else: ?>
                                <tr>
                                    <td colspan="4" class="auth-subtitle" style="text-align: center; padding: 2rem;">No previous consultations recorded.</td>
                                </tr>
                            <?php endif; ?>
                        </tbody>
                    </table>
                </div>
            </div>
            
        </main>
        
    </div>
</div>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>
