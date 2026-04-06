import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin, getContentType } from '@/lib/supabase'

// GET /preview/[accountId]/[...filePath]
// Proxies site files from Supabase Storage with correct headers
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const [accountId, ...rest] = path
  const filePath = rest.join('/')

  if (!accountId || !filePath) {
    return new NextResponse('Not found', { status: 404 })
  }

  const sb = getSupabaseAdmin()
  const { data, error } = await sb.storage
    .from('sites')
    .download(`${accountId}/${filePath}`)

  if (error || !data) {
    return new NextResponse('Not found', { status: 404 })
  }

  const content = await data.text()
  const contentType = getContentType(filePath)

  return new NextResponse(content, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store',
    },
  })
}
