import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSupabaseAdmin } from '@/lib/supabase'
import { type SiteContent } from '@/lib/types'

async function getAccountFromToken(token: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('sessions')
    .select('*, accounts(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  return data ? (data.accounts as Record<string, unknown> & { id: string; actions_used: number; actions_limit: number; plan: string }) : null
}

const SYSTEM_PROMPT = `You are a helpful AI assistant for a chiropractic practice website. You help the practice owner update their website content.

You will be given the current website content as JSON and the owner's request. Your job is to return an updated version of the content JSON with the requested changes applied.

Rules:
- Always return a valid JSON object matching the exact same structure as the input content
- Make only the changes requested — don't alter anything else
- For blog posts, generate professional, helpful health content related to chiropractic care
- For style changes, use professional, medical-appropriate colors (avoid neon/bright colors)
- Keep all text professional, warm, and trustworthy in tone
- If asked to add a blog post, add it to the blog array with today's date formatted as "Month DD, YYYY", a slug (lowercase-hyphenated), title, and excerpt (2-3 sentences)
- Return ONLY the JSON object — no markdown, no explanation, no code fences`

// POST /api/ai  { message: string, content: SiteContent }
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

  // Check action limit
  if (account.actions_used >= account.actions_limit) {
    return NextResponse.json({
      error: account.plan === 'demo'
        ? 'Demo limit reached. Contact us to upgrade to a full account.'
        : 'Monthly action limit reached. Your limit resets at the start of next month.',
    }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const { message, content }: { message: string; content: SiteContent } = body

  if (!message) return NextResponse.json({ error: 'Message required' }, { status: 400 })
  if (!content) return NextResponse.json({ error: 'Current content required' }, { status: 400 })

  const client = new Anthropic()

  // Use Haiku for simple edits, Sonnet for blog/creative
  const isCreative = /blog|post|write|article|generate|create content/i.test(message)
  const model = isCreative ? 'claude-haiku-4-5-20251001' : 'claude-haiku-4-5-20251001'

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Current website content:\n${JSON.stringify(content, null, 2)}\n\nRequested change: ${message}`,
        },
      ],
    })

    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    // Parse JSON — strip any accidental markdown fences
    const jsonText = rawText.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()
    let updatedContent: SiteContent
    try {
      updatedContent = JSON.parse(jsonText)
    } catch {
      return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 })
    }

    // Increment action count
    const sb = getSupabaseAdmin()
    await sb.from('accounts').update({ actions_used: account.actions_used + 1 }).eq('id', account.id)

    const actionsRemaining = account.actions_limit - account.actions_used - 1

    return NextResponse.json({
      content: updatedContent,
      actionsRemaining,
      message: `Done! ${actionsRemaining} action${actionsRemaining !== 1 ? 's' : ''} remaining this ${account.plan === 'demo' ? 'demo' : 'month'}.`,
    })
  } catch (err) {
    console.error('AI error:', err)
    return NextResponse.json({ error: 'AI request failed. Please try again.' }, { status: 500 })
  }
}
