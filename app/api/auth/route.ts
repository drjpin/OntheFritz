import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex')
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  return hashPassword(password, salt) === hash
}

function makePasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  return `${salt}:${hashPassword(password, salt)}`
}

// POST /api/auth  { action: 'login' | 'logout' | 'create', email, password }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { action, email, password } = body

  if (action === 'login') {
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    const sb = getSupabaseAdmin()
    const { data: account } = await sb.from('accounts').select('*').eq('email', email.toLowerCase().trim()).single()
    if (!account) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    if (account.status !== 'active') return NextResponse.json({ error: 'Account is inactive' }, { status: 403 })
    if (!verifyPassword(password, account.password_hash)) return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })

    // Create session
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await sb.from('sessions').insert({ account_id: account.id, token, expires_at: expiresAt })

    const { password_hash: _, ...safeAccount } = account
    return NextResponse.json({ token, account: safeAccount })
  }

  if (action === 'logout') {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) {
      const sb = getSupabaseAdmin()
      await sb.from('sessions').delete().eq('token', token)
    }
    return NextResponse.json({ success: true })
  }

  if (action === 'create') {
    // Admin-only account creation (protected by admin secret)
    const adminSecret = req.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })

    const sb = getSupabaseAdmin()
    const password_hash = makePasswordHash(password)
    const license_key = crypto.randomBytes(16).toString('hex')
    const { data, error } = await sb
      .from('accounts')
      .insert({ email: email.toLowerCase().trim(), password_hash, license_key, plan: body.plan || 'demo', actions_limit: body.actions_limit || 5 })
      .select('id, email, license_key, plan, status, actions_used, actions_limit')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ account: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

// GET /api/auth — validate session token
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const sb = getSupabaseAdmin()
  const { data: session } = await sb
    .from('sessions')
    .select('*, accounts(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!session) return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })

  const { password_hash: _, ...safeAccount } = session.accounts as Record<string, unknown> & { password_hash: string }
  return NextResponse.json({ account: safeAccount })
}
