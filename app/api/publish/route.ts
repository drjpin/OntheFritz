import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { getAccountFromToken, readSiteFiles } from '@/lib/supabase'

const CF_BASE = 'https://api.cloudflare.com/client/v4'

// GET /api/publish — diagnostic: list Cloudflare Pages projects
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!account.cf_api_token || !account.cf_account_id) {
    return NextResponse.json({ error: 'Cloudflare not configured' }, { status: 400 })
  }
  const res = await fetch(
    `${CF_BASE}/accounts/${account.cf_account_id}/pages/projects`,
    { headers: { Authorization: `Bearer ${account.cf_api_token}` } }
  )
  return NextResponse.json(await res.json())
}

// POST /api/publish — deploy to Cloudflare Pages via Wrangler
export async function POST(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!account.cf_api_token || !account.cf_account_id || !account.cf_project_name) {
    return NextResponse.json(
      { error: 'Cloudflare not configured. Add CF credentials in Settings.' },
      { status: 400 }
    )
  }

  const files = await readSiteFiles(account.id)
  if (!files.length) {
    return NextResponse.json({ error: 'No site files to publish' }, { status: 400 })
  }

  // Write files to /tmp
  const tmpDir = `/tmp/deploy-${Date.now()}`
  try {
    mkdirSync(tmpDir, { recursive: true })
    for (const file of files) {
      writeFileSync(join(tmpDir, file.path), file.content, 'utf-8')
    }

    // Deploy using wrangler
    const wrangler = join(process.cwd(), 'node_modules/.bin/wrangler')
    const output = execSync(
      `${wrangler} pages deploy ${tmpDir} --project-name=${account.cf_project_name} --branch=main --commit-dirty=true`,
      {
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: account.cf_api_token,
          CLOUDFLARE_ACCOUNT_ID: account.cf_account_id,
        },
        timeout: 120000,
      }
    ).toString()

    console.log('Wrangler output:', output)

    return NextResponse.json({
      ok: true,
      url: `https://${account.cf_project_name}.pages.dev`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Wrangler error:', msg)
    return NextResponse.json({ error: `Deploy failed: ${msg}` }, { status: 500 })
  } finally {
    rmSync(tmpDir, { recursive: true, force: true })
  }
}
