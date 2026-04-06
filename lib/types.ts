export interface Account {
  id: string
  email: string
  plan: 'demo' | 'monthly'
  status: 'active' | 'inactive'
  actions_used: number
  actions_limit: number
  actions_reset_at: string
  cf_api_token: string | null
  cf_account_id: string | null
  cf_project_name: string | null
  created_at: string
}

export interface SiteFile {
  path: string
  content: string
}

export interface Version {
  id: string
  account_id: string
  label: string
  files: SiteFile[]
  created_at: string
}

export interface AIChange {
  summary: string
  files: SiteFile[]
}
