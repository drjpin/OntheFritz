<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Blog | Hackett Chiropractic</title>
  <meta name="description" content="Expert chiropractic insights, health tips, and patient education from the team at Hackett Chiropractic in Stevensville, MI." />

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <style>
    /* ── Blog-specific styles ── */
    .blog-hero { background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); color: var(--white); padding: 72px 0 56px; }
    .blog-hero-label { font-size: 12px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 12px; }
    .blog-hero-title { font-family: var(--font-heading); font-size: clamp(32px, 5vw, 52px); font-weight: 800; line-height: 1.1; margin-bottom: 16px; }
    .blog-hero-sub { font-size: 18px; opacity: 0.85; max-width: 540px; line-height: 1.7; }
    .blog-grid { display: grid; grid-template-columns: 1fr 320px; gap: 56px; align-items: start; padding: 72px 0; }
    .post-list { display: flex; flex-direction: column; gap: 40px; }
    .post-card { background: var(--white); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; transition: all 0.25s; }
    .post-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
    .post-card-body { padding: 32px; }
    .post-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .post-category { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); background: var(--bg-alt); padding: 4px 10px; border-radius: 20px; }
    .post-date { font-size: 13px; color: var(--text-muted); }
    .post-title { font-family: var(--font-heading); font-size: 24px; color: var(--primary); margin-bottom: 12px; line-height: 1.25; }
    .post-title a { color: inherit; transition: color 0.15s; }
    .post-title a:hover { color: var(--accent); }
    .post-full-divider { width: 60px; height: 3px; background: var(--accent); border-radius: 2px; margin: 24px 0; }
    .post-content { font-size: 17px; line-height: 1.85; color: #374151; }
    .post-content h2 { font-family: var(--font-heading); font-size: 26px; color: var(--primary); margin: 40px 0 14px; }
    .post-content h3 { font-family: var(--font-heading); font-size: 20px; color: var(--primary); margin: 28px 0 10px; }
    .post-content p { margin-bottom: 20px; }
    .post-content ul, .post-content ol { margin: 0 0 20px 24px; }
    .post-content li { margin-bottom: 8px; }
    .post-content blockquote { border-left: 4px solid var(--accent); padding: 16px 24px; background: var(--bg-alt); border-radius: 0 var(--radius) var(--radius) 0; margin: 28px 0; font-style: italic; color: var(--primary); font-size: 18px; }
    .post-content strong { color: var(--primary); font-weight: 700; }
    .sidebar { display: flex; flex-direction: column; gap: 28px; }
    .sidebar-widget { background: var(--bg-alt); border-radius: var(--radius); padding: 24px; }
    .sidebar-widget-title { font-family: var(--font-heading); font-size: 18px; color: var(--primary); margin-bottom: 16px; }
    .sidebar-cta { background: linear-gradient(135deg, var(--primary), var(--accent)); color: var(--white); }
    .sidebar-cta .sidebar-widget-title { color: var(--white); }
    .sidebar-cta p { font-size: 14px; opacity: 0.9; line-height: 1.65; margin-bottom: 18px; }
    .recent-post { display: flex; flex-direction: column; gap: 4px; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .recent-post:last-child { border-bottom: none; padding-bottom: 0; }
    .recent-post a { font-size: 14px; font-weight: 600; color: var(--primary); line-height: 1.4; transition: color 0.15s; }
    .recent-post a:hover { color: var(--accent); }
    .recent-post span { font-size: 12px; color: var(--text-muted); }
    @media (max-width: 900px) {
      .blog-grid { grid-template-columns: 1fr; }
      .sidebar { order: -1; }
    }
  </style>
</head>
<body>

<?php include 'nav.php'; ?>

<!-- Blog Hero -->
<div class="blog-hero">
  <div class="container">
    <div class="blog-hero-label">Health &amp; Wellness</div>
    <h1 class="blog-hero-title">The Hackett Blog</h1>
    <p class="blog-hero-sub">Expert insights on chiropractic care, pain relief, and living your healthiest life.</p>
  </div>
</div>

<!-- Blog Content -->
<div class="container">
  <div class="blog-grid">

    <!-- Post list -->
    <main class="post-list">

      <!-- BLOG POST: What Happens During a Chiropractic Adjustment -->
      <article class="post-card" id="chiropractic-adjustment">
        <div class="post-card-body">
          <div class="post-meta">
            <span class="post-category">Patient Education</span>
            <span class="post-date">April 2025</span>
          </div>
          <h2 class="post-title"><a href="#chiropractic-adjustment">What Exactly Happens During a Chiropractic Adjustment?</a></h2>
          <div class="post-full-divider"></div>

          <div class="post-content">
            <p>If you've never had a chiropractic adjustment before, it's completely natural to wonder — even worry — about what's actually happening to your body. The quick answer: it's a safe, precise, and often deeply relieving procedure. But let's go deeper than that.</p>

            <h2>The Setup: What We're Working With</h2>
            <p>Your spine is made up of 24 moveable vertebrae stacked on top of each other. Between each pair of vertebrae sits a small joint called a <strong>facet joint</strong>, cushioned by cartilage and surrounded by a fluid-filled capsule. These joints allow you to bend, twist, and move in every direction.</p>
            <p>When stress, injury, poor posture, or repetitive motion causes a vertebra to shift out of its optimal position — what chiropractors call a <strong>subluxation</strong> — that joint can become restricted. Movement decreases. Surrounding muscles tense up to compensate. Nerves that pass through that area can become irritated. The result: pain, stiffness, and a body that isn't functioning at its best.</p>

            <h2>The Adjustment: What's Actually Happening</h2>
            <p>A chiropractic adjustment — technically called <strong>spinal manipulation</strong> — is a controlled, targeted force applied to a specific joint to restore its normal range of motion.</p>
            <p>Here's the step-by-step of what happens in those few seconds:</p>
            <ol>
              <li><strong>Positioning:</strong> You'll be placed in a specific position — usually lying face-down, face-up, or on your side — that allows us to isolate the exact joint we're targeting.</li>
              <li><strong>Pre-load:</strong> We apply gentle pressure to take the joint to the end of its comfortable range of motion. Think of it like pulling back a bowstring — building up precise tension.</li>
              <li><strong>The thrust:</strong> A quick, shallow impulse is applied to the joint, taking it just slightly beyond its passive range of motion. This is where the magic happens.</li>
              <li><strong>Release:</strong> The joint capsule rapidly stretches, the restricted motion is restored, and the surrounding muscles receive a neurological signal to relax.</li>
            </ol>

            <blockquote>"Most patients feel an immediate sense of relief and increased mobility — often within minutes of their first adjustment."</blockquote>

            <h2>That Popping Sound — What Is It?</h2>
            <p>This is the question almost everyone asks. The sound — called <strong>cavitation</strong> — is completely harmless and has a simple explanation.</p>
            <p>Inside every joint capsule is a small amount of synovial fluid, which lubricates and nourishes the joint. That fluid contains dissolved gases (primarily carbon dioxide and nitrogen). When the joint is stretched rapidly during an adjustment, the pressure inside the capsule drops suddenly — and those dissolved gases form a tiny bubble, which collapses almost instantly.</p>
            <p><strong>That pop? It's just a gas bubble.</strong> Not bones cracking. Not anything breaking. Just physics.</p>
            <p>Interestingly, not every adjustment produces a sound — and that doesn't mean it didn't work. The therapeutic effect comes from restoring joint motion, not from the noise itself.</p>

            <h2>What You'll Feel</h2>
            <p>Most patients describe the moment of adjustment as feeling like a sudden release — a bit like cracking your knuckles, but deeper and more satisfying. It's rarely painful. In fact, the most common immediate reaction is:</p>
            <ul>
              <li>A feeling of relief or release in the treated area</li>
              <li>Noticeably increased range of motion</li>
              <li>Warmth spreading through the surrounding muscles</li>
              <li>A general sense of relaxation</li>
            </ul>
            <p>Some patients — particularly those having their first adjustment or those with significant tension — may feel mild soreness for 12–24 hours afterward, similar to the feeling after a good workout. This is your body adapting to its new alignment and is completely normal.</p>

            <h2>The Neurological Effect</h2>
            <p>Here's what most people don't realize: a chiropractic adjustment isn't just a mechanical fix. It's also a <strong>neurological event</strong>.</p>
            <p>When the joint is manipulated, it activates specialized nerve receptors called <strong>mechanoreceptors</strong> in and around the joint. These receptors send a flood of new sensory input to your brain and spinal cord — essentially hitting the reset button on the pain signals that were firing from that area.</p>
            <p>This is why many patients experience relief not just in the area that was adjusted, but throughout their body. It's also why chiropractic care can help with symptoms that seem unrelated to the spine — headaches, fatigue, and even digestive issues can sometimes improve because of the downstream neurological effects of restoring proper spinal function.</p>

            <h2>How Many Adjustments Will I Need?</h2>
            <p>This varies widely from patient to patient and depends on how long the problem has been present, your age, your overall health, and your goals. As a general guide:</p>
            <ul>
              <li><strong>Acute issues</strong> (recent injury, sudden onset pain): Often 4–8 visits over 2–4 weeks</li>
              <li><strong>Chronic conditions</strong> (long-standing pain, postural problems): Usually 12–24 visits over 6–12 weeks</li>
              <li><strong>Wellness care</strong> (maintenance, prevention): Monthly or as-needed visits</li>
            </ul>
            <p>We'll always give you a clear, honest care plan at your first visit — no surprises, no pressure.</p>

            <h2>Is It Safe?</h2>
            <p>Chiropractic adjustment is one of the safest treatments available for musculoskeletal pain. Serious complications are extremely rare — significantly rarer than the risks associated with long-term pain medication use, which is often the alternative.</p>
            <p>At Hackett Chiropractic, every patient receives a thorough health history and physical examination before any treatment. If we ever determine that chiropractic care isn't the right fit for your situation, we'll tell you — and refer you to someone who can help.</p>

            <h2>Ready to Experience It for Yourself?</h2>
            <p>The best way to understand what a chiropractic adjustment feels like is to experience one. We offer a <strong>free initial consultation</strong> — no commitment, no pressure. Just a conversation about what's going on with your body and whether chiropractic care might help.</p>
            <p><a href="index.php#contact" class="btn btn-primary" style="display:inline-block;margin-top:8px;">Book Your Free Consultation &rarr;</a></p>
          </div>

        </div>
      </article>

    </main>

    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-widget sidebar-cta">
        <div class="sidebar-widget-title">Ready to Feel Better?</div>
        <p>Free consultations available. Same-week appointments. No referral needed.</p>
        <a href="index.php#contact" class="btn btn-white" style="display:block;text-align:center;">Book Now &rarr;</a>
      </div>
      <div class="sidebar-widget">
        <div class="sidebar-widget-title">Recent Posts</div>
        <div class="recent-post">
          <a href="#chiropractic-adjustment">What Exactly Happens During a Chiropractic Adjustment?</a>
          <span>April 2025</span>
        </div>
      </div>
      <div class="sidebar-widget">
        <div class="sidebar-widget-title">Topics</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:4px;">
          <span style="background:var(--white);border:1px solid var(--border);padding:4px 12px;border-radius:20px;font-size:13px;color:var(--text-muted);">Patient Education</span>
          <span style="background:var(--white);border:1px solid var(--border);padding:4px 12px;border-radius:20px;font-size:13px;color:var(--text-muted);">Back Pain</span>
          <span style="background:var(--white);border:1px solid var(--border);padding:4px 12px;border-radius:20px;font-size:13px;color:var(--text-muted);">Wellness</span>
          <span style="background:var(--white);border:1px solid var(--border);padding:4px 12px;border-radius:20px;font-size:13px;color:var(--text-muted);">Sports Injury</span>
        </div>
      </div>
    </aside>

  </div>
</div>

<?php include 'footer.php'; ?>

<script src="script.js"></script>
</body>
</html>
