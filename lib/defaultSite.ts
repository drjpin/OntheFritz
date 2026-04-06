export const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sunrise Chiropractic | Feel Better. Move Better. Live Better.</title>
  <meta name="description" content="Expert, compassionate chiropractic care for the whole family in Springfield, IL. Accepting new patients — same-week appointments available. Call (555) 867-5309." />
  <meta name="keywords" content="chiropractor, chiropractic care, back pain, neck pain, Springfield IL, spinal adjustments" />

  <!-- Open Graph -->
  <meta property="og:title" content="Sunrise Chiropractic" />
  <meta property="og:description" content="Expert chiropractic care for the whole family. Accepting new patients." />
  <meta property="og:type" content="website" />

  <!-- Schema.org LocalBusiness -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "Sunrise Chiropractic",
    "description": "Expert, compassionate chiropractic care for the whole family.",
    "telephone": "(555) 867-5309",
    "email": "hello@sunrisechiro.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "1234 Wellness Blvd, Suite 100",
      "addressLocality": "Springfield",
      "addressRegion": "IL",
      "postalCode": "62701"
    },
    "openingHours": ["Mo-Th 09:00-18:00", "Fr 09:00-17:00", "Sa 09:00-12:00"]
  }
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

<!-- SECTION: Navigation -->
<header class="nav" id="nav">
  <div class="container nav-inner">
    <a href="#home" class="nav-logo">
      <span class="nav-logo-name">Sunrise Chiropractic</span>
      <span class="nav-logo-tag">Your path to a pain-free life</span>
    </a>
    <nav class="nav-links" id="nav-links">
      <a href="#services">Services</a>
      <a href="#about">About</a>
      <a href="#testimonials">Testimonials</a>
      <a href="#contact">Hours & Contact</a>
    </nav>
    <div class="nav-right">
      <a href="tel:5558675309" class="nav-phone">(555) 867-5309</a>
      <a href="#contact" class="btn btn-primary nav-cta">Book Now</a>
    </div>
    <button class="nav-hamburger" id="nav-hamburger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </button>
  </div>
  <div class="nav-mobile" id="nav-mobile">
    <a href="#services" class="nav-mobile-link">Services</a>
    <a href="#about" class="nav-mobile-link">About</a>
    <a href="#testimonials" class="nav-mobile-link">Testimonials</a>
    <a href="#contact" class="nav-mobile-link">Hours &amp; Contact</a>
    <a href="tel:5558675309" class="nav-mobile-link nav-mobile-phone">(555) 867-5309</a>
    <a href="#contact" class="btn btn-primary" style="margin-top:8px;display:block;text-align:center;">Book Now</a>
  </div>
</header>

<!-- SECTION: Hero -->
<section class="hero" id="home">
  <div class="hero-bg"></div>
  <div class="container hero-content">
    <div class="hero-badge">&#10003; &nbsp;Accepting New Patients</div>
    <h1 class="hero-headline">Feel Better.<br>Move Better.<br>Live Better.</h1>
    <p class="hero-sub">Expert, compassionate chiropractic care for the whole family. Same-week appointments available in Springfield, IL.</p>
    <div class="hero-actions">
      <a href="#contact" class="btn btn-white">Book a Free Consultation</a>
      <a href="#services" class="btn btn-outline-white">See Our Services</a>
    </div>
  </div>
</section>

<!-- SECTION: Trust Bar -->
<div class="trust-bar">
  <div class="container trust-inner">
    <div class="trust-item"><span class="trust-icon">&#9733;</span> 5-Star Rated on Google</div>
    <div class="trust-item"><span class="trust-icon">&#128197;</span> Same-Week Appointments</div>
    <div class="trust-item"><span class="trust-icon">&#127973;</span> 15+ Years of Experience</div>
    <div class="trust-item"><span class="trust-icon">&#128106;</span> All Ages Welcome</div>
  </div>
</div>

