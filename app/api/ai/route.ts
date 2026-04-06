import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getAccountFromToken, readSiteFiles, writeSiteFiles, getSupabaseAdmin } from '@/lib/supabase'
import type { SiteFile } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (account.status !== 'active') {
    return NextResponse.json({ error: 'Account inactive' }, { status: 403 })
  }

  if (account.actions_used >= account.actions_limit) {
    return NextResponse.json(
      { error: `Action limit reached (${account.actions_limit}/month). Upgrade to continue.` },
      { status: 429 }
    )
  }

  const { message } = await req.json()
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  // Read all current site files
  const files = await readSiteFiles(account.id)
  if (!files.length) {
    return NextResponse.json({ error: 'No site files found. Initialize your site first.' }, { status: 400 })
  }

  // Build file context for Claude
  const fileContext = files
    .map(f => `### FILE: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join('\n\n')

  const systemPrompt = `You are an expert web developer making changes to a chiropractor's website.

The website consists of plain HTML, CSS, and JavaScript files. You will be given the current file contents and a change request.

RULES:
- Return ONLY valid JSON — no markdown, no explanation outside the JSON
- Only return files that actually changed
- Return the COMPLETE file content for each changed file (never partial)
- Preserve all existing sections and content unless explicitly asked to change them
- Keep the site functional, accessible, and mobile-responsive
- When adding new sections or content, match the existing style
- For SEO changes, update meta tags in index.html
- For style changes, edit style.css custom properties when possible (--primary, --accent, etc.)

Response format (strict JSON):
{
  "summary": "One sentence describing what was changed",
  "files": [
    { "path": "index.html", "content": "...complete file content..." },
    { "path": "style.css", "content": "...complete file content..." }
  ]
}`

  const userMessage = `Current site files:\n\n${fileContext}\n\n---\n\nChange request: ${message}`

  let aiResponse: { summary: string; files: SiteFile[] }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    aiResponse = JSON.parse(jsonMatch[0])

    if (!aiResponse.summary || !Array.isArray(aiResponse.files)) {
      throw new Error('Invalid response structure')
    }
  } catch (err) {
    console.error('AI parse error:', err)
    return NextResponse.json({ error: 'AI returned invalid JSON. Please try again.' }, { status: 500 })
  }

  // Write changed files to storage
  await writeSiteFiles(account.id, aiResponse.files)

  // Save version snapshot (full site state after changes)
  const updatedFiles = files.map(f => {
    const changed = aiResponse.files.find(cf => cf.path === f.path)
    return changed ?? f
  })
  // Add any new files not in original
  for (const cf of aiResponse.files) {
    if (!files.find(f => f.path === cf.path)) {
      updatedFiles.push(cf)
    }
  }

  const sb = getSupabaseAdmin()
  await sb.from('versions').insert({
    account_id: account.id,
    label: aiResponse.summary,
    files: updatedFiles,
  })

  // Increment action counter
  await sb
    .from('accounts')
    .update({ actions_used: account.actions_used + 1 })
    .eq('id', account.id)

  return NextResponse.json({
    summary: aiResponse.summary,
    changedFiles: aiResponse.files.map(f => f.path),
    actionsUsed: account.actions_used + 1,
    actionsLimit: account.actions_limit,
  })
}
