import { NextRequest, NextResponse } from 'next/server'
import { createHmac, randomBytes } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'

function hashPassword(password: string, salt: string): string {
  return createHmac('sha256', salt).update(password).digest('hex')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

// POST /api/auth — login, logout, create account, or validate token
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { action } = body

  if (action === 'login') {
    const { email, password } = body
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    const sb = getSupabaseAdmin()
    const { data: account } = await sb
      .from('accounts')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()
    if (!account) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    const expected = hashPassword(password, account.password_salt)
    if (expected !== account.password_hash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    if (account.status !== 'active') {
      return NextResponse.json({ error: 'Account inactive' }, { status: 403 })
    }
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    await sb.from('sessions').insert({ account_id: account.id, token, expires_at: expiresAt })
    const { password_hash, password_salt, ...safeAccount } = account
    return NextResponse.json({ token, account: safeAccount })
  }

  if (action === 'logout') {
    const { token } = body
    if (token) {
      const sb = getSupabaseAdmin()
      await sb.from('sessions').delete().eq('token', token)
    }
    return NextResponse.json({ ok: true })
  }

  if (action === 'validate') {
    const { token } = body
    if (!token) return NextResponse.json({ valid: false })
    const sb = getSupabaseAdmin()
    const { data } = await sb
      .from('sessions')
      .select('*, accounts(*)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single()
    if (!data) return NextResponse.json({ valid: false })
    const account = data.accounts as Record<string, unknown>
    const { password_hash, password_salt, ...safeAccount } = account as Record<string, unknown> & { password_hash: string; password_salt: string }
    return NextResponse.json({ valid: true, account: safeAccount })
  }

  if (action === 'create') {
    const adminSecret = req.headers.get('x-admin-secret')
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const { email, password, plan = 'demo' } = body
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    const salt = randomBytes(16).toString('hex')
    const hash = hashPassword(password, salt)
    const sb = getSupabaseAdmin()
    const { data, error } = await sb
      .from('accounts')
      .insert({
        email: email.toLowerCase(),
        password_hash: hash,
        password_salt: salt,
        plan,
        status: 'active',
        actions_used: 0,
        actions_limit: plan === 'monthly' ? 50 : 5,
        actions_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ account: data })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
