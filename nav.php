<?php
// Smart base: anchor links work on home page, point back to index.php from other pages
$current = basename($_SERVER['PHP_SELF']);
$home    = ($current === 'index.php') ? '' : 'index.php';
?>
<!-- SECTION: Navigation -->
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="index.php" class="nav-logo">
      <span class="nav-logo-name">Hackett Chiropractic</span>
      <span class="nav-logo-tag">Your path to a pain-free life</span>
    </a>
    <nav class="nav-links" id="nav-links">
      <a href="<?= $home ?>#services">Services</a>
      <a href="<?= $home ?>#about">About</a>
      <a href="<?= $home ?>#testimonials">Testimonials</a>
      <a href="<?= $home ?>#contact">Hours & Contact</a>
      <a href="blog.php"<?= $current === 'blog.php' ? ' style="color:var(--primary);font-weight:700;"' : '' ?>>Blog</a>
    </nav>
    <div class="nav-right">
      <a href="tel:5558675309" class="nav-phone">(555) 867-5309</a>
      <a href="<?= $home ?>#contact" class="btn btn-primary nav-cta">Book Now</a>
    </div>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="nav-mobile" id="nav-mobile">
    <a href="<?= $home ?>#services" class="nav-mobile-link">Services</a>
    <a href="<?= $home ?>#about" class="nav-mobile-link">About</a>
    <a href="<?= $home ?>#testimonials" class="nav-mobile-link">Testimonials</a>
    <a href="<?= $home ?>#contact" class="nav-mobile-link">Hours &amp; Contact</a>
    <a href="blog.php" class="nav-mobile-link"<?= $current === 'blog.php' ? ' style="color:var(--primary);font-weight:700;"' : '' ?>>Blog</a>
    <a href="tel:5558675309" class="nav-mobile-link nav-mobile-phone">(555) 867-5309</a>
    <a href="<?= $home ?>#contact" class="btn btn-primary" style="margin-top:8px;display:block;text-align:center;">Book Now</a>
  </div>
</header>
