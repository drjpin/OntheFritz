<?php
$current = basename($_SERVER['PHP_SELF']);
$home    = ($current === 'index.php') ? '' : 'index.php';
?>
<!-- SECTION: Footer -->
<footer class="footer">
  <div class="container footer-inner">
    <div>
      <div class="footer-logo">Hackett Chiropractic</div>
      <div class="footer-address">1234 Wellness Blvd, Suite 100<br>Springfield, IL 62701<br>(555) 867-5309</div>
    </div>
    <div>
      <div class="footer-links-title">Quick Links</div>
      <a href="<?= $home ?>#services" class="footer-link">Services</a>
      <a href="<?= $home ?>#about" class="footer-link">About</a>
      <a href="<?= $home ?>#testimonials" class="footer-link">Testimonials</a>
      <a href="<?= $home ?>#contact" class="footer-link">Hours &amp; Contact</a>
      <a href="blog.php" class="footer-link">Blog</a>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <span>&copy; <?= date('Y') ?> Hackett Chiropractic. All rights reserved.</span>
    </div>
  </div>
</footer>
