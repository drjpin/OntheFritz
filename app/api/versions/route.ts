import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

async function getAccountFromToken(token: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('sessions')
    .select('*, accounts(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  return data ? (data.accounts as Record<string, unknown>) : null
}

// GET /api/versions — list version history
export async function GET(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('versions')
    .select('id, label, created_at')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(20)

  return NextResponse.json({ versions: data || [] })
}

// POST /api/versions  { action: 'restore', id: VERSION_ID }
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { action, id } = body

  if (action !== 'restore' || !id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const sb = getSupabaseAdmin()
  const { data: version } = await sb
    .from('versions')
    .select('*')
    .eq('id', id)
    .eq('account_id', account.id)
    .single()

  if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

  // Save current live as a version before restoring
  const { data: currentLive } = await sb.from('site_content').select('content').eq('account_id', account.id).eq('is_live', true).single()
  if (currentLive?.content) {
    await sb.from('versions').insert({
      account_id: account.id,
      content: currentLive.content,
      label: `Before restore — ${new Date().toLocaleString()}`,
    })
  }

  // Restore: set this version as live
  await sb.from('site_content').delete().eq('account_id', account.id).eq('is_live', true)
  await sb.from('site_content').insert({ account_id: account.id, content: version.content, is_live: true, is_draft: false })

  return NextResponse.json({ success: true, content: version.content })
}
