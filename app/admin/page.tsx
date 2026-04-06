'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { DEFAULT_CONTENT, type SiteContent, type Account, type Version } from '@/lib/types'

type AdminView = 'dashboard' | 'content' | 'ai' | 'versions'
type ContentTab = 'practice' | 'hero' | 'services' | 'about' | 'hours' | 'testimonials' | 'blog' | 'style'

interface AiMessage {
  role: 'user' | 'ai'
  text: string
}

// ── Helpers ──────────────────────────────────────────────────

function ActionBadge({ used, limit }: { used: number; limit: number }) {
  const remaining = limit - used
  const pct = used / limit
  const cls = pct >= 1 ? 'danger' : pct >= 0.8 ? 'warning' : ''
  return (
    <span className={`action-badge ${cls}`}>
      ⚡ {remaining} action{remaining !== 1 ? 's' : ''} remaining
    </span>
  )
}

// ── Login ─────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string, account: Account) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      localStorage.setItem('chiro_admin_token', data.token)
      onLogin(data.token, data.account)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#1A5276', marginBottom: '8px' }}>ChiroSite Admin</div>
          <div style={{ fontSize: '15px', color: '#64748b' }}>Sign in to manage your website</div>
        </div>
        <form onSubmit={handleLogin} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="admin-label">Email address</label>
            <input className="admin-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </div>
          <div>
            <label className="admin-label">Password</label>
            <input className="admin-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}
          <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '4px', padding: '12px' }} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#94a3b8' }}>
          Need access? Contact your site administrator.
        </p>
      </div>
    </div>
  )
}

// ── Sidebar ───────────────────────────────────────────────────

const NAV_ITEMS: { id: AdminView; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'content', label: 'Edit Content', icon: '✏' },
  { id: 'ai', label: 'AI Assistant', icon: '✦' },
  { id: 'versions', label: 'Version History', icon: '⟳' },
]

