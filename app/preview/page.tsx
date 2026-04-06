'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_CONTENT, type SiteContent } from '@/lib/types'

export default function PreviewPage() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('chiro_admin_token') : null
    if (!token) { setLoading(false); return }

    fetch('/api/content?draft=true', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.content) setContent(data.content) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'system-ui', color: '#64748b' }}>
      Loading preview…
    </div>
  )

  const { practice, hero, services, doctors, testimonials, hours, blog, style } = content
  const p = style.primaryColor
  const a = style.accentColor

  return (
    <>
      <style>{`
        :root { --primary: ${p}; --accent: ${a}; --bg: ${style.bgColor}; }
      `}</style>

      {/* Preview banner */}
      <div className="preview-banner">
        ⚠ PREVIEW MODE — These changes are not yet live. Go back to the admin panel to publish.
      </div>
      <div style={{ paddingTop: '42px' }}>

      {/* Simplified inline render — same structure as main page */}
      <nav className="site-nav">
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '20px', color: p }}>{practice.name}</div>
            <div style={{ fontSize: '11px', color: '#718096', letterSpacing: '1px' }}>{practice.tagline}</div>
          </div>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {['Services','About','Hours'].map(l => (
              <span key={l} style={{ color: '#475569', fontWeight: 500, fontSize: '15px' }}>{l}</span>
            ))}
            <span style={{ color: p, fontWeight: 700, fontSize: '15px' }}>{practice.phone}</span>
            <span className="btn-primary" style={{ padding: '10px 22px', fontSize: '14px' }}>Book Now</span>
          </div>
        </div>
      </nav>

      <section style={{ background: `linear-gradient(135deg, ${p} 0%, ${a} 100%)`, color: 'white', padding: '120px 0 100px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: '680px' }}>
            <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 800, lineHeight: 1.1, marginBottom: '24px' }}>{hero.headline}</h1>
            <p style={{ fontSize: '20px', lineHeight: 1.7, opacity: 0.9, marginBottom: '40px' }}>{hero.subtext}</p>
            <span style={{ background: 'white', color: p, fontWeight: 700, fontSize: '16px', padding: '16px 32px', borderRadius: '6px', display: 'inline-block' }}>{hero.cta}</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label">What We Treat</div>
            <h2 className="section-heading">Comprehensive Chiropractic Care</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '24px' }}>
            {services.map((svc, i) => (
              <div key={i} className="service-card">
                <h3 style={{ fontWeight: 700, fontSize: '18px', color: p, marginBottom: '10px' }}>{svc.title}</h3>
                <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>{svc.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 0', background: style.bgColor }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div className="section-label">Meet the Team</div>
          <h2 className="section-heading" style={{ marginBottom: '48px' }}>{doctors.length === 1 ? 'Meet Your Doctor' : 'Meet Our Doctors'}</h2>
          {doctors.map((doc, i) => (
            <div key={i} style={{ marginBottom: '48px' }}>
              <h3 style={{ fontWeight: 800, fontSize: '24px', color: p, marginBottom: '4px' }}>{doc.name}</h3>
              <div style={{ color: a, fontWeight: 600, fontSize: '15px', marginBottom: '16px' }}>{doc.title}</div>
              {doc.bio.split('\n\n').map((para, j) => (
                <p key={j} style={{ color: '#475569', fontSize: '16px', lineHeight: 1.8, marginBottom: '14px' }}>{para}</p>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '96px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-label">Patient Stories</div>
            <h2 className="section-heading">Real Results, Real People</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '24px' }}>
            {testimonials.map((t, i) => (
              <div key={i} className="testimonial-card">
                <div style={{ marginBottom: '12px' }}>{'★'.repeat(t.rating).split('').map((s,j) => <span key={j} className="star">{s}</span>)}</div>
                <p style={{ fontSize: '16px', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '16px', color: '#374151' }}>&ldquo;{t.text}&rdquo;</p>
                <div style={{ fontWeight: 700, color: p }}>— {t.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '96px 0', background: p, color: 'white' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '64px' }}>
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '32px' }}>Office Hours</h2>
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
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '32px' }}>Contact Us</h2>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>{practice.phone}</p>
              <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>{practice.email}</p>
              <p style={{ fontSize: '16px', opacity: 0.9 }}>{practice.address}, {practice.city}</p>
            </div>
          </div>
        </div>
      </section>

      {blog.length > 0 && (
        <section style={{ padding: '96px 0', background: style.bgColor }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <div className="section-label">Health Tips</div>
              <h2 className="section-heading">From Our Blog</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '24px' }}>
              {blog.map((post, i) => (
                <div key={i} className="blog-card" style={{ padding: '24px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{post.date}</div>
                  <h3 style={{ fontWeight: 700, fontSize: '18px', color: p, marginBottom: '10px' }}>{post.title}</h3>
                  <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.6 }}>{post.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer style={{ background: '#0f1923', color: 'rgba(255,255,255,0.6)', padding: '32px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: '18px', color: 'white', marginBottom: '8px' }}>{practice.name}</div>
          <div style={{ fontSize: '13px' }}>© {new Date().getFullYear()} {practice.name}. All rights reserved.</div>
        </div>
      </footer>

      </div>
    </>
  )
}
