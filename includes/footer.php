<?php
/**
 * Smart Health - Common Footer View
 */

require_once __DIR__ . '/auth.php';

$feedbackUrl = get_relative_url('pages/feedback.php');
$contactUrl = get_relative_url('pages/contact.php');
$faqUrl = get_relative_url('pages/faq.php');
$aboutUrl = get_relative_url('pages/about.php');
$servicesUrl = get_relative_url('pages/services.php');
$galleryUrl = get_relative_url('pages/gallery.php');
$jsPath = $jsPath ?? get_relative_url('assets/js/main.js');
?>
    </main>

    <!-- Toast Alerts Container -->
    <div id="toast-container" class="toast-container"></div>

    <footer class="site-footer">
        <div class="container footer-content-grid">
            <div class="footer-brand-info">
                <h3>🏥 Smart Health</h3>
                <p>Digital intelligence system built to empower clinics, clinicians, patients, and pharmacists for seamless healthcare delivery.</p>
            </div>
            <div class="footer-links-group">
                <h4>Information</h4>
                <a href="<?php echo $aboutUrl; ?>">About Us</a>
                <a href="<?php echo $servicesUrl; ?>">Core Services</a>
                <a href="<?php echo $galleryUrl; ?>">Gallery Portfolio</a>
                <a href="<?php echo $faqUrl; ?>">Help & FAQ</a>
            </div>
            <div class="footer-links-group">
                <h4>Get Involved</h4>
                <a href="<?php echo $contactUrl; ?>">Help Desk & Contact</a>
                <a href="<?php echo $feedbackUrl; ?>">Patient Feedback</a>
            </div>
        </div>
        <div class="container footer-bottom-row">
            <p>&copy; <span id="year"></span> Smart Health. All rights reserved. Secure clinical operations.</p>
            <div class="footer-meta-stamps">
                <span>🔒 SSL SECURE</span>
                <span>⚡ REAL-TIME AI</span>
            </div>
        </div>
    </footer>

    <!-- Site Core Client Scripts -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery-validate/1.20.0/jquery.validate.min.js"></script>
    <script src="<?php echo $jsPath; ?>"></script>
</body>
</html>
