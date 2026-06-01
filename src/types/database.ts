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
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_period: 'monthly' | 'quarterly' | null
  bio_generations_this_month: number
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

export interface ParsedResume {
  education: { school: string; gpa?: string; graduation?: string }[]
  activities: Activity[]
  awards: Award[]
  work_experience: { company: string; role: string; description: string; period: string }[]
  skills: string[]
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
  created_at: string
  updated_at: string
}

export interface Essay {
  id: string
  user_id: string
  application_id: string | null
  title: string
  content: string
  ai_feedback: EssayFeedback | null
  version_history: { content: string; saved_at: string }[]
  created_at: string
  updated_at: string
}

export interface EssayFeedback {
  direction: 'tone' | 'structure' | 'conciseness'
  revised_content: string
  changes_summary: string
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