<!-- SECTION: Services -->
<section class="section" id="services">
  <div class="container">
    <div class="section-header center">
      <div class="section-label">What We Treat</div>
      <h2 class="section-title">Comprehensive Chiropractic Care</h2>
      <p class="section-sub">We treat the root cause of your pain — not just the symptoms. Every care plan is tailored specifically to you.</p>
    </div>
    <div class="services-grid">
      <div class="service-card">
        <div class="service-icon">&#10003;</div>
        <h3>Spinal Adjustments</h3>
        <p>Precise, gentle adjustments that restore proper alignment and relieve pain at its source.</p>
      </div>
      <div class="service-card">
        <div class="service-icon">&#9919;</div>
        <h3>Sports Injury Care</h3>
        <p>Get back in the game faster with targeted sports injury treatment and performance recovery.</p>
      </div>
      <div class="service-card">
        <div class="service-icon">&#9876;</div>
        <h3>Back &amp; Neck Pain</h3>
        <p>Find lasting relief from chronic back and neck pain through targeted, evidence-based care.</p>
      </div>
      <div class="service-card">
        <div class="service-icon">&#128161;</div>
        <h3>Headache Relief</h3>
        <p>Many headaches stem from spinal tension and misalignment. We treat the root cause, not just the symptom.</p>
      </div>
      <div class="service-card">
        <div class="service-icon">&#128247;</div>
        <h3>Posture Correction</h3>
        <p>Reverse the cumulative damage of desk work and screen time before it becomes a serious problem.</p>
      </div>
      <div class="service-card">
        <div class="service-icon">&#128149;</div>
        <h3>Pediatric Care</h3>
        <p>Safe, gentle chiropractic care for children of all ages — from newborns through teenagers.</p>
      </div>
    </div>
  </div>
</section>

<!-- SECTION: About / Doctors -->
<section class="section section-alt" id="about">
  <div class="container">
    <div class="section-header center">
      <div class="section-label">Meet the Team</div>
      <h2 class="section-title">Your Doctor</h2>
    </div>
    <div class="doctor-card">
      <div class="doctor-photo">
        <div class="doctor-photo-placeholder">
          <svg width="72" height="72" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span>Doctor Photo</span>
        </div>
      </div>
      <div class="doctor-info">
        <h3 class="doctor-name">Dr. Alex Rivera</h3>
        <div class="doctor-title">Doctor of Chiropractic</div>
        <p class="doctor-bio">Dr. Rivera has spent over 15 years helping patients find natural, lasting relief from pain. With advanced training in sports medicine and a whole-body approach to wellness, Dr. Rivera takes time to truly understand each patient before treatment begins.</p>
        <p class="doctor-bio">We believe you deserve to know exactly what is happening with your body and why — so you can make informed decisions about your own care.</p>
        <div class="doctor-stats">
          <div class="doctor-stat">
            <span class="doctor-stat-num">15+</span>
            <span class="doctor-stat-label">Years Experience</span>
          </div>
          <div class="doctor-stat">
            <span class="doctor-stat-label">Education</span>
            <span class="doctor-stat-school">Palmer College of Chiropractic, Magna Cum Laude</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SECTION: Testimonials -->
<section class="section" id="testimonials">
  <div class="container">
    <div class="section-header center">
      <div class="section-label">Patient Stories</div>
      <h2 class="section-title">Real Results, Real People</h2>
    </div>
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="testimonial-text">"I came in barely able to walk. After four visits I was back to my morning runs. The results were nothing short of incredible."</p>
        <div class="testimonial-author">— Sarah M.</div>
      </div>
      <div class="testimonial-card">
        <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="testimonial-text">"Dr. Rivera was the first doctor in 10 years to actually explain what was going on with my back. That alone was worth the visit."</p>
        <div class="testimonial-author">— Tom B.</div>
      </div>
      <div class="testimonial-card">
        <div class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
        <p class="testimonial-text">"My migraines have dropped by 80% since starting care here. I only wish I had found this place sooner."</p>
        <div class="testimonial-author">— Linda K.</div>
      </div>
    </div>
  </div>
</section>

