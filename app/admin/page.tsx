'use client'

import { useState, useEffect, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string
  email: string
  plan: 'demo' | 'monthly'
  status: string
  actions_used: number
  actions_limit: number
  cf_api_token: string | null
  cf_account_id: string | null
  cf_project_name: string | null
}

interface SiteFile {
  path: string
  content: string
}

interface Version {
  id: string
  label: string
  created_at: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  changedFiles?: string[]
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function api(path: string, options: RequestInit & { token?: string } = {}) {
  const { token, headers, ...rest } = options
  return fetch(path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-session-token': token } : {}),
      ...headers,
    },
  })
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (token: string, account: Account) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api('/api/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'login', email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); return }
      localStorage.setItem('session_token', data.token)
      onLogin(data.token, data.account)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div style={{ background: '#1e293b', borderRadius: 12, padding: '2.5rem', width: '100%', maxWidth: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>ChiroSite AI</h1>
        <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.875rem' }}>Sign in to manage your site</p>
        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #dc2626', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          <label style={{ ...labelStyle, marginTop: '1rem' }}>Password</label>
          <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={{ ...btnStyle, width: '100%', marginTop: '1.5rem', background: loading ? '#334155' : '#2563eb', cursor: loading ? 'not-allowed' : 'pointer' }} type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Main Admin Panel ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [tab, setTab] = useState<'ai' | 'files' | 'versions' | 'settings'>('ai')
  const [initializing, setInitializing] = useState(false)
  const [siteExists, setSiteExists] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // Validate stored token on load
  useEffect(() => {
    const stored = localStorage.getItem('session_token')
    if (!stored) { setCheckingAuth(false); return }
    api('/api/auth', {
      method: 'POST',
      body: JSON.stringify({ action: 'validate', token: stored }),
    }).then(r => r.json()).then(data => {
      if (data.valid) {
        setToken(stored)
        setAccount(data.account)
      } else {
        localStorage.removeItem('session_token')
      }
    }).finally(() => setCheckingAuth(false))
  }, [])

  // Check if site has files once logged in
  useEffect(() => {
    if (!token) return
    api('/api/files', { token }).then(r => r.json()).then(data => {
      setSiteExists((data.files ?? []).length > 0)
    })
  }, [token])

  function handleLogin(t: string, a: Account) {
    setToken(t)
    setAccount(a)
  }

  async function handleLogout() {
    await api('/api/auth', { method: 'POST', body: JSON.stringify({ action: 'logout', token }) })
    localStorage.removeItem('session_token')
    setToken(null)
    setAccount(null)
  }

  async function handleInit() {
    if (!token) return
    setInitializing(true)
    try {
      const res = await api('/api/init', { method: 'POST', token })
      if (res.ok) setSiteExists(true)
    } finally {
      setInitializing(false)
    }
  }

  if (checkingAuth) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#94a3b8' }}>Loading…</div>
  }

  if (!token || !account) {
    return <LoginScreen onLogin={handleLogin} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', height: 56 }}>
        <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' }}>ChiroSite AI</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
          {account.actions_used}/{account.actions_limit} actions · {account.plan}
        </span>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{account.email}</span>
        <button onClick={handleLogout} style={{ ...btnStyle, background: 'transparent', color: '#94a3b8', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>
          Sign out
        </button>
      </header>

      {/* No site yet */}
      {!siteExists && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Ready to build your site?</h2>
            <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>We'll set up your chiropractic website with a professional template. Then use the AI assistant to customize everything.</p>
            <button onClick={handleInit} disabled={initializing} style={{ ...btnStyle, background: initializing ? '#334155' : '#2563eb', padding: '0.875rem 2rem', fontSize: '1rem' }}>
              {initializing ? 'Setting up…' : 'Initialize My Site'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      {siteExists && (
        <>
          <nav style={{ background: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', padding: '0 1.5rem', gap: '0.25rem' }}>
            {(['ai', 'files', 'versions', 'settings'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '0.875rem 1rem',
                  fontSize: '0.875rem', fontWeight: 500, color: tab === t ? '#f1f5f9' : '#64748b',
                  borderBottom: `2px solid ${tab === t ? '#2563eb' : 'transparent'}`,
                  transition: 'color 0.15s',
                }}
              >
                {t === 'ai' ? 'AI Assistant' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </nav>

          <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {tab === 'ai' && <AITab token={token} account={account} setAccount={setAccount} />}
            {tab === 'files' && <FilesTab token={token} />}
            {tab === 'versions' && <VersionsTab token={token} />}
            {tab === 'settings' && <SettingsTab token={token} account={account} setAccount={setAccount} />}
          </main>
        </>
      )}
    </div>
  )
}

// ─── AI Assistant Tab ─────────────────────────────────────────────────────────

function AITab({ token, account, setAccount }: { token: string; account: Account; setAccount: (a: Account) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hi! I can make any changes to your website — update content, add sections, change colors, improve SEO, write blog posts, and more. What would you like to change?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [publishUrl, setPublishUrl] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build preview URL from Supabase storage
  useEffect(() => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sites/${account.id}/index.html`
    setPreviewUrl(url)
  }, [account.id])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const res = await api('/api/ai', {
        method: 'POST',
        token,
        body: JSON.stringify({ message: userMsg }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}` }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ ${data.summary}`,
          changedFiles: data.changedFiles,
        }])
        setAccount({ ...account, actions_used: data.actionsUsed })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '❌ Network error. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    setPublishing(true)
    setPublishError(null)
    try {
      const res = await api('/api/publish', { method: 'POST', token })
      const data = await res.json()
      if (!res.ok) {
        setPublishError(data.error)
      } else {
        setPublishUrl(data.url)
        setMessages(prev => [...prev, { role: 'assistant', content: `🚀 Published! Your site is live at ${data.url}` }])
      }
    } catch {
      setPublishError('Network error during publish')
    } finally {
      setPublishing(false)
    }
  }

  const hasCF = account.cf_api_token && account.cf_account_id && account.cf_project_name

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: 800, width: '100%', margin: '0 auto', padding: '1rem 1.5rem' }}>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <a
          href={previewUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{ ...btnStyle, background: '#0f4c81', textDecoration: 'none', fontSize: '0.875rem' }}
        >
          👁 Preview Site
        </a>
        {hasCF ? (
          <button
            onClick={handlePublish}
            disabled={publishing}
            style={{ ...btnStyle, background: publishing ? '#334155' : '#059669', fontSize: '0.875rem' }}
          >
            {publishing ? 'Publishing…' : '🚀 Publish to Cloudflare'}
          </button>
        ) : (
          <span style={{ fontSize: '0.75rem', color: '#64748b', alignSelf: 'center' }}>
            Add Cloudflare credentials in Settings to publish
          </span>
        )}
        {publishUrl && (
          <a href={publishUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#34d399', alignSelf: 'center' }}>
            ✓ Live: {publishUrl}
          </a>
        )}
        {publishError && <span style={{ fontSize: '0.75rem', color: '#f87171', alignSelf: 'center' }}>❌ {publishError}</span>}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '0.75rem 1rem', borderRadius: 12,
              background: msg.role === 'user' ? '#2563eb' : '#1e293b',
              color: '#f1f5f9', fontSize: '0.9rem', lineHeight: 1.6,
            }}>
              {msg.content}
              {msg.changedFiles && msg.changedFiles.length > 0 && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  Changed: {msg.changedFiles.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex' }}>
            <div style={{ background: '#1e293b', borderRadius: 12, padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
              Thinking…
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.75rem' }}>
        <input
          style={{ ...inputStyle, flex: 1, background: '#1e293b' }}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask me to change anything on your site…"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{ ...btnStyle, background: loading || !input.trim() ? '#334155' : '#2563eb', padding: '0.75rem 1.25rem' }}
        >
          Send
        </button>
      </form>
      <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: '0.5rem', textAlign: 'center' }}>
        {account.actions_used}/{account.actions_limit} actions used this month
      </p>
    </div>
  )
}

// ─── Files Tab ────────────────────────────────────────────────────────────────

function FilesTab({ token }: { token: string }) {
  const [files, setFiles] = useState<SiteFile[]>([])
  const [selected, setSelected] = useState<SiteFile | null>(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFiles()
  }, [])

  async function loadFiles() {
    setLoading(true)
    const res = await api('/api/files', { token })
    const data = await res.json()
    setFiles(data.files ?? [])
    setLoading(false)
  }

  function selectFile(file: SiteFile) {
    setSelected(file)
    setContent(file.content)
    setSaveMsg('')
  }

  async function saveFile() {
    if (!selected) return
    setSaving(true)
    setSaveMsg('')
    const res = await api('/api/files', {
      method: 'PUT',
      token,
      body: JSON.stringify({ path: selected.path, content }),
    })
    if (res.ok) {
      setSaveMsg('Saved!')
      setFiles(prev => prev.map(f => f.path === selected.path ? { ...f, content } : f))
    } else {
      setSaveMsg('Save failed')
    }
    setSaving(false)
  }

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading files…</div>

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* File list */}
      <div style={{ width: 200, borderRight: '1px solid #334155', overflowY: 'auto', padding: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Files</p>
        {files.map(f => (
          <button
            key={f.path}
            onClick={() => selectFile(f)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem',
              borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.875rem',
              background: selected?.path === f.path ? '#2563eb20' : 'transparent',
              color: selected?.path === f.path ? '#60a5fa' : '#cbd5e1',
            }}
          >
            {f.path}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selected ? (
          <>
            <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{selected.path}</span>
              <div style={{ flex: 1 }} />
              {saveMsg && <span style={{ fontSize: '0.75rem', color: saveMsg === 'Saved!' ? '#34d399' : '#f87171' }}>{saveMsg}</span>}
              <button onClick={saveFile} disabled={saving} style={{ ...btnStyle, background: saving ? '#334155' : '#2563eb', fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <textarea
              style={{
                flex: 1, background: '#0f172a', color: '#e2e8f0', border: 'none', padding: '1rem',
                fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem', lineHeight: 1.6,
                resize: 'none', outline: 'none',
              }}
              value={content}
              onChange={e => setContent(e.target.value)}
              spellCheck={false}
            />
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            Select a file to edit
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Versions Tab ─────────────────────────────────────────────────────────────

function VersionsTab({ token }: { token: string }) {
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    loadVersions()
  }, [])

  async function loadVersions() {
    setLoading(true)
    const res = await api('/api/versions', { token })
    const data = await res.json()
    setVersions(data.versions ?? [])
    setLoading(false)
  }

  async function restore(versionId: string) {
    if (!confirm('Restore this version? This will overwrite your current site files.')) return
    setRestoring(versionId)
    setMsg('')
    const res = await api('/api/versions', {
      method: 'POST',
      token,
      body: JSON.stringify({ action: 'restore', versionId }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg(`✅ Restored: ${data.label}`)
    } else {
      setMsg(`❌ ${data.error}`)
    }
    setRestoring(null)
  }

  async function snapshot() {
    const res = await api('/api/versions', {
      method: 'POST',
      token,
      body: JSON.stringify({ action: 'snapshot' }),
    })
    if (res.ok) {
      setMsg('✅ Snapshot saved')
      loadVersions()
    }
  }

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading…</div>

  return (
    <div style={{ padding: '1.5rem', maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Version History</h2>
        <div style={{ flex: 1 }} />
        {msg && <span style={{ fontSize: '0.875rem', color: msg.startsWith('✅') ? '#34d399' : '#f87171' }}>{msg}</span>}
        <button onClick={snapshot} style={{ ...btnStyle, background: '#334155', fontSize: '0.8rem' }}>
          Save Snapshot
        </button>
      </div>

      {versions.length === 0 && (
        <p style={{ color: '#64748b' }}>No versions yet. AI changes automatically create versions.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {versions.map((v, i) => (
          <div key={v.id} style={{ background: '#1e293b', borderRadius: 8, padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.9rem', color: '#f1f5f9', marginBottom: '0.25rem' }}>{v.label}</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(v.created_at).toLocaleString()}</p>
            </div>
            {i > 0 && (
              <button
                onClick={() => restore(v.id)}
                disabled={restoring === v.id}
                style={{ ...btnStyle, background: restoring === v.id ? '#334155' : '#92400e', fontSize: '0.8rem' }}
              >
                {restoring === v.id ? 'Restoring…' : 'Restore'}
              </button>
            )}
            {i === 0 && <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Current</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ token, account, setAccount }: { token: string; account: Account; setAccount: (a: Account) => void }) {
  const [cfToken, setCfToken] = useState(account.cf_api_token ?? '')
  const [cfAccountId, setCfAccountId] = useState(account.cf_account_id ?? '')
  const [cfProject, setCfProject] = useState(account.cf_project_name ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function saveCF(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    const res = await api('/api/settings', {
      method: 'POST',
      token,
      body: JSON.stringify({
        cf_api_token: cfToken,
        cf_account_id: cfAccountId,
        cf_project_name: cfProject,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setMsg('✅ Saved!')
      setAccount({ ...account, cf_api_token: cfToken, cf_account_id: cfAccountId, cf_project_name: cfProject })
    } else {
      setMsg(`❌ ${data.error}`)
    }
    setSaving(false)
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 600 }}>
      <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Settings</h2>

      {/* Account info */}
      <div style={{ background: '#1e293b', borderRadius: 8, padding: '1rem', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account</p>
        <p style={{ color: '#f1f5f9', marginBottom: '0.25rem' }}>{account.email}</p>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
          Plan: <span style={{ color: account.plan === 'monthly' ? '#34d399' : '#f59e0b' }}>{account.plan}</span>
          {' · '}
          {account.actions_used}/{account.actions_limit} actions used this month
        </p>
      </div>

      {/* Cloudflare */}
      <div style={{ background: '#1e293b', borderRadius: 8, padding: '1rem' }}>
        <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cloudflare Pages</p>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Connect your Cloudflare account to publish your site. You need a Cloudflare API token (with Pages:Edit permission), your account ID, and a Pages project name.
        </p>
        <form onSubmit={saveCF}>
          <label style={labelStyle}>API Token</label>
          <input style={inputStyle} type="password" value={cfToken} onChange={e => setCfToken(e.target.value)} placeholder="CF API token with Pages:Edit" />
          <label style={{ ...labelStyle, marginTop: '1rem' }}>Account ID</label>
          <input style={inputStyle} value={cfAccountId} onChange={e => setCfAccountId(e.target.value)} placeholder="Found in Cloudflare dashboard URL" />
          <label style={{ ...labelStyle, marginTop: '1rem' }}>Pages Project Name</label>
          <input style={inputStyle} value={cfProject} onChange={e => setCfProject(e.target.value)} placeholder="my-chiro-site" />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.25rem' }}>
            <button type="submit" disabled={saving} style={{ ...btnStyle, background: saving ? '#334155' : '#2563eb' }}>
              {saving ? 'Saving…' : 'Save Cloudflare Settings'}
            </button>
            {msg && <span style={{ fontSize: '0.875rem', color: msg.startsWith('✅') ? '#34d399' : '#f87171' }}>{msg}</span>}
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.625rem 0.875rem',
  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
  color: '#f1f5f9', fontSize: '0.9rem', outline: 'none',
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.8rem', color: '#94a3b8',
  marginBottom: '0.375rem', fontWeight: 500,
}

const btnStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  padding: '0.625rem 1.25rem', borderRadius: 8, border: 'none',
  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
  color: '#fff', background: '#2563eb', transition: 'background 0.15s',
}
