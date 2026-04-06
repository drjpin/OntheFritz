import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getAccountFromToken, readSiteFiles } from '@/lib/supabase'

// POST /api/publish — deploy site to Cloudflare Pages via Direct Upload API
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

  const CF_API = `https://api.cloudflare.com/client/v4/accounts/${account.cf_account_id}/pages/projects/${account.cf_project_name}/deployments`

  // Step 1: Create deployment and get upload URL
  const deployRes = await fetch(CF_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.cf_api_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })

  if (!deployRes.ok) {
    const err = await deployRes.text()
    console.error('CF deploy error:', err)
    return NextResponse.json({ error: 'Failed to create Cloudflare deployment' }, { status: 500 })
  }

  const { result: deployment } = await deployRes.json()

  // Step 2: Upload files via multipart form
  const formData = new FormData()

  // Build file hashes manifest
  const manifest: Record<string, string> = {}
  for (const file of files) {
    const hash = createHash('sha256').update(file.content).digest('hex')
    manifest[`/${file.path}`] = hash
    formData.append(
      hash,
      new Blob([file.content], { type: getContentType(file.path) }),
      file.path
    )
  }
  formData.append('manifest', JSON.stringify(manifest))

  const uploadRes = await fetch(deployment.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${account.cf_api_token}` },
    body: formData,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    console.error('CF upload error:', err)
    return NextResponse.json({ error: 'Failed to upload files to Cloudflare' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    deploymentId: deployment.id,
    url: `https://${account.cf_project_name}.pages.dev`,
  })
}

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    ico: 'image/x-icon',
    txt: 'text/plain',
  }
  return types[ext ?? ''] ?? 'application/octet-stream'
}
