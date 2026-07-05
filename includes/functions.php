<?php
/**
 * Smart Health - Helper and Utility Functions
 */

require_once __DIR__ . '/db.php';

// Prevent direct access
if (count(get_included_files()) === 1) {
    http_response_code(403);
    exit('Direct access not permitted.');
}

/**
 * Escape output for XSS protection
 */
function e($value) {
    return htmlspecialchars($value ?? '', ENT_QUOTES, 'UTF-8');
}

/**
 * Get client IP address safely
 */
function get_ip() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        // Can be a comma-separated list
        $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($parts[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

/**
 * Write a security or system error to a secure log file
 */
function log_system_error($message, $type = 'SYSTEM') {
    $timestamp = date('Y-m-d H:i:s');
    $ip = get_ip();
    $formattedMessage = "[$timestamp] [$ip] [$type]: $message" . PHP_EOL;
    
    $logFile = LOG_DIR . '/error.log';
    file_put_contents($logFile, $formattedMessage, FILE_APPEND | LOCK_EX);
}

/**
 * Log user activity into database for auditing
 */
function log_activity($action, $userId = null) {
    global $db;
    
    // Auto-detect user id if not passed
    if ($userId === null && isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
    }
    
    $ip = get_ip();
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
    
    try {
        $stmt = $db->prepare("INSERT INTO `activity_logs` (`user_id`, `action`, `ip_address`, `user_agent`) VALUES (:user_id, :action, :ip_address, :user_agent)");
        $stmt->execute([
            ':user_id' => $userId,
            ':action' => $action,
            ':ip_address' => $ip,
            ':user_agent' => substr($userAgent, 0, 255)
        ]);
    } catch (PDOException $e) {
        log_system_error("Failed to log activity: " . $e->getMessage(), 'DB_LOG');
    }
}

/**
 * Add a notification for a user
 */
function add_notification($userId, $message) {
    global $db;
    try {
        $stmt = $db->prepare("INSERT INTO `notifications` (`user_id`, `message`, `is_read`) VALUES (:user_id, :message, 0)");
        return $stmt->execute([
            ':user_id' => $userId,
            ':message' => $message
        ]);
    } catch (PDOException $e) {
        log_system_error("Failed to add notification: " . $e->getMessage(), 'NOTIFICATION');
        return false;
    }
}

/**
 * Securely handle profile image uploads
 */
function upload_profile_photo($file, $userId) {
    // Check if there was an upload error
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'message' => 'Upload error code: ' . $file['error']];
    }
    
    // Validate file size (max 2MB)
    if ($file['size'] > 2 * 1024 * 1024) {
        return ['success' => false, 'message' => 'File size exceeds maximum limit of 2MB.'];
    }
    
    // Validate MIME type
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (!in_array($mimeType, $allowedMimeTypes)) {
        return ['success' => false, 'message' => 'Invalid file format. Only JPG, PNG, and WEBP images are allowed.'];
    }
    
    // Validate file extension
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    
    if (!in_array($extension, $allowedExtensions)) {
        return ['success' => false, 'message' => 'Invalid file extension. Only JPG, PNG, and WEBP are allowed.'];
    }
    
    // Check image integrity (will return false if not valid image)
    $imageSize = @getimagesize($file['tmp_name']);
    if ($imageSize === false) {
        return ['success' => false, 'message' => 'Uploaded file is not a valid image.'];
    }
    
    // Create upload folder if not exists
    $userUploadDir = UPLOAD_DIR . '/profile_photos';
    if (!is_dir($userUploadDir)) {
        mkdir($userUploadDir, 0755, true);
    }
    
    // Generate secure randomized file name
    $newFileName = 'user_' . $userId . '_' . bin2hex(random_bytes(8)) . '.' . $extension;
    $targetPath = $userUploadDir . '/' . $newFileName;
    
    // Move the uploaded file
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $webPath = 'uploads/profile_photos/' . $newFileName;
        return ['success' => true, 'path' => $webPath];
    }
    
    return ['success' => false, 'message' => 'Could not move file to upload directory. Check permissions.'];
}

/**
 * Generate pagination links HTML
 */
function render_pagination($totalPages, $currentPage, $urlPattern) {
    if ($totalPages <= 1) {
        return '';
    }
    
    $html = '<div class="pagination">';
    
    // Previous Link
    if ($currentPage > 1) {
        $prevUrl = str_replace('{page}', $currentPage - 1, $urlPattern);
        $html .= '<a href="' . e($prevUrl) . '" class="page-link">&laquo; Prev</a>';
    } else {
        $html .= '<span class="page-link disabled">&laquo; Prev</span>';
    }
    
    // Page Numbers
    for ($i = 1; $i <= $totalPages; $i++) {
        if ($i == $currentPage) {
            $html .= '<span class="page-link active">' . $i . '</span>';
        } else {
            $url = str_replace('{page}', $i, $urlPattern);
            $html .= '<a href="' . e($url) . '" class="page-link">' . $i . '</a>';
        }
    }
    
    // Next Link
    if ($currentPage < $totalPages) {
        $nextUrl = str_replace('{page}', $currentPage + 1, $urlPattern);
        $html .= '<a href="' . e($nextUrl) . '" class="page-link">Next &raquo;</a>';
    } else {
        $html .= '<span class="page-link disabled">Next &raquo;</span>';
    }
    
    $html .= '</div>';
    return $html;
}

/**
 * Format date nicely
 */
function format_datetime($timestamp) {
    return date('d M Y, h:i A', strtotime($timestamp));
}

/**
 * Check if string is empty
 */
function is_blank($value) {
    return !isset($value) || trim($value) === '';
}
