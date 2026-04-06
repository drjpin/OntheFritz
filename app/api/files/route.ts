import { NextRequest, NextResponse } from 'next/server'
import {
  getAccountFromToken,
  readSiteFiles,
  writeSiteFile,
  deleteSiteFile,
  getStorageUrl,
} from '@/lib/supabase'

async function authenticate(req: NextRequest) {
  const token = req.headers.get('x-session-token') ?? ''
  const account = await getAccountFromToken(token)
  if (!account) return null
  return account
}

// GET /api/files — list all files for the account
// GET /api/files?path=index.html — get content of a specific file
export async function GET(req: NextRequest) {
  const account = await authenticate(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = req.nextUrl.searchParams.get('path')
  if (path) {
    const files = await readSiteFiles(account.id)
    const file = files.find(f => f.path === path)
    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    return NextResponse.json(file)
  }

  const files = await readSiteFiles(account.id)
  return NextResponse.json({ files })
}

// PUT /api/files — write a file
export async function PUT(req: NextRequest) {
  const account = await authenticate(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { path, content } = await req.json()
  if (!path || content === undefined) {
    return NextResponse.json({ error: 'path and content required' }, { status: 400 })
  }

  await writeSiteFile(account.id, path, content)
  return NextResponse.json({ ok: true, url: getStorageUrl(account.id, path) })
}

// DELETE /api/files?path=index.html — delete a file
export async function DELETE(req: NextRequest) {
  const account = await authenticate(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path required' }, { status: 400 })

  await deleteSiteFile(account.id, path)
  return NextResponse.json({ ok: true })
}

// POST /api/files — upload an image (multipart)
export async function POST(req: NextRequest) {
  const account = await authenticate(req)
  if (!account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const content = await file.text()
  await writeSiteFile(account.id, file.name, content)
  return NextResponse.json({ ok: true, url: getStorageUrl(account.id, file.name) })
}
