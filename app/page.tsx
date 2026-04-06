'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_CONTENT, type SiteContent } from '@/lib/types'

export default function ChiroSite() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/content?key=demo')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.content) setContent(data.content) })
      .catch(() => {})
  }, [])

  const { practice, hero, services, doctors, testimonials, hours, blog, style } = content
  const p = style.primaryColor
  const a = style.accentColor

  const navLinks = [
    { label: 'Services', href: '#services' },
    { label: 'About', href: '#about' },
    { label: 'Testimonials', href: '#testimonials' },
    { label: 'Hours', href: '#contact' },
    ...(blog.length > 0 ? [{ label: 'Blog', href: '#blog' }] : []),
  ]

  return (
    <>
      <style>{`
        :root {
          --primary: ${p};
          --accent: ${a};
          --bg: ${style.bgColor};
        }
      `}</style>

      {/* ── NAV ── */}
      <nav className="site-nav">
        <div className="site-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '70px' }}>
          <a href="#" style={{ textDecoration: 'none' }}>
            <div style={{ fontWeight: 800, fontSize: '20px', color: p, letterSpacing: '-0.5px' }}>
              {practice.name}
            </div>
            <div style={{ fontSize: '11px', color: '#718096', letterSpacing: '1px', marginTop: '1px' }}>
              {practice.tagline}
            </div>
          </a>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} className="hidden md:flex">
            {navLinks.map(l => (
              <a key={l.href} href={l.href} style={{ color: '#475569', fontWeight: 500, fontSize: '15px', textDecoration: 'none', padding: '6px 12px', borderRadius: '6px', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = a)}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >
                {l.label}
              </a>
            ))}
            <a href={`tel:${practice.phone}`} style={{ color: p, fontWeight: 700, fontSize: '15px', textDecoration: 'none', marginLeft: '8px' }}>
              {practice.phone}
            </a>
            <a href="#contact" className="btn-primary" style={{ marginLeft: '8px', padding: '10px 22px', fontSize: '14px' }}>
              Book Now
            </a>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(o => !o)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }} className="mobile-menu-btn">
            <span style={{ display: 'block', width: '24px', height: '2px', background: p, marginBottom: '5px', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none' }} />
            <span style={{ display: 'block', width: '24px', height: '2px', background: p, marginBottom: '5px', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '24px', height: '2px', background: p, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none' }} />
          </button>
        </div>
        {menuOpen && (
          <div style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '16px 24px 20px' }}>
            {navLinks.map(l => (
              <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{ display: 'block', padding: '10px 0', color: '#475569', fontWeight: 500, textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>
                {l.label}
              </a>
            ))}
            <a href={`tel:${practice.phone}`} style={{ display: 'block', padding: '10px 0', color: p, fontWeight: 700, textDecoration: 'none', borderBottom: '1px solid #f1f5f9' }}>{practice.phone}</a>
            <a href="#contact" className="btn-primary" onClick={() => setMenuOpen(false)} style={{ display: 'block', textAlign: 'center', marginTop: '12px' }}>Book Now</a>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ background: `linear-gradient(135deg, ${p} 0%, ${a} 100%)`, color: 'white', padding: '120px 0 100px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        <div className="site-container" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: '680px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, marginBottom: '24px', letterSpacing: '1px' }}>
              ✓ &nbsp;Accepting New Patients
            </div>
            <h1 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1px' }}>
              {hero.headline}
            </h1>
            <p style={{ fontSize: '20px', lineHeight: 1.7, opacity: 0.9, marginBottom: '40px', maxWidth: '560px' }}>
              {hero.subtext}
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <a href="#contact" style={{ background: 'white', color: p, fontWeight: 700, fontSize: '16px', padding: '16px 32px', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s', display: 'inline-block', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)' }}
              >
                {hero.cta}
              </a>
              <a href="#services" className="btn-outline">See Our Services</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0' }}>
        <div className="site-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '48px', padding: '28px 24px', flexWrap: 'wrap' }}>
            {[
              { icon: '⭐', text: '5-Star Rated on Google' },
              { icon: '📅', text: 'Same-Week Appointments' },
              { icon: '🏥', text: `${doctors[0]?.yearsExperience ?? 0}+ Years of Experience` },
              { icon: '👨‍👩‍👧', text: 'All Ages Welcome' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#475569', fontSize: '15px', fontWeight: 500 }}>
                <span style={{ fontSize: '20px' }}>{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SERVICES ── */}
      <section id="services" className="site-section">
        <div className="site-container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label">What We Treat</div>
            <h2 className="section-heading" style={{ marginBottom: '16px' }}>Comprehensive Chiropractic Care</h2>
            <p className="section-sub" style={{ margin: '0 auto' }}>
              We treat the root cause of your pain — not just the symptoms. Every plan is tailored to you.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {services.map((svc, i) => (
              <div key={i} className="service-card">
                <div className="service-icon">
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '18px', color: p, marginBottom: '10px' }}>{svc.title}</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>{svc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="site-section-alt">
        <div className="site-container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label">Meet the Team</div>
            <h2 className="section-heading">{doctors.length === 1 ? 'Meet Your Doctor' : 'Meet Our Doctors'}</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
            {doctors.map((doc, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
                {/* Photo placeholder */}
                <div style={{ borderRadius: '16px', background: `linear-gradient(135deg, ${p}22 0%, ${a}33 100%)`, border: `2px solid ${a}33`, aspectRatio: '4/5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', maxHeight: '400px' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: `${a}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="52" height="52" fill="none" stroke={a} strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div style={{ color: a, fontWeight: 600, fontSize: '13px', opacity: 0.7 }}>Doctor Photo Here</div>
                </div>
                {/* Text */}
                <div>
                  <h3 style={{ fontSize: '28px', fontWeight: 800, color: p, marginBottom: '6px' }}>{doc.name}</h3>
                  <div style={{ color: a, fontWeight: 600, fontSize: '16px', marginBottom: '20px' }}>{doc.title}</div>
                  {doc.bio.split('\n\n').map((para, j) => (
                    <p key={j} style={{ color: '#475569', fontSize: '16px', lineHeight: 1.8, marginBottom: '14px' }}>{para}</p>
                  ))}
                  <div style={{ display: 'flex', gap: '32px', marginTop: '24px', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '32px', fontWeight: 800, color: p }}>{doc.yearsExperience}+</div>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>Years Experience</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 500, marginBottom: '4px' }}>Education</div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: p }}>{doc.education}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="site-section">
        <div className="site-container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label">Patient Stories</div>
            <h2 className="section-heading">Real Results, Real People</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div style={{ marginBottom: '16px' }}>
                  {'★'.repeat(t.rating).split('').map((s, j) => (
                    <span key={j} className="star">{s}</span>
                  ))}
                </div>
                <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#374151', fontStyle: 'italic', marginBottom: '20px' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div style={{ fontWeight: 700, color: p, fontSize: '15px' }}>— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOURS + CONTACT ── */}
      <section id="contact" className="site-section-dark">
        <div className="site-container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px' }}>
            {/* Hours */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Office Hours</div>
              <h2 className="section-heading-light" style={{ marginBottom: '32px' }}>We&apos;re Here When You Need Us</h2>
              <table className="hours-table">
                <tbody>
                  {Object.entries(hours).map(([day, time]) => (
                    <tr key={day}>
                      <td style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{day}</td>
                      <td style={{ color: time === 'Closed' ? 'rgba(255,255,255,0.4)' : 'white' }}>{time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Contact */}
            <div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '12px' }}>Get In Touch</div>
              <h2 className="section-heading-light" style={{ marginBottom: '32px' }}>Book Your Free Consultation</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '36px' }}>
                {[
                  { icon: '📞', label: 'Phone', value: practice.phone, href: `tel:${practice.phone}` },
                  { icon: '✉️', label: 'Email', value: practice.email, href: `mailto:${practice.email}` },
                  { icon: '📍', label: 'Address', value: `${practice.address}, ${practice.city}`, href: '#' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>{item.label}</div>
                      <a href={item.href} style={{ color: 'white', fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}>{item.value}</a>
                    </div>
                  </div>
                ))}
              </div>
              <a href={`tel:${practice.phone}`} style={{ display: 'inline-block', background: 'white', color: p, fontWeight: 700, fontSize: '16px', padding: '16px 32px', borderRadius: '6px', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                Call to Schedule →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG (conditional) ── */}
      {blog.length > 0 && (
        <section id="blog" className="site-section-alt">
          <div className="site-container">
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <div className="section-label">Health Tips</div>
              <h2 className="section-heading">From Our Blog</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {blog.map((post, i) => (
                <div key={i} className="blog-card">
                  <div style={{ background: `linear-gradient(135deg, ${p}22, ${a}33)`, height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="48" height="48" fill="none" stroke={a} strokeWidth="1.5" viewBox="0 0 24 24" opacity="0.6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div style={{ padding: '24px' }}>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{post.date}</div>
                    <h3 style={{ fontWeight: 700, fontSize: '18px', color: p, marginBottom: '10px', lineHeight: 1.3 }}>{post.title}</h3>
                    <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>{post.excerpt}</p>
                    <div style={{ marginTop: '16px', color: a, fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>Read more →</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0f1923', color: 'rgba(255,255,255,0.6)', padding: '48px 0 32px' }}>
        <div className="site-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '32px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '20px', color: 'white', marginBottom: '8px' }}>{practice.name}</div>
              <div style={{ fontSize: '14px', lineHeight: 1.6 }}>
                {practice.address}<br />{practice.city}<br />{practice.phone}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'white', marginBottom: '12px', fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' }}>Quick Links</div>
              {navLinks.map(l => (
                <a key={l.href} href={l.href} style={{ display: 'block', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '14px', marginBottom: '8px', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ fontSize: '13px' }}>© {new Date().getFullYear()} {practice.name}. All rights reserved.</div>
            <div style={{ fontSize: '12px', opacity: 0.4 }}>Powered by ChiroSite</div>
          </div>
        </div>
      </footer>
    </>
  )
}