function Sidebar({ view, setView, account, onLogout }: {
  view: AdminView
  setView: (v: AdminView) => void
  account: Account
  onLogout: () => void
}) {
  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-logo">
        <div style={{ fontWeight: 800, fontSize: '17px', color: 'white' }}>ChiroSite</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>Admin Panel</div>
      </div>
      <nav style={{ padding: '12px 0', flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setView(item.id)} className={`admin-nav-item ${view === item.id ? 'active' : ''}`}>
            <span style={{ fontSize: '16px', width: '20px' }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>Logged in as</div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginBottom: '12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.email}</div>
        <button onClick={onLogout} className="admin-btn" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Sign Out</button>
      </div>
    </aside>
  )
}

// ── Dashboard ─────────────────────────────────────────────────

function Dashboard({ account, setView }: { account: Account; setView: (v: AdminView) => void }) {
  const remaining = account.actions_limit - account.actions_used
  const pct = Math.min(100, (account.actions_used / account.actions_limit) * 100)

  return (
    <div>
      <div className="admin-section-title">Dashboard</div>
      <div className="admin-section-sub">Welcome back! Here&apos;s an overview of your account.</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Plan', value: account.plan === 'demo' ? 'Demo' : 'Monthly', color: '#7c3aed' },
          { label: 'Status', value: account.status === 'active' ? '● Active' : '○ Inactive', color: account.status === 'active' ? '#16a34a' : '#dc2626' },
          { label: 'Actions Used', value: `${account.actions_used} / ${account.actions_limit}`, color: '#1A5276' },
          { label: 'Actions Left', value: `${remaining}`, color: remaining <= 5 ? '#dc2626' : '#16a34a' },
        ].map(stat => (
          <div key={stat.label} className="admin-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px', fontWeight: 500 }}>{stat.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>AI Action Usage</span>
          <span style={{ fontSize: '13px', color: '#64748b' }}>{account.actions_used}/{account.actions_limit}</span>
        </div>
        <div style={{ background: '#f1f5f9', borderRadius: '999px', height: '10px', overflow: 'hidden' }}>
          <div style={{ background: pct >= 80 ? '#ef4444' : '#2980B9', height: '100%', width: `${pct}%`, borderRadius: '999px', transition: 'width 0.3s' }} />
        </div>
        {account.plan === 'demo' && (
          <p style={{ marginTop: '12px', fontSize: '13px', color: '#64748b' }}>
            Demo accounts get {account.actions_limit} total AI actions. Upgrade to a monthly plan for {50} actions per month.
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
        {[
          { icon: '✏', title: 'Edit Your Content', desc: 'Update text, services, hours, and more.', action: () => setView('content'), btn: 'Edit Content' },
          { icon: '✦', title: 'AI Assistant', desc: 'Describe a change and let AI handle it for you.', action: () => setView('ai'), btn: 'Open AI Assistant' },
          { icon: '⟳', title: 'Version History', desc: 'Restore a previous version if something goes wrong.', action: () => setView('versions'), btn: 'View History' },
        ].map(card => (
          <div key={card.title} className="admin-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '28px', marginBottom: '12px' }}>{card.icon}</div>
            <div style={{ fontWeight: 700, fontSize: '16px', color: '#1a202c', marginBottom: '6px' }}>{card.title}</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px', flex: 1 }}>{card.desc}</div>
            <button onClick={card.action} className="admin-btn admin-btn-primary">{card.btn}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Content Editor ────────────────────────────────────────────

function ContentEditor({ draft, setDraft, onSaveDraft, onPublish, saving, publishing, liveContent }: {
  draft: SiteContent
  setDraft: (c: SiteContent) => void
  onSaveDraft: () => void
  onPublish: () => void
  saving: boolean
  publishing: boolean
  liveContent: SiteContent
}) {
  const [tab, setTab] = useState<ContentTab>('practice')
  const [hasChanges, setHasChanges] = useState(false)

  function update(path: string[], value: unknown) {
    setHasChanges(true)
    setDraft(updateNested({ ...draft }, path, value))
  }

  function updateNested(obj: Record<string, unknown>, [key, ...rest]: string[], value: unknown): SiteContent {
    if (rest.length === 0) { obj[key] = value; return obj as unknown as SiteContent }
    obj[key] = updateNested({ ...(obj[key] as Record<string, unknown>) }, rest, value)
    return obj as unknown as SiteContent
  }

  const TABS: { id: ContentTab; label: string }[] = [
    { id: 'practice', label: 'Practice Info' },
    { id: 'hero', label: 'Hero' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'Doctors' },
    { id: 'hours', label: 'Hours' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'blog', label: 'Blog Posts' },
    { id: 'style', label: 'Style' },
  ]

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  function addService() {
    update(['services'], [...draft.services, { title: 'New Service', description: 'Service description.' }])
  }
  function removeService(i: number) {
    update(['services'], draft.services.filter((_, idx) => idx !== i))
  }
  function addTestimonial() {
    update(['testimonials'], [...draft.testimonials, { name: 'Patient Name', text: 'Testimonial text.', rating: 5 }])
  }
  function removeTestimonial(i: number) {
    update(['testimonials'], draft.testimonials.filter((_, idx) => idx !== i))
  }
  function addBlogPost() {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
    update(['blog'], [...draft.blog, { title: 'New Blog Post', excerpt: 'Post excerpt here.', date: today, slug: 'new-blog-post' }])
  }
  function removeBlogPost(i: number) {
    update(['blog'], draft.blog.filter((_, idx) => idx !== i))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="admin-section-title">Edit Content</div>
          <div className="admin-section-sub">Changes are saved as a draft. Preview before publishing.</div>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {hasChanges && (
            <button onClick={onSaveDraft} className="admin-btn admin-btn-secondary" disabled={saving}>
              {saving ? 'Saving…' : '↓ Save Draft'}
            </button>
          )}
          <a href="/preview" target="_blank" className="admin-btn admin-btn-secondary" style={{ textDecoration: 'none' }}>
            👁 Preview
          </a>
          <button onClick={() => { onPublish(); setHasChanges(false) }} className="admin-btn admin-btn-primary" disabled={publishing}>
            {publishing ? 'Publishing…' : '🚀 Publish'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px', background: '#f8fafc', padding: '8px', borderRadius: '10px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`admin-tab ${tab === t.id ? 'active' : ''}`}>{t.label}</button>
        ))}
      </div>

      <div className="admin-card">
        {/* Practice Info */}
        {tab === 'practice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151', marginBottom: '4px' }}>Practice Information</h3>
            {([
              ['Practice Name', ['practice', 'name']],
              ['Tagline', ['practice', 'tagline']],
              ['Phone Number', ['practice', 'phone']],
              ['Email Address', ['practice', 'email']],
              ['Street Address', ['practice', 'address']],
              ['City, State, ZIP', ['practice', 'city']],
            ] as [string, string[]][]).map(([label, path]) => (
              <div key={label}>
                <label className="admin-label">{label}</label>
                <input className="admin-input" value={String(path.reduce((o: unknown, k) => (o as Record<string, unknown>)[k], draft))} onChange={e => update(path, e.target.value)} />
              </div>
            ))}
          </div>
        )}

        {/* Hero */}
        {tab === 'hero' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151' }}>Hero Section</h3>
            <div>
              <label className="admin-label">Main Headline</label>
              <input className="admin-input" value={draft.hero.headline} onChange={e => update(['hero', 'headline'], e.target.value)} />
            </div>
            <div>
              <label className="admin-label">Subtext</label>
              <textarea className="admin-textarea" value={draft.hero.subtext} onChange={e => update(['hero', 'subtext'], e.target.value)} />
            </div>
            <div>
              <label className="admin-label">Call-to-Action Button Text</label>
              <input className="admin-input" value={draft.hero.cta} onChange={e => update(['hero', 'cta'], e.target.value)} />
            </div>
          </div>
        )}

        {/* Services */}
        {tab === 'services' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151' }}>Services ({draft.services.length})</h3>
              <button onClick={addService} className="admin-btn admin-btn-secondary">+ Add Service</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {draft.services.map((svc, i) => (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>Service #{i + 1}</span>
                    <button onClick={() => removeService(i)} className="admin-btn admin-btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>Remove</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label className="admin-label">Title</label>
                      <input className="admin-input" value={svc.title} onChange={e => update(['services', String(i), 'title'], e.target.value)} />
                    </div>
                    <div>
                      <label className="admin-label">Description</label>
                      <textarea className="admin-textarea" value={svc.description} onChange={e => update(['services', String(i), 'description'], e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* About */}
        {tab === 'about' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151' }}>Doctors ({draft.doctors.length})</h3>
              <button onClick={() => update(['doctors'], [...draft.doctors, { name: 'Dr. New Doctor', title: 'Doctor of Chiropractic', bio: 'Bio here.', yearsExperience: 1, education: 'Chiropractic College' }])} className="admin-btn admin-btn-secondary">+ Add Doctor</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {draft.doctors.map((doc, i) => (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontWeight: 700, color: '#374151' }}>{doc.name || `Doctor #${i + 1}`}</span>
                    {draft.doctors.length > 1 && (
                      <button onClick={() => update(['doctors'], draft.doctors.filter((_, idx) => idx !== i))} className="admin-btn admin-btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>Remove</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {([['Doctor Name', 'name'], ['Title / Credentials', 'title'], ['Education', 'education']] as [string, string][]).map(([label, key]) => (
                      <div key={key}>
                        <label className="admin-label">{label}</label>
                        <input className="admin-input" value={String(doc[key as keyof typeof doc])} onChange={e => update(['doctors', String(i), key], e.target.value)} />
                      </div>
                    ))}
                    <div>
                      <label className="admin-label">Years of Experience</label>
                      <input className="admin-input" type="number" value={doc.yearsExperience} onChange={e => update(['doctors', String(i), 'yearsExperience'], parseInt(e.target.value) || 0)} style={{ maxWidth: '120px' }} />
                    </div>
                    <div>
                      <label className="admin-label">Bio (blank lines = paragraphs)</label>
                      <textarea className="admin-textarea" value={doc.bio} onChange={e => update(['doctors', String(i), 'bio'], e.target.value)} style={{ minHeight: '140px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hours */}
        {tab === 'hours' && (
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151', marginBottom: '20px' }}>Office Hours</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {days.map(day => (
                <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <span style={{ width: '100px', fontSize: '14px', fontWeight: 600, color: '#374151', flexShrink: 0 }}>{day}</span>
                  <input className="admin-input" value={draft.hours[day] ?? 'Closed'} onChange={e => update(['hours', day], e.target.value)} placeholder="e.g. 9:00 AM – 5:00 PM or Closed" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        {tab === 'testimonials' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151' }}>Testimonials</h3>
              <button onClick={addTestimonial} className="admin-btn admin-btn-secondary">+ Add Testimonial</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {draft.testimonials.map((t, i) => (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>Testimonial #{i + 1}</span>
                    <button onClick={() => removeTestimonial(i)} className="admin-btn admin-btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>Remove</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label className="admin-label">Patient Name</label>
                      <input className="admin-input" value={t.name} onChange={e => update(['testimonials', String(i), 'name'], e.target.value)} />
                    </div>
                    <div>
                      <label className="admin-label">Quote</label>
                      <textarea className="admin-textarea" value={t.text} onChange={e => update(['testimonials', String(i), 'text'], e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                    <div>
                      <label className="admin-label">Rating (1–5)</label>
                      <input className="admin-input" type="number" min={1} max={5} value={t.rating} onChange={e => update(['testimonials', String(i), 'rating'], Math.min(5, Math.max(1, parseInt(e.target.value) || 5)))} style={{ maxWidth: '80px' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blog */}
        {tab === 'blog' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151' }}>Blog Posts ({draft.blog.length})</h3>
              <button onClick={addBlogPost} className="admin-btn admin-btn-secondary">+ Add Post</button>
            </div>
            {draft.blog.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📝</div>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>No blog posts yet</div>
                <div style={{ fontSize: '14px' }}>Add one manually or use the AI assistant to write a post for you.</div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {draft.blog.map((post, i) => (
                <div key={i} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>Post #{i + 1}</span>
                    <button onClick={() => removeBlogPost(i)} className="admin-btn admin-btn-danger" style={{ padding: '4px 10px', fontSize: '12px' }}>Remove</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label className="admin-label">Title</label>
                      <input className="admin-input" value={post.title} onChange={e => update(['blog', String(i), 'title'], e.target.value)} />
                    </div>
                    <div>
                      <label className="admin-label">Excerpt / Summary</label>
                      <textarea className="admin-textarea" value={post.excerpt} onChange={e => update(['blog', String(i), 'excerpt'], e.target.value)} style={{ minHeight: '80px' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <label className="admin-label">Date</label>
                        <input className="admin-input" value={post.date} onChange={e => update(['blog', String(i), 'date'], e.target.value)} placeholder="April 1, 2025" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="admin-label">Slug (URL)</label>
                        <input className="admin-input" value={post.slug} onChange={e => update(['blog', String(i), 'slug'], e.target.value.toLowerCase().replace(/\s+/g, '-'))} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Style */}
        {tab === 'style' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '16px', color: '#374151' }}>Style & Colors</h3>
            <p style={{ fontSize: '14px', color: '#64748b', background: '#f0f7ff', padding: '12px 16px', borderRadius: '8px' }}>
              💡 Changes to style affect the entire site. We recommend sticking to deep blues, greens, or teals for a professional medical look.
            </p>
            {([
              ['Primary Color', 'primaryColor', 'Used for headings, nav logo, and dark sections'],
              ['Accent Color', 'accentColor', 'Used for buttons, links, and highlights'],
              ['Background Color', 'bgColor', 'Used for alternating section backgrounds'],
            ] as [string, string, string][]).map(([label, key, hint]) => (
              <div key={key}>
                <label className="admin-label">{label}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="color" value={String(draft.style[key as keyof typeof draft.style])} onChange={e => update(['style', key], e.target.value)}
                    style={{ width: '52px', height: '40px', padding: '2px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', background: 'white' }} />
                  <input className="admin-input" value={String(draft.style[key as keyof typeof draft.style])} onChange={e => update(['style', key], e.target.value)}
                    style={{ maxWidth: '140px', fontFamily: 'monospace' }} placeholder="#1A5276" />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{hint}</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
              {[
                { label: 'Navy Blue', p: '#1B3A6B', a: '#2563EB', bg: '#EFF6FF' },
                { label: 'Forest Green', p: '#14532D', a: '#16A34A', bg: '#F0FDF4' },
                { label: 'Deep Teal', p: '#134E4A', a: '#0D9488', bg: '#F0FDFA' },
                { label: 'Burgundy', p: '#6B0F1A', a: '#BE123C', bg: '#FFF1F2' },
              ].map(preset => (
                <button key={preset.label} onClick={() => update(['style'], { primaryColor: preset.p, accentColor: preset.a, bgColor: preset.bg })}
                  className="admin-btn admin-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', borderRadius: '50%', background: preset.p }} />
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Diff notice */}
      {hasChanges && (
        <div style={{ marginTop: '16px', background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', color: '#92400e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠ You have unsaved changes.</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setDraft(liveContent); setHasChanges(false) }} className="admin-btn admin-btn-secondary" style={{ fontSize: '13px', padding: '6px 12px' }}>Discard</button>
            <button onClick={() => { onSaveDraft(); setHasChanges(false) }} className="admin-btn admin-btn-primary" style={{ fontSize: '13px', padding: '6px 12px' }} disabled={saving}>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── AI Assistant ──────────────────────────────────────────────

function AIAssistant({ draft, setDraft, account, token, onSaveDraft }: {
  draft: SiteContent
  setDraft: (c: SiteContent) => void
  account: Account
  token: string
  onSaveDraft: () => void
}) {
  const [messages, setMessages] = useState<AiMessage[]>([
    { role: 'ai', text: "Hi! I'm your AI site assistant. Tell me what you'd like to change — for example:\n\n• \"Update my hours to close at 5pm on Fridays\"\n• \"Write a blog post about the benefits of regular chiropractic care\"\n• \"Change my hero headline to something more welcoming\"\n• \"Make the site colors navy blue and gold\"" },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [actionsLeft, setActionsLeft] = useState(account.actions_limit - account.actions_used)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage() {
    if (!input.trim() || loading || actionsLeft <= 0) return
    const userMsg = input.trim()
    setInput('')
    setMessages(m => [...m, { role: 'user', text: userMsg }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, content: draft }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(m => [...m, { role: 'ai', text: `❌ ${data.error}` }])
        return
      }
      setDraft(data.content)
      setActionsLeft(data.actionsRemaining)
      setMessages(m => [...m, { role: 'ai', text: `✅ ${data.message}\n\nI've updated your draft. Review the changes in the "Edit Content" tab, then preview and publish when you're ready.` }])
      onSaveDraft()
    } catch {
      setMessages(m => [...m, { role: 'ai', text: '❌ Connection error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '500px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div className="admin-section-title">AI Assistant</div>
          <div className="admin-section-sub">Describe any change and AI will update your draft automatically.</div>
        </div>
        <ActionBadge used={account.actions_limit - actionsLeft} limit={account.actions_limit} />
      </div>

      {/* Chat area */}
      <div className="admin-card" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', marginBottom: '12px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'ai-bubble-user' : 'ai-bubble-ai'} style={{ whiteSpace: 'pre-wrap' }}>
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="ai-bubble-ai" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite' }} />
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite 0.2s' }} />
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1s infinite 0.4s' }} />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {actionsLeft > 0 ? (
        <div className="admin-card" style={{ display: 'flex', gap: '12px', padding: '16px' }}>
          <textarea
            className="admin-textarea"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder="Describe a change… (Enter to send, Shift+Enter for new line)"
            style={{ minHeight: '60px', maxHeight: '120px', resize: 'vertical', flex: 1, marginBottom: 0 }}
            disabled={loading}
          />
          <button onClick={sendMessage} className="admin-btn admin-btn-primary" disabled={loading || !input.trim()} style={{ alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>
            {loading ? '…' : 'Send ↵'}
          </button>
        </div>
      ) : (
        <div className="admin-card" style={{ background: '#fef2f2', borderColor: '#fecaca', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontWeight: 700, color: '#dc2626', marginBottom: '8px' }}>Action limit reached</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {account.plan === 'demo' ? 'Demo accounts get 5 AI actions. Contact us to upgrade.' : 'Your limit resets at the start of next month.'}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Version History ───────────────────────────────────────────

function VersionHistory({ token, onRestore }: { token: string; onRestore: (content: SiteContent) => void }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/versions', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setVersions(d.versions || []))
      .finally(() => setLoading(false))
  }, [token])

  async function handleRestore(id: string) {
    if (!confirm('Restore this version? Your current live content will be backed up first.')) return
    setRestoring(id)
    try {
      const res = await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'restore', id }),
      })
      const data = await res.json()
      if (res.ok) {
        onRestore(data.content)
        setSuccess('Version restored successfully!')
        setTimeout(() => setSuccess(''), 4000)
        // Refresh list
        fetch('/api/versions', { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => setVersions(d.versions || []))
      }
    } finally {
      setRestoring(null)
    }
  }

  return (
    <div>
      <div className="admin-section-title">Version History</div>
      <div className="admin-section-sub">Versions are saved automatically when you publish. Restore any version in one click.</div>

      {success && (
        <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', color: '#16a34a', fontWeight: 600, marginBottom: '16px' }}>
          ✓ {success}
        </div>
      )}

      <div className="admin-card">
        {loading && <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading versions…</div>}
        {!loading && versions.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>⟳</div>
            <div style={{ fontWeight: 600, marginBottom: '8px' }}>No versions yet</div>
            <div style={{ fontSize: '14px' }}>Version snapshots are created automatically when you publish changes.</div>
          </div>
        )}
        {versions.map(v => (
          <div key={v.id} className="version-item">
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>{v.label}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                {new Date(v.created_at).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => handleRestore(v.id)}
              className="admin-btn admin-btn-secondary"
              style={{ fontSize: '13px', padding: '6px 14px' }}
              disabled={restoring === v.id}
            >
              {restoring === v.id ? 'Restoring…' : 'Restore'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Admin Panel ──────────────────────────────────────────

export default function AdminPanel() {
  const [token, setToken] = useState<string | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [view, setView] = useState<AdminView>('dashboard')
  const [liveContent, setLiveContent] = useState<SiteContent>(DEFAULT_CONTENT)
  const [draftContent, setDraftContent] = useState<SiteContent>(DEFAULT_CONTENT)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('chiro_admin_token')
    if (!stored) { setAuthLoading(false); return }

    fetch('/api/auth', { headers: { Authorization: `Bearer ${stored}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.account) {
          setToken(stored)
          setAccount(data.account)
          loadContent(stored)
        } else {
          localStorage.removeItem('chiro_admin_token')
        }
      })
      .finally(() => setAuthLoading(false))
  }, [])

  function loadContent(t: string) {
    // Load live content
    fetch('/api/content', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.content) { setLiveContent(data.content); setDraftContent(data.content) } })

    // Load draft content
    fetch('/api/content?draft=true', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.content) setDraftContent(data.content) })
  }

  function handleLogin(t: string, acct: Account) {
    setToken(t)
    setAccount(acct)
    loadContent(t)
  }

  function handleLogout() {
    if (token) fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) })
    localStorage.removeItem('chiro_admin_token')
    setToken(null)
    setAccount(null)
    setView('dashboard')
  }

  const saveDraft = useCallback(async (content?: SiteContent) => {
    if (!token) return
    setSaving(true)
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: content ?? draftContent }),
      })
      if (res.ok) showToast('Draft saved.')
    } finally {
      setSaving(false)
    }
  }, [token, draftContent])

  const publishContent = useCallback(async () => {
    if (!token) return
    setPublishing(true)
    try {
      const res = await fetch('/api/content?publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: draftContent }),
      })
      if (res.ok) {
        setLiveContent(draftContent)
        showToast('🚀 Published! Your site is now live.')
      }
    } finally {
      setPublishing(false)
    }
  }, [token, draftContent])

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif', color: '#64748b' }}>
      Loading…
    </div>
  )

  if (!token || !account) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className="admin-layout">
      <Sidebar view={view} setView={setView} account={account} onLogout={handleLogout} />

      <div className="admin-main">
        {/* Top bar */}
        <div className="admin-topbar">
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#374151' }}>
            {NAV_ITEMS.find(n => n.id === view)?.label}
          </div>
          <ActionBadge used={account.actions_used} limit={account.actions_limit} />
        </div>

        {/* Content */}
        <div className="admin-content">
          {view === 'dashboard' && <Dashboard account={account} setView={setView} />}
          {view === 'content' && (
            <ContentEditor
              draft={draftContent}
              setDraft={setDraftContent}
              onSaveDraft={() => saveDraft()}
              onPublish={publishContent}
              saving={saving}
              publishing={publishing}
              liveContent={liveContent}
            />
          )}
          {view === 'ai' && token && (
            <AIAssistant
              draft={draftContent}
              setDraft={setDraftContent}
              account={account}
              token={token}
              onSaveDraft={() => saveDraft()}
            />
          )}
          {view === 'versions' && token && (
            <VersionHistory
              token={token}
              onRestore={content => { setLiveContent(content); setDraftContent(content); showToast('Version restored!') }}
            />
          )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#1a202c', color: 'white', padding: '14px 20px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.2)', fontFamily: 'Inter, system-ui, sans-serif' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
