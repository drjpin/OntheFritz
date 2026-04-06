import { NextRequest, NextResponse } from 'next/server'
import { getAccountFromToken, getSupabaseAdmin } from '@/lib/supabase'

// POST /api/settings — update Cloudflare credentials
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cf_api_token, cf_account_id, cf_project_name } = await req.json()

  const sb = getSupabaseAdmin()
  const { error } = await sb
    .from('accounts')
    .update({ cf_api_token, cf_account_id, cf_project_name })
    .eq('id', account.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
