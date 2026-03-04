import { NextResponse } from 'next/server'

function getSupabase() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const game = searchParams.get('game')
  if (!game) return NextResponse.json({ scores: [] })

  const supabase = getSupabase()

  // Start of today UTC
  const todayStart = new Date()
  todayStart.setUTCHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('daily_scores')
    .select('username, score')
    .eq('game', game)
    .gte('created_at', todayStart.toISOString())
    .order('score', { ascending: false })

  if (error) return NextResponse.json({ scores: [] })

  // Keep only best score per username
  const best = new Map<string, number>()
  for (const row of (data || [])) {
    if (!best.has(row.username) || row.score > best.get(row.username)!) {
      best.set(row.username, row.score)
    }
  }

  const scores = Array.from(best.entries())
    .map(([username, score]) => ({ username, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  return NextResponse.json({ scores })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const { username, game, score } = body
  if (!username || !game || typeof score !== 'number') {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { error } = await supabase
    .from('daily_scores')
    .insert({ username, game, score })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