<!-- SECTION: Hours & Contact -->
<section class="section section-dark" id="contact">
  <div class="container">
    <div class="contact-grid">
      <div>
        <div class="section-label light">Office Hours</div>
        <h2 class="section-title light">We're Here When You Need Us</h2>
        <table class="hours-table">
          <tbody>
            <tr><td>Monday</td><td>9:00 AM &ndash; 6:00 PM</td></tr>
            <tr><td>Tuesday</td><td>9:00 AM &ndash; 6:00 PM</td></tr>
            <tr><td>Wednesday</td><td>9:00 AM &ndash; 6:00 PM</td></tr>
            <tr><td>Thursday</td><td>9:00 AM &ndash; 6:00 PM</td></tr>
            <tr><td>Friday</td><td>9:00 AM &ndash; 5:00 PM</td></tr>
            <tr><td>Saturday</td><td>9:00 AM &ndash; 12:00 PM</td></tr>
            <tr class="closed"><td>Sunday</td><td>Closed</td></tr>
          </tbody>
        </table>
      </div>
      <div>
        <div class="section-label light">Get In Touch</div>
        <h2 class="section-title light">Book Your Free Consultation</h2>
        <div class="contact-items">
          <div class="contact-item">
            <div class="contact-icon">&#128222;</div>
            <div>
              <div class="contact-item-label">Phone</div>
              <a href="tel:5558675309" class="contact-item-value">(555) 867-5309</a>
            </div>
          </div>
          <div class="contact-item">
            <div class="contact-icon">&#9993;</div>
            <div>
              <div class="contact-item-label">Email</div>
              <a href="mailto:hello@sunrisechiro.com" class="contact-item-value">hello@sunrisechiro.com</a>
            </div>
          </div>
          <div class="contact-item">
            <div class="contact-icon">&#128205;</div>
            <div>
              <div class="contact-item-label">Address</div>
              <span class="contact-item-value">1234 Wellness Blvd, Suite 100<br>Springfield, IL 62701</span>
            </div>
          </div>
        </div>
        <a href="tel:5558675309" class="btn btn-white" style="margin-top:32px;display:inline-block;">Call to Schedule &rarr;</a>
      </div>
    </div>
  </div>
</section>

<!-- SECTION: Footer -->
<footer class="footer">
  <div class="container footer-inner">
    <div>
      <div class="footer-logo">Sunrise Chiropractic</div>
      <div class="footer-address">1234 Wellness Blvd, Suite 100<br>Springfield, IL 62701<br>(555) 867-5309</div>
    </div>
    <div>
      <div class="footer-links-title">Quick Links</div>
      <a href="#services" class="footer-link">Services</a>
      <a href="#about" class="footer-link">About</a>
      <a href="#testimonials" class="footer-link">Testimonials</a>
      <a href="#contact" class="footer-link">Hours &amp; Contact</a>
    </div>
  </div>
  <div class="footer-bottom">
    <div class="container footer-bottom-inner">
      <span>&copy; <span id="year"></span> Sunrise Chiropractic. All rights reserved.</span>
    </div>
  </div>
</footer>

<script src="script.js"></script>
</body>
</html>`

export const DEFAULT_CSS = `/* ============================================
   Sunrise Chiropractic — Main Stylesheet
   ============================================ */

/* ── Variables ── */
:root {
  --primary: #1a4f72;
  --accent: #2980b9;
  --bg-alt: #f0f7ff;
  --dark: #0f2940;
  --text: #1a202c;
  --text-muted: #64748b;
  --border: #e2e8f0;
  --white: #ffffff;
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', system-ui, -apple-system, sans-serif;
  --radius: 12px;
  --shadow: 0 4px 24px rgba(26,79,114,0.10);
  --max-width: 1200px;
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; font-size: 16px; }
body { font-family: var(--font-body); color: var(--text); background: var(--white); line-height: 1.6; overflow-x: hidden; }
img { max-width: 100%; display: block; }
a { text-decoration: none; color: inherit; }

/* ── Layout ── */
.container { max-width: var(--max-width); margin: 0 auto; padding: 0 24px; }
.section { padding: 96px 0; }
.section-alt { padding: 96px 0; background: var(--bg-alt); }
.section-dark { padding: 96px 0; background: var(--dark); color: var(--white); }

