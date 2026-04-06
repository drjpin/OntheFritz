import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'
import { getAccountFromToken, readSiteFiles } from '@/lib/supabase'

// GET /api/publish — list Cloudflare Pages projects (diagnostic)
export async function GET(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  const account = await getAccountFromToken(token)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!account.cf_api_token || !account.cf_account_id) {
    return NextResponse.json({ error: 'Cloudflare not configured' }, { status: 400 })
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account.cf_account_id}/pages/projects`,
    { headers: { Authorization: `Bearer ${account.cf_api_token}` } }
  )
  const data = await res.json()
  return NextResponse.json(data)
}

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

  // Manually build multipart body to avoid Node.js FormData/Blob serialization issues
  const boundary = '----CFBoundary' + randomBytes(16).toString('hex')
  const manifest: Record<string, string> = {}
  const parts: Buffer[] = []

  for (const file of files) {
    const buffer = Buffer.from(file.content, 'utf-8')
    const hash = createHash('sha256').update(buffer).digest('hex')
    manifest[`/${file.path}`] = hash

    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${hash}"; filename="${file.path}"\r\n` +
      `Content-Type: ${getContentType(file.path)}\r\n\r\n`
    ))
    parts.push(buffer)
    parts.push(Buffer.from('\r\n'))
  }

  // Add manifest field
  const manifestJson = JSON.stringify(manifest)
  parts.push(Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="manifest"\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    manifestJson + '\r\n'
  ))
  parts.push(Buffer.from(`--${boundary}--\r\n`))

  const body = Buffer.concat(parts)

  const res = await fetch(CF_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${account.cf_api_token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('CF publish error:', err)
    return NextResponse.json(
      { error: `Cloudflare error: ${err}` },
      { status: 500 }
    )
  }

  const { result } = await res.json()

  return NextResponse.json({
    ok: true,
    deploymentId: result?.id,
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
