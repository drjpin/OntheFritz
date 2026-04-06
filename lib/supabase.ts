import { createClient } from '@supabase/supabase-js'
import type { SiteFile } from './types'

export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export function getStorageUrl(accountId: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/sites/${accountId}/${path}`
}

export function getPreviewUrl(accountId: string): string {
  return getStorageUrl(accountId, 'index.html')
}

// Read all files for an account from Supabase Storage
export async function readSiteFiles(accountId: string): Promise<SiteFile[]> {
  const sb = getSupabaseAdmin()
  const { data: objects } = await sb.storage.from('sites').list(accountId, { limit: 200 })
  if (!objects?.length) return []

  const files: SiteFile[] = []
  for (const obj of objects) {
    if (obj.name.startsWith('.')) continue
    const path = `${accountId}/${obj.name}`
    const { data } = await sb.storage.from('sites').download(path)
    if (data) {
      const content = await data.text()
      files.push({ path: obj.name, content })
    }
  }
  return files
}

// Write a single file to Supabase Storage
export async function writeSiteFile(accountId: string, path: string, content: string): Promise<void> {
  const sb = getSupabaseAdmin()
  const contentType = getContentType(path)
  const blob = new Blob([content], { type: contentType })
  const { error } = await sb.storage.from('sites').upload(`${accountId}/${path}`, blob, {
    upsert: true,
    contentType,
  })
  if (error) throw new Error(`Storage upload failed for ${path}: ${error.message}`)
}

// Write multiple files
export async function writeSiteFiles(accountId: string, files: SiteFile[]): Promise<void> {
  await Promise.all(files.map(f => writeSiteFile(accountId, f.path, f.content)))
}

// Delete a file
export async function deleteSiteFile(accountId: string, path: string): Promise<void> {
  const sb = getSupabaseAdmin()
  await sb.storage.from('sites').remove([`${accountId}/${path}`])
}

export function getContentType(path: string): string {
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

// Get account from session token
export async function getAccountFromToken(token: string) {
  const sb = getSupabaseAdmin()
  const { data } = await sb
    .from('sessions')
    .select('*, accounts(*)')
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  return data ? (data.accounts as Record<string, unknown> & Account) : null
}

import type { Account } from './types'
