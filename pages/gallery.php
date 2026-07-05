<?php
/**
 * Smart Health - Dynamic Gallery
 */

$pageTitle = "Gallery Portfolio";
$pageDesc = "Browse photos of our smart medical centers, wards, pharmacies, and operations.";

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/functions.php';
require_once __DIR__ . '/../includes/auth.php';

$galleryDir = UPLOAD_DIR . '/gallery';
if (!is_dir($galleryDir)) {
    mkdir($galleryDir, 0755, true);
}

// Handle Admin Image Upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'upload_gallery') {
    // 1. Authorization guard
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        $_SESSION['error_message'] = "Unauthorized operation.";
        header("Location: gallery.php");
        exit;
    }
    
    // 2. CSRF check
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $_SESSION['error_message'] = "Security session expired. Please retry.";
        header("Location: gallery.php");
        exit;
    }
    
    $caption = trim($_POST['caption'] ?? '');
    if (empty($caption)) {
        $_SESSION['error_message'] = "Caption is required.";
        header("Location: gallery.php");
        exit;
    }
    
    if (isset($_FILES['gallery_file'])) {
        $file = $_FILES['gallery_file'];
        
        // Validation checks
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $_SESSION['error_message'] = "Upload failed with error code: " . $file['error'];
        } elseif ($file['size'] > 3 * 1024 * 1024) { // Max 3MB
            $_SESSION['error_message'] = "Image size exceeds 3MB.";
        } else {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $mime = $finfo->file($file['tmp_name']);
            $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
            
            if (!in_array($mime, $allowedMimes)) {
                $_SESSION['error_message'] = "Invalid file type. Only JPG, PNG, and WEBP are supported.";
            } else {
                $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                // Clean caption to create file name
                $cleanCaption = preg_replace('/[^a-z0-9]/i', '_', strtolower($caption));
                $newFilename = 'gallery_' . time() . '_' . substr($cleanCaption, 0, 20) . '.' . $ext;
                $targetPath = $galleryDir . '/' . $newFilename;
                
                if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                    log_activity("Uploaded new gallery image: $newFilename");
                    $_SESSION['success_message'] = "Image uploaded to gallery successfully.";
                } else {
                    $_SESSION['error_message'] = "Could not store file. Check server write permission.";
                }
            }
        }
    } else {
        $_SESSION['error_message'] = "No image file selected.";
    }
    
    header("Location: gallery.php");
    exit;
}

// Handle Admin Image Delete
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete_gallery') {
    // 1. Authorization guard
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        $_SESSION['error_message'] = "Unauthorized operation.";
        header("Location: gallery.php");
        exit;
    }
    
    // 2. CSRF check
    if (!isset($_POST['csrf_token']) || !verify_csrf_token($_POST['csrf_token'])) {
        $_SESSION['error_message'] = "Security session expired. Please retry.";
        header("Location: gallery.php");
        exit;
    }
    
    $filename = basename($_POST['filename'] ?? '');
    $filePath = $galleryDir . '/' . $filename;
    
    if (!empty($filename) && file_exists($filePath)) {
        if (unlink($filePath)) {
            log_activity("Deleted gallery image: $filename");
            $_SESSION['success_message'] = "Image deleted successfully.";
        } else {
            $_SESSION['error_message'] = "Failed to delete file from disk.";
        }
    } else {
        $_SESSION['error_message'] = "Target image file not found.";
    }
    
    header("Location: gallery.php");
    exit;
}

// Fetch images dynamically
$images = [];
if (is_dir($galleryDir)) {
    $files = scandir($galleryDir);
    foreach ($files as $file) {
        if ($file !== '.' && $file !== '..' && in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'webp'])) {
            // Deduce caption from filename: gallery_178491823_caption_here.ext
            $parts = explode('_', pathinfo($file, PATHINFO_FILENAME));
            // Remove first two items ('gallery' and timestamp)
            if (count($parts) > 2) {
                array_shift($parts); // remove 'gallery'
                array_shift($parts); // remove timestamp
                $caption = ucwords(str_replace('_', ' ', implode('_', $parts)));
            } else {
                $caption = "Smart Health Facility";
            }
            
            $images[] = [
                'filename' => $file,
                'path' => 'uploads/gallery/' . $file,
                'caption' => $caption
            ];
        }
    }
}
?>

<div class="container" style="padding: 4rem 0;">
    <div class="page-header" style="text-align: center; margin-bottom: 3rem;">
        <p class="eyebrow">Smart Hub Facility</p>
        <h1>Smart Health Gallery</h1>
        <p class="auth-subtitle">Real photos showcasing our equipment, care beds, pharmacies, and clean workspaces.</p>
    </div>

    <!-- Admin Upload Section -->
    <?php if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin'): ?>
        <div class="card" style="margin-bottom: 3rem; max-width: 600px; margin-left: auto; margin-right: auto;">
            <h3>CMS: Upload Gallery Image</h3>
            <form action="gallery.php" method="post" enctype="multipart/form-data" class="auth-form" style="margin-top: 1.5rem;">
                <?= csrf_field() ?>
                <input type="hidden" name="action" value="upload_gallery" />
                
                <label>
                    Image Caption / Title
                    <input type="text" name="caption" placeholder="e.g. ICU Ward Block B" required />
                </label>
                
                <label>
                    Select Image File (JPG, PNG, WEBP; Max 3MB)
                    <input type="file" name="gallery_file" accept="image/jpeg, image/png, image/webp" required />
                </label>
                
                <button type="submit" class="btn btn-primary">Upload to Gallery</button>
            </form>
        </div>
    <?php endif; ?>

    <!-- Display Images -->
    <?php if (count($images) > 0): ?>
        <div class="gallery-grid">
            <?php foreach ($images as $img): ?>
                <div class="gallery-item">
                    <img src="<?= get_relative_url($img['path']) ?>" alt="<?= e($img['caption']) ?>" loading="lazy" />
                    <div class="gallery-caption">
                        <?= e($img['caption']) ?>
                        
                        <?php if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin'): ?>
                            <form action="gallery.php" method="post" style="margin-top: 0.5rem; display: inline-block;">
                                <?= csrf_field() ?>
                                <input type="hidden" name="action" value="delete_gallery" />
                                <input type="hidden" name="filename" value="<?= e($img['filename']) ?>" />
                                <button type="submit" class="btn btn-danger" style="padding: 0.2rem 0.6rem; font-size: 0.75rem;" onclick="return confirm('Are you sure you want to delete this image?');">Delete</button>
                            </form>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php else: ?>
        <div class="card" style="text-align: center; padding: 4rem 2rem;">
            <p class="auth-subtitle">The gallery is currently empty.</p>
            <?php if (isset($_SESSION['user_role']) && $_SESSION['user_role'] === 'admin'): ?>
                <p style="margin-top: 1rem;">Use the panel above to upload the first photo.</p>
            <?php else: ?>
                <p style="margin-top: 1rem;">Admin has not uploaded any facility images yet. Please check back later.</p>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
