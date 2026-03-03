import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { Filter } from 'bad-words'

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 10000 })
    return false
  }
  if (entry.count >= 3) return true
  entry.count++
  return false
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data?.reverse() || [] })
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Slow down! Max 3 messages per 10 seconds.' }, { status: 429 })
    }

    const { username, message } = await req.json()

    if (!username || !message) {
      return NextResponse.json({ error: 'Username and message required' }, { status: 400 })
    }

    if (message.length > 200) {
      return NextResponse.json({ error: 'Message too long (max 200 chars)' }, { status: 400 })
    }

    const cleanUsername = username.slice(0, 16).replace(/[^a-zA-Z0-9_\- ]/g, '').trim()
    let cleanMessage = message.trim()

    try {
      const filter = new Filter()
      cleanMessage = filter.clean(cleanMessage)
    } catch {
      // If filter fails, allow message through
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('chat_messages')
      .insert([{ username: cleanUsername, message: cleanMessage }])

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabase
      .from('chat_messages')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
