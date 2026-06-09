export type ApplicationStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'waiting'
  | 'deferred'
  | 'accepted'
  | 'rejected'
  | 'waitlisted'

export type ApplicationType = 'EA' | 'ED' | 'REA' | 'RD' | 'Rolling'

export interface User {
  id: string
  email: string
  is_pro: boolean
  has_bio_purchase: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_period: 'monthly' | 'quarterly' | null
  bio_generations_this_month: number
  bio_generates_used: number
  bio_refines_used: number
  bio_css_tweaks_used: number
  bio_usage_period_start: string | null
  bio_active_job: boolean
  ai_resume_calls_this_month: number
  created_at: string
}

export interface Profile {
  user_id: string
  full_name: string | null
  graduation_year: number | null
  gpa: number | null
  sat_score: number | null
  act_score: number | null
  intended_major: string | null
  intended_majors: string[] | null
  activities: Activity[]
  awards: Award[]
  resume_raw_text: string | null
  resume_parsed: ParsedResume | null
  onboarding_completed: boolean
  updated_at: string
}

export interface Activity {
  name: string
  role: string
  description: string
  years: string
}

export interface Award {
  name: string
  level: string
  year: string
}

export interface GapItem {
  what: string
  how: string
}

export interface ParsedResume {
  education: { school: string; gpa?: string; graduation?: string }[]
  activities: Activity[]
  awards: Award[]
  work_experience: { company: string; role: string; description: string; period: string }[]
  skills: string[]
  gaps?: GapItem[]
  reformatted?: string
}

export interface School {
  id: string
  name: string
  logo_url: string | null
  acceptance_rate: number | null
  sat_25th: number | null
  sat_75th: number | null
  act_25th: number | null
  act_75th: number | null
  popular_majors: string[]
  deadline_ea: string | null
  deadline_ed: string | null
  deadline_rd: string | null
  deadline_rolling: boolean
  notification_date: string | null
  notification_ea: string | null
  notification_ed: string | null
  supplemental_essay_count: number
  test_policy: 'required' | 'optional' | 'blind' | null
  rounds_offered: string[] | null
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  school_id: string
  status: ApplicationStatus
  application_type: ApplicationType | null
  intended_major: string | null
  supplemental_essays_done: number
  portal_url: string | null
  notes: string | null
  // Per-user overrides of the global school reference data. When set, the UI
  // prefers these over the school's official value (which students cannot edit).
  deadline_ea: string | null
  deadline_ed: string | null
  deadline_rd: string | null
  notification_date: string | null
  notification_ea: string | null
  notification_ed: string | null
  supplemental_essays_total: number | null
  created_at: string
  updated_at: string
}

// ── Planner / Reminder reference + state ──

export interface SchoolRound {
  id: string
  school_id: string
  round: string                 // EA | ED | ED2 | REA | SCEA | RD | Rolling | ED0 | …
  deadline_date: string | null
  deadline_time: string | null  // null = treat as 23:59 local
  decision_release_date: string | null
  decision_release_time: string | null
  source_year: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

export interface SchoolEssay {
  id: string
  school_id: string
  essay_prompt: string
  word_limit: number | null
  required: boolean
  applies_to_rounds: string[] | null  // null/empty = all rounds
  essay_group: string | null
  source_year: string | null
  source_url: string | null
  created_at: string
}

export interface UserEssayProgress {
  id: string
  user_id: string
  school_essay_id: string
  done: boolean
  updated_at: string
}

export type ReminderKind = 'deadline' | 'decision' | 'essay' | 'custom'
export type ReminderStatus = 'active' | 'dismissed' | 'done'

export interface Reminder {
  id: string
  user_id: string
  school_id: string | null
  round: string | null
  kind: ReminderKind
  title: string
  due_at: string | null
  status: ReminderStatus
  email_enabled: boolean
  email_sent_at: string | null
  created_at: string
}

export interface BioSite {
  id: string
  user_id: string
  subdomain: string | null
  generated_content: BioContent | null
  template_id: string | null
  deployed_at: string | null
  is_live: boolean
  created_at: string
}

export interface BioContent {
  bio: string
  activities_section: string
  goals: string
  template_id: string
}

export type BioVersionSource = 'generate' | 'refine' | 'manual_edit' | 'publish'

export interface BioPageVersion {
  id: string
  user_id: string
  slug: string | null
  version_no: number
  label: string | null
  html: string
  style: string | null
  source: BioVersionSource
  score: number | null
  duration_seconds: number | null
  is_published_snapshot: boolean
  is_current: boolean
  created_at: string
}

// User-facing version metadata — NEVER includes html body or any cost/token data.
export interface BioVersionSummary {
  id: string
  slug: string | null
  version_no: number
  label: string | null
  style: string | null
  source: BioVersionSource
  score: number | null
  duration_seconds: number | null
  is_published_snapshot: boolean
  is_current: boolean
  created_at: string
}

export interface BioGeneration {
  id: string
  user_id: string
  version_id: string | null
  mode: 'generate' | 'refine'
  model: string | null
  style: string | null
  generation_duration_seconds: number | null
  input_tokens: number | null
  output_tokens: number | null
  total_tokens: number | null
  estimated_cost_usd: number | null
  created_at: string
}

export interface BioMetrics {
  generation_duration_seconds: number
  token_cost: { input_tokens: number; output_tokens: number; total_tokens: number }
  estimated_cost_usd: number
}
