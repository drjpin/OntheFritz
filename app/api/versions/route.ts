import { NextRequest, NextResponse } from 'next/server'
import { getAccountFromToken, writeSiteFiles, readSiteFiles, getSupabaseAdmin } from '@/lib/supabase'

async function authenticate(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  return await getAccountFromToken(token)
}

// GET /api/versions — list version history
export async function GET(req: NextRequest) {
  const account = await authenticate(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('versions')
    .select('id, account_id, label, created_at')
    .eq('account_id', account.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ versions: data ?? [] })
}

// POST /api/versions — create snapshot or restore
// body: { action: 'snapshot', label?: string } | { action: 'restore', versionId: string }
export async function POST(req: NextRequest) {
  const account = await authenticate(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { action, label, versionId } = await req.json()
  const sb = getSupabaseAdmin()

  if (action === 'snapshot') {
    const files = await readSiteFiles(account.id)
    const { data, error } = await sb
      .from('versions')
      .insert({
        account_id: account.id,
        label: label ?? `Manual snapshot ${new Date().toLocaleString()}`,
        files,
      })
      .select('id, label, created_at')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ version: data })
  }

  if (action === 'restore') {
    if (!versionId) return NextResponse.json({ error: 'versionId required' }, { status: 400 })

    const { data: version } = await sb
      .from('versions')
      .select('*')
      .eq('id', versionId)
      .eq('account_id', account.id)
      .single()

    if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 })

    await writeSiteFiles(account.id, version.files)
    return NextResponse.json({ ok: true, label: version.label })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
