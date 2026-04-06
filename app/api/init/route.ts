import { NextRequest, NextResponse } from 'next/server'
import { getAccountFromToken, writeSiteFiles, readSiteFiles, getSupabaseAdmin } from '@/lib/supabase'
import { DEFAULT_HTML, DEFAULT_CSS, DEFAULT_JS } from '@/lib/defaultSite'

// POST /api/init — initialize site with default chiro template
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if site already has files
  const existing = await readSiteFiles(account.id)
  if (existing.length > 0) {
    return NextResponse.json({ error: 'Site already initialized' }, { status: 409 })
  }

  const files = [
    { path: 'index.html', content: DEFAULT_HTML },
    { path: 'style.css', content: DEFAULT_CSS },
    { path: 'script.js', content: DEFAULT_JS },
  ]

  try {
    await writeSiteFiles(account.id, files)
  } catch (err) {
    console.error('Init storage error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }

  // Save as version 1
  const sb = getSupabaseAdmin()
  await sb.from('versions').insert({
    account_id: account.id,
    label: 'Initial site template',
    files,
  })

  return NextResponse.json({ ok: true, files: files.map(f => f.path) })
}
