import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Score = {
  id: number
  game: string
  username: string
  score: number
  avatar_url: string | null
  created_at: string
}

export type ChatMessage = {
  id: number
  username: string
  message: string
  created_at: string
}

export type Argument = {
  id: number
  side_a: string
  side_b: string
  verdict: string
  votes_ai: number
  votes_crowd: number
  created_at: string
}