/* ── Typography ── */
.section-label { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.section-label.light { color: rgba(255,255,255,0.6); }
.section-title { font-family: var(--font-heading); font-size: clamp(28px,4vw,42px); font-weight: 700; color: var(--primary); line-height: 1.15; margin-bottom: 16px; }
.section-title.light { color: var(--white); }
.section-sub { font-size: 18px; color: var(--text-muted); max-width: 580px; line-height: 1.7; }
.section-header { margin-bottom: 56px; }
.section-header.center { text-align: center; }
.section-header.center .section-sub { margin: 0 auto; }

/* ── Buttons ── */
.btn { display: inline-block; font-family: var(--font-body); font-size: 16px; font-weight: 700; padding: 15px 32px; border-radius: 6px; border: 2px solid transparent; cursor: pointer; transition: all 0.2s; letter-spacing: 0.2px; }
.btn-primary { background: var(--accent); color: var(--white); border-color: var(--accent); }
.btn-primary:hover { background: var(--primary); border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(26,79,114,0.3); }
.btn-white { background: var(--white); color: var(--primary); }
.btn-white:hover { background: var(--bg-alt); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
.btn-outline-white { background: transparent; color: var(--white); border-color: rgba(255,255,255,0.7); }
.btn-outline-white:hover { background: rgba(255,255,255,0.1); border-color: var(--white); }

/* ── Navigation ── */
.nav { position: sticky; top: 0; z-index: 100; background: var(--white); border-bottom: 1px solid var(--border); box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
.nav-inner { display: flex; align-items: center; justify-content: space-between; height: 72px; }
.nav-logo { display: flex; flex-direction: column; }
.nav-logo-name { font-weight: 800; font-size: 20px; color: var(--primary); letter-spacing: -0.5px; }
.nav-logo-tag { font-size: 11px; color: var(--text-muted); letter-spacing: 1px; margin-top: 1px; }
.nav-links { display: flex; align-items: center; gap: 4px; }
.nav-links a { color: var(--text-muted); font-weight: 500; font-size: 15px; padding: 6px 14px; border-radius: 6px; transition: all 0.15s; }
.nav-links a:hover { color: var(--primary); background: var(--bg-alt); }
.nav-right { display: flex; align-items: center; gap: 16px; }
.nav-phone { color: var(--primary); font-weight: 700; font-size: 15px; }
.nav-cta { padding: 10px 22px; font-size: 14px; }
.nav-hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 6px; }
.nav-hamburger span { display: block; width: 24px; height: 2px; background: var(--primary); border-radius: 2px; transition: all 0.2s; }
.nav-mobile { display: none; padding: 16px 24px 20px; border-top: 1px solid var(--border); }
.nav-mobile.open { display: block; }
.nav-mobile-link { display: block; padding: 10px 0; color: var(--text-muted); font-weight: 500; border-bottom: 1px solid var(--border); }
.nav-mobile-link:last-of-type { border-bottom: none; }
.nav-mobile-phone { color: var(--primary); font-weight: 700; }

/* ── Hero ── */
.hero { position: relative; padding: 120px 0 100px; color: var(--white); overflow: hidden; }
.hero-bg { position: absolute; inset: 0; background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); }
.hero-bg::before { content: ''; position: absolute; top: -80px; right: -80px; width: 400px; height: 400px; border-radius: 50%; background: rgba(255,255,255,0.06); }
.hero-bg::after { content: ''; position: absolute; bottom: -60px; left: 8%; width: 300px; height: 300px; border-radius: 50%; background: rgba(255,255,255,0.04); }
.hero-content { position: relative; z-index: 1; max-width: 700px; }
.hero-badge { display: inline-block; background: rgba(255,255,255,0.15); border-radius: 20px; padding: 6px 18px; font-size: 13px; font-weight: 600; margin-bottom: 28px; letter-spacing: 0.5px; }
.hero-headline { font-family: var(--font-heading); font-size: clamp(40px,6vw,68px); font-weight: 800; line-height: 1.08; margin-bottom: 24px; letter-spacing: -1px; }
.hero-sub { font-size: 20px; line-height: 1.7; opacity: 0.9; margin-bottom: 44px; max-width: 560px; }
.hero-actions { display: flex; gap: 16px; flex-wrap: wrap; }

/* ── Trust Bar ── */
.trust-bar { background: var(--white); border-bottom: 1px solid var(--border); }
.trust-inner { display: flex; align-items: center; justify-content: center; gap: 48px; padding: 28px 24px; flex-wrap: wrap; }
.trust-item { display: flex; align-items: center; gap: 10px; color: var(--text-muted); font-size: 15px; font-weight: 500; }
.trust-icon { font-size: 20px; }

/* ── Services ── */
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
.service-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; transition: all 0.25s; }
.service-card:hover { border-color: var(--accent); box-shadow: var(--shadow); transform: translateY(-3px); }
.service-icon { font-size: 28px; margin-bottom: 18px; display: block; }
.service-card h3 { font-family: var(--font-heading); font-size: 20px; color: var(--primary); margin-bottom: 10px; }
.service-card p { color: var(--text-muted); font-size: 15px; line-height: 1.65; }

