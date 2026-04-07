import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
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

// POST /api/publish — deploy to Cloudflare Pages via Direct Upload API
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

  const accountId = account.cf_account_id
  const projectName = account.cf_project_name
  const apiToken = account.cf_api_token

  // ── Step 1: Get upload JWT ────────────────────────────────────────────────
  const jwtRes = await fetch(
    `${CF_BASE}/accounts/${accountId}/pages/projects/${projectName}/upload-token`,
    { headers: { Authorization: `Bearer ${apiToken}` } }
  )
  if (!jwtRes.ok) {
    const err = await jwtRes.text()
    return NextResponse.json({ error: `Failed to get upload token: ${err}` }, { status: 500 })
  }
  const { result: jwtResult } = await jwtRes.json()
  const jwt = jwtResult?.jwt
  if (!jwt) {
    return NextResponse.json({ error: 'No JWT returned from upload-token endpoint' }, { status: 500 })
  }

  // ── Step 2: Upload file assets as base64 JSON ─────────────────────────────
  const manifest: Record<string, string> = {}
  const uploadPayload: Array<{ key: string; value: string; metadata: { contentType: string }; base64: boolean }> = []

  const debugFiles: Record<string, { rawBytes: number; first100: string }> = {}

  for (const file of files) {
    const buffer = Buffer.from(file.content, 'utf-8')
    debugFiles[file.path] = { rawBytes: buffer.length, first100: file.content.slice(0, 100) }
    const hash = createHash('sha256').update(buffer).digest('hex')
    manifest[file.path] = hash
    uploadPayload.push({
      key: hash,
      value: buffer.toString('base64'),
      metadata: { contentType: getContentType(file.path) },
      base64: true,
    })
  }

  console.log('Upload payload:', JSON.stringify(uploadPayload.map(f => ({
    key: f.key,
    bytes: f.value.length,
    contentType: f.metadata.contentType,
  }))))

  const uploadRes = await fetch(`${CF_BASE}/pages/assets/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(uploadPayload),
  })
  const uploadBody = await uploadRes.text()
  console.log('Upload response:', uploadRes.status, uploadBody)
  if (!uploadRes.ok) {
    return NextResponse.json({ error: `Failed to upload assets: ${uploadBody}` }, { status: 500 })
  }

  // ── Step 3: Create deployment with manifest ───────────────────────────────
  console.log('Manifest:', JSON.stringify(manifest))
  const formData = new FormData()
  formData.append('manifest', JSON.stringify(manifest))
  formData.append('branch', 'main')

  const deployRes = await fetch(
    `${CF_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: formData,
    }
  )
  const deployBody = await deployRes.text()
  if (!deployRes.ok) {
    return NextResponse.json({ error: `Failed to create deployment: ${deployBody}` }, { status: 500 })
  }

  const deployJson = JSON.parse(deployBody)
  const result = deployJson.result
  return NextResponse.json({
    ok: true,
    deploymentId: result?.id,
    deploymentUrl: result?.url,
    productionUrl: `https://${projectName}.pages.dev`,
    environment: result?.environment,
    debugFiles,
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
