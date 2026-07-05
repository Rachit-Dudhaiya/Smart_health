<?php
/**
 * Smart Health - Database Connection and Bootstrapper
 */

require_once __DIR__ . '/../config/config.php';

try {
    // 1. Connect to MySQL Server (Without selecting DB first to support auto-creation)
    $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // 2. Create Database if not exists
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `" . DB_NAME . "`");

    // 3. Create Tables
    
    // USERS Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(150) NOT NULL UNIQUE,
        `password_hash` VARCHAR(255) NOT NULL,
        `role` ENUM('admin', 'doctor', 'patient', 'pharmacist') NOT NULL DEFAULT 'patient',
        `profile_photo` VARCHAR(255) DEFAULT NULL,
        `status` ENUM('pending', 'active', 'suspended') NOT NULL DEFAULT 'active',
        `verification_token` VARCHAR(100) DEFAULT NULL,
        `reset_token` VARCHAR(100) DEFAULT NULL,
        `reset_token_expires` DATETIME DEFAULT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_email (`email`),
        INDEX idx_user_role (`role`)
    ) ENGINE=InnoDB");

    // REMEMBER ME TOKENS Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `remember_tokens` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `selector` VARCHAR(24) NOT NULL UNIQUE,
        `token_hash` VARCHAR(64) NOT NULL,
        `expires` DATETIME NOT NULL,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB");

    // MEDICINE STOCK Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `medicine_stock` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(150) NOT NULL,
        `stock` INT NOT NULL DEFAULT 0,
        `threshold` INT NOT NULL DEFAULT 10,
        `expiry_date` DATE NOT NULL,
        `status` ENUM('normal', 'low', 'critical', 'expired') NOT NULL DEFAULT 'normal',
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_med_name (`name`)
    ) ENGINE=InnoDB");

    // BED INVENTORY Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `bed_inventory` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `ward_type` ENUM('ICU', 'General', 'Pediatric', 'Emergency') NOT NULL UNIQUE,
        `total` INT NOT NULL DEFAULT 0,
        `occupied` INT NOT NULL DEFAULT 0,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    // DOCTOR ATTENDANCE Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `doctor_attendance` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `doctor_id` INT NOT NULL,
        `record_date` DATE NOT NULL,
        `status` ENUM('present', 'absent', 'late', 'leave') NOT NULL DEFAULT 'absent',
        `check_in` TIME DEFAULT NULL,
        `check_out` TIME DEFAULT NULL,
        UNIQUE KEY `uq_doctor_date` (`doctor_id`, `record_date`),
        FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB");

    // PATIENT FLOW Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `patient_flow` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `patient_id` INT NOT NULL,
        `doctor_id` INT NOT NULL,
        `queue_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `wait_time_minutes` INT NOT NULL DEFAULT 0,
        `status` ENUM('waiting', 'in-consultation', 'completed', 'cancelled') NOT NULL DEFAULT 'waiting',
        `diagnosis_notes` TEXT DEFAULT NULL,
        FOREIGN KEY (`patient_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`doctor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX idx_flow_status (`status`)
    ) ENGINE=InnoDB");

    // CONTACT & FEEDBACK Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `contact_feedback` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `email` VARCHAR(150) NOT NULL,
        `form_type` ENUM('contact', 'feedback') NOT NULL,
        `subject` VARCHAR(150) NOT NULL,
        `message` TEXT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    // NOTIFICATIONS Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `notifications` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT NOT NULL,
        `message` TEXT NOT NULL,
        `is_read` TINYINT(1) NOT NULL DEFAULT 0,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        INDEX idx_notif_unread (`user_id`, `is_read`)
    ) ENGINE=InnoDB");

    // ACTIVITY LOGS Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `activity_logs` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `user_id` INT DEFAULT NULL,
        `action` VARCHAR(255) NOT NULL,
        `ip_address` VARCHAR(45) NOT NULL,
        `user_agent` VARCHAR(255) NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB");

    // PAGES CONTENT (CMS) Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS `pages_content` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `slug` VARCHAR(100) NOT NULL UNIQUE,
        `title` VARCHAR(200) NOT NULL,
        `content` TEXT NOT NULL,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");

    // 4. Seed Data
    
    // Seed Users if empty
    $count = $pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    if ($count == 0) {
        $users = [
            [
                'name' => 'System Admin',
                'email' => 'admin@smarthealth.com',
                'password_hash' => password_hash('Admin123!', PASSWORD_DEFAULT),
                'role' => 'admin',
                'status' => 'active'
            ],
            [
                'name' => 'Dr. Aditi Shah',
                'email' => 'doctor@smarthealth.com',
                'password_hash' => password_hash('Doctor123!', PASSWORD_DEFAULT),
                'role' => 'doctor',
                'status' => 'active'
            ],
            [
                'name' => 'Rahul Pharmacist',
                'email' => 'pharmacist@smarthealth.com',
                'password_hash' => password_hash('Pharmacist123!', PASSWORD_DEFAULT),
                'role' => 'pharmacist',
                'status' => 'active'
            ],
            [
                'name' => 'Rajesh Kumar',
                'email' => 'patient@smarthealth.com',
                'password_hash' => password_hash('Patient123!', PASSWORD_DEFAULT),
                'role' => 'patient',
                'status' => 'active'
            ]
        ];

        $stmt = $pdo->prepare("INSERT INTO `users` (`name`, `email`, `password_hash`, `role`, `status`) VALUES (:name, :email, :password_hash, :role, :status)");
        foreach ($users as $user) {
            $stmt->execute($user);
        }
    }

    // Seed Bed Inventory if empty
    $count = $pdo->query("SELECT COUNT(*) FROM `bed_inventory`")->fetchColumn();
    if ($count == 0) {
        $beds = [
            ['ward_type' => 'ICU', 'total' => 10, 'occupied' => 8],
            ['ward_type' => 'General', 'total' => 30, 'occupied' => 14],
            ['ward_type' => 'Pediatric', 'total' => 15, 'occupied' => 7],
            ['ward_type' => 'Emergency', 'total' => 8, 'occupied' => 6]
        ];

        $stmt = $pdo->prepare("INSERT INTO `bed_inventory` (`ward_type`, `total`, `occupied`) VALUES (:ward_type, :total, :occupied)");
        foreach ($beds as $bed) {
            $stmt->execute($bed);
        }
    }

    // Seed Medicine Stock if empty
    $count = $pdo->query("SELECT COUNT(*) FROM `medicine_stock`")->fetchColumn();
    if ($count == 0) {
        $medicines = [
            ['name' => 'Paracetamol 650mg', 'stock' => 120, 'threshold' => 20, 'expiry_date' => date('Y-m-d', strtotime('+6 months')), 'status' => 'normal'],
            ['name' => 'ORS Packets', 'stock' => 80, 'threshold' => 15, 'expiry_date' => date('Y-m-d', strtotime('+12 months')), 'status' => 'normal'],
            ['name' => 'Insulin Glargine', 'stock' => 15, 'threshold' => 25, 'expiry_date' => date('Y-m-d', strtotime('+3 months')), 'status' => 'critical'],
            ['name' => 'Amoxicillin 500mg', 'stock' => 45, 'threshold' => 10, 'expiry_date' => date('Y-m-d', strtotime('+9 months')), 'status' => 'normal'],
            ['name' => 'Metformin 500mg', 'stock' => 8, 'threshold' => 15, 'expiry_date' => date('Y-m-d', strtotime('+1 month')), 'status' => 'low'],
            ['name' => 'Cough Syrup 100ml', 'stock' => 50, 'threshold' => 10, 'expiry_date' => date('Y-m-d', strtotime('-5 days')), 'status' => 'expired']
        ];

        $stmt = $pdo->prepare("INSERT INTO `medicine_stock` (`name`, `stock`, `threshold`, `expiry_date`, `status`) VALUES (:name, :stock, :threshold, :expiry_date, :status)");
        foreach ($medicines as $med) {
            $stmt->execute($med);
        }
    }

    // Seed CMS Page Contents if empty
    $count = $pdo->query("SELECT COUNT(*) FROM `pages_content`")->fetchColumn();
    if ($count == 0) {
        $contents = [
            [
                'slug' => 'about',
                'title' => 'About Smart Health',
                'content' => 'Smart Health is a state-of-the-art AI-powered Primary Healthcare (PHC) & Community Healthcare (CHC) management system. Our mission is to digitize healthcare facilities in rural and urban spaces, streamlining access to patient data, medicine inventory, doctor attendance, and critical ward beds. By integrating prediction analytics, we assist local administrators in preventing stock-outs and managing peak queues with ease.'
            ],
            [
                'slug' => 'services',
                'title' => 'Our Core Digital Care Services',
                'content' => 'We offer five key operational services designed for clinical efficiency: 1. Live Medicine Stock Monitoring to maintain critical supply, 2. Dynamic Bed Occupancy tracking for emergency referrals, 3. Patient Flow analytics to decrease emergency wait times, 4. Secure digital doctor attendance rosters, and 5. Rapid Emergency SOS responses connecting patients directly with ambulance services.'
            ]
        ];

        $stmt = $pdo->prepare("INSERT INTO `pages_content` (`slug`, `title`, `content`) VALUES (:slug, :title, :content)");
        foreach ($contents as $content) {
            $stmt->execute($content);
        }
    }

    // Assign global PDO reference
    $GLOBALS['db'] = $pdo;

} catch (PDOException $e) {
    if (DEV_MODE) {
        die("Database Connection failed: " . $e->getMessage());
    } else {
        // Safe logging in production
        error_log("DB Connection Error: " . $e->getMessage());
        die("A connection error occurred. Please contact the administrator.");
    }
}