/* ── About / Doctors ── */
.doctor-card { display: grid; grid-template-columns: 340px 1fr; gap: 56px; align-items: start; }
.doctor-photo { border-radius: 16px; overflow: hidden; background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--accent) 25%, transparent)); border: 2px solid color-mix(in srgb, var(--accent) 25%, transparent); aspect-ratio: 4/5; display: flex; align-items: center; justify-content: center; }
.doctor-photo-placeholder { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--accent); opacity: 0.5; }
.doctor-photo-placeholder span { font-size: 14px; font-weight: 600; }
.doctor-name { font-family: var(--font-heading); font-size: 32px; color: var(--primary); margin-bottom: 6px; }
.doctor-title { color: var(--accent); font-weight: 600; font-size: 17px; margin-bottom: 20px; }
.doctor-bio { color: var(--text-muted); font-size: 16px; line-height: 1.8; margin-bottom: 14px; }
.doctor-stats { display: flex; gap: 36px; margin-top: 28px; flex-wrap: wrap; }
.doctor-stat { display: flex; flex-direction: column; gap: 4px; }
.doctor-stat-num { font-family: var(--font-heading); font-size: 36px; font-weight: 700; color: var(--primary); line-height: 1; }
.doctor-stat-label { font-size: 13px; color: var(--text-muted); font-weight: 500; }
.doctor-stat-school { font-size: 15px; font-weight: 600; color: var(--primary); }

/* ── Testimonials ── */
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
.testimonial-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; box-shadow: var(--shadow); }
.stars { color: #f59e0b; font-size: 20px; margin-bottom: 16px; letter-spacing: 2px; }
.testimonial-text { font-size: 16px; line-height: 1.75; color: #374151; font-style: italic; margin-bottom: 20px; }
.testimonial-author { font-weight: 700; color: var(--primary); font-size: 15px; }

/* ── Hours & Contact ── */
.contact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 64px; }
.hours-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
.hours-table td { padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-size: 16px; }
.hours-table td:last-child { text-align: right; font-weight: 600; }
.hours-table tr.closed td { color: rgba(255,255,255,0.4); }
.hours-table tr:last-child td { border-bottom: none; }
.contact-items { display: flex; flex-direction: column; gap: 24px; margin-top: 8px; }
.contact-item { display: flex; align-items: flex-start; gap: 16px; }
.contact-icon { width: 46px; height: 46px; border-radius: 10px; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.contact-item-label { font-size: 11px; color: rgba(255,255,255,0.5); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 3px; }
.contact-item-value { color: var(--white); font-size: 16px; font-weight: 600; }
a.contact-item-value:hover { text-decoration: underline; }

/* ── Footer ── */
.footer { background: #07111c; color: rgba(255,255,255,0.55); padding: 56px 0 0; }
.footer-inner { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 40px; padding-bottom: 48px; }
.footer-logo { font-weight: 800; font-size: 20px; color: var(--white); margin-bottom: 12px; }
.footer-address { font-size: 14px; line-height: 1.8; }
.footer-links-title { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--white); margin-bottom: 16px; }
.footer-link { display: block; font-size: 14px; margin-bottom: 10px; transition: color 0.15s; }
.footer-link:hover { color: var(--white); }
.footer-bottom { border-top: 1px solid rgba(255,255,255,0.08); padding: 20px 0; }
.footer-bottom-inner { display: flex; justify-content: space-between; font-size: 13px; flex-wrap: wrap; gap: 8px; }

/* ── Responsive ── */
@media (max-width: 900px) {
  .doctor-card { grid-template-columns: 1fr; }
  .doctor-photo { max-height: 320px; aspect-ratio: auto; padding: 48px; }
}

@media (max-width: 768px) {
  .nav-links, .nav-right { display: none; }
  .nav-hamburger { display: flex; }
  .section, .section-alt, .section-dark { padding: 72px 0; }
  .hero { padding: 80px 0 72px; }
  .hero-headline { font-size: clamp(36px, 8vw, 52px); }
  .trust-inner { gap: 24px; }
  .contact-grid { gap: 48px; }
}`

export const DEFAULT_JS = `// Sunrise Chiropractic — Main Script

// Set current year in footer
document.getElementById('year').textContent = new Date().getFullYear();

// Mobile navigation toggle
const hamburger = document.getElementById('nav-hamburger');
const mobileNav = document.getElementById('nav-mobile');

if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
  });

  // Close mobile nav when a link is clicked
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
    });
  });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const navHeight = document.getElementById('nav')?.offsetHeight || 72;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// Add nav shadow on scroll
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10
      ? '0 4px 20px rgba(0,0,0,0.10)'
      : '0 2px 12px rgba(0,0,0,0.06)';
  });
}`
