import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const game = searchParams.get('game')

  const supabase = getSupabase()
  const query = supabase
    .from('scores')
    .select('*')
    .order('score', { ascending: false })
    .limit(10)

  if (game) query.eq('game', game)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ scores: data })
}

export async function POST(req: NextRequest) {
  try {
    const { game, username, score, avatar_url } = await req.json()

    if (!game || !username || score === undefined) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const cleanUsername = username.slice(0, 16).replace(/[^a-zA-Z0-9_-]/g, '')

    const supabase = getSupabase()
    // Check if this user already has a score for this game
    const { data: existing } = await supabase
      .from('scores')
      .select('*')
      .eq('game', game)
      .eq('username', cleanUsername)
      .single()

    if (existing) {
      if (score > existing.score) {
        const { error } = await supabase
          .from('scores')
          .update({ score, avatar_url: avatar_url || existing.avatar_url })
          .eq('id', existing.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await supabase
        .from('scores')
        .insert([{ game, username: cleanUsername, score, avatar_url: avatar_url || null }])
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
