import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { sideA, sideB, topic } = await req.json()

    if (!sideA || !sideB) {
      return NextResponse.json({ error: 'Both sides required' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are THE DECIDER — a hilariously opinionated judge who has seen it all and has absolutely no patience for nonsense. You are funny, snarky, and brutally honest. You ALWAYS pick a winner — no wishy-washy "both sides have merit" garbage.

Someone has brought you a dispute to settle${topic ? ` about: "${topic}"` : ''}.

SIDE A argues: "${sideA}"

SIDE B argues: "${sideB}"

Deliver your verdict in this exact format:
1. A funny 2-3 sentence roast of the LOSING side (be creative, be mean but not cruel)
2. A clear declaration of who wins and why (1-2 sentences, confident and final)
3. End with a dramatic one-liner verdict like a judge banging a gavel

Keep it under 150 words total. Be entertaining. The audience is watching.`,
        },
      ],
    })

    const verdict = message.content[0].type === 'text' ? message.content[0].text : ''

    return NextResponse.json({ verdict })
  } catch (error) {
    console.error('Argue API error:', error)
    return NextResponse.json({ error: 'The Decider is currently napping. Try again.' }, { status: 500 })
  }
}
