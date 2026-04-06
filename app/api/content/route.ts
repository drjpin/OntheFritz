import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { DEFAULT_CONTENT, type SiteContent } from '@/lib/types'

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

// GET /api/content?key=LICENSE_KEY  (public, for client sites)
// GET /api/content?draft=true       (authenticated, for preview)
export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const key = searchParams.get('key')
  const draft = searchParams.get('draft') === 'true'

  if (draft) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const account = await getAccountFromToken(token)
    if (!account) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const { data } = await sb.from('site_content').select('*').eq('account_id', account.id).eq('is_draft', true).single()
    const content = data?.content ?? DEFAULT_CONTENT
    return NextResponse.json({ content })
  }

  if (!key) return NextResponse.json({ error: 'License key required' }, { status: 400 })

  // 'demo' key maps to demo account
  let accountQuery
  if (key === 'demo') {
    accountQuery = await sb.from('accounts').select('id, status').eq('plan', 'demo').order('created_at', { ascending: true }).limit(1)
  } else {
    accountQuery = await sb.from('accounts').select('id, status').eq('license_key', key).limit(1)
  }

  const account = accountQuery.data?.[0]
  if (!account) return NextResponse.json({ content: DEFAULT_CONTENT })
  if (account.status !== 'active') {
    return NextResponse.json({ error: 'inactive', content: null }, { status: 402 })
  }

  const { data } = await sb.from('site_content').select('content').eq('account_id', account.id).eq('is_live', true).single()
  return NextResponse.json({ content: data?.content ?? DEFAULT_CONTENT })
}

// PUT /api/content         — save draft (authenticated)
// PUT /api/content?publish — promote draft to live (authenticated)
export async function PUT(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  const sb = getSupabaseAdmin()
  const { searchParams } = new URL(req.url)
  const publish = searchParams.get('publish') !== null
  const body = await req.json().catch(() => ({}))
  const content: SiteContent = body.content

  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  if (publish) {
    // Save a version snapshot first
    const { data: currentLive } = await sb.from('site_content').select('content').eq('account_id', account.id).eq('is_live', true).single()
    await sb.from('versions').insert({
      account_id: account.id,
      content: currentLive?.content ?? content,
      label: currentLive?.content
        ? `Backup — ${new Date().toLocaleString()}`
        : `Initial version — ${new Date().toLocaleString()}`,
    })
    // Upsert live
    await sb.from('site_content').delete().eq('account_id', account.id).eq('is_live', true)
    await sb.from('site_content').insert({ account_id: account.id, content, is_live: true, is_draft: false })
    return NextResponse.json({ success: true, message: 'Published successfully' })
  }

  // Save draft
  await sb.from('site_content').delete().eq('account_id', account.id).eq('is_draft', true)
  await sb.from('site_content').insert({ account_id: account.id, content, is_live: false, is_draft: true })
  return NextResponse.json({ success: true, message: 'Draft saved' })
}
