<?php
/**
 * Smart Health - Logout Operations
 */

require_once __DIR__ . '/../../includes/auth.php';

log_activity("User logged out");

// Execute secure logout cleanups
logout_user();

// Start session again to set flash message
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$_SESSION['success_message'] = "You have been successfully logged out.";
header("Location: login.php");
exit;
