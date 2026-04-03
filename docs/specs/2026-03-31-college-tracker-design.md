# College Tracker — Design Spec
Date: 2026-03-31

## Overview

A web app for high school students applying to college. Core value: centralize application tracking, reduce manual overhead via AI resume parsing, and surface AI-powered writing and strategy tools behind a freemium paywall. A paid Bio website generator serves as the primary monetization hook.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + Backend | Next.js (App Router) |
| Auth + Database | Supabase (PostgreSQL + Row Level Security) |
| AI | Claude API (via Server Actions — API key never exposed to client) |
| Payments | Stripe (subscription checkout + webhook) |
| Deployment | Vercel (with subdomain support for Bio sites) |

---

## Freemium Model

### Free Tier
- User registration and login
- Application dashboard (full school tracking, no AI)
- **AI Resume** — upload resume PDF/Word, AI parses and displays in fixed template; resume data used as context for all AI features

### Pro Tier (paid subscription via Stripe)
- AI Essay Editor — polish personal statements and supplemental essays
- AI School Recommender — match schools to user background
- AI Application Strategy — priority task list based on current dashboard state
- AI Bio Website — generate and deploy a personal site at `username.appname.com`
- Unlimited AI usage (free tier has monthly call quota enforced server-side)

---

## Data Models

### `users`
```
id, email, is_pro, stripe_customer_id, stripe_subscription_id,
ai_calls_this_month, created_at
```

### `profiles` (user background — used by AI)
```
user_id, gpa, sat_score, act_score, intended_major,
activities (jsonb), awards (jsonb), resume_raw_text, resume_parsed (jsonb)
```

### `schools` (admin-maintained reference table)
```
id, name, logo_url, acceptance_rate,
sat_25th, sat_75th, act_25th, act_75th,
popular_majors (text[]),
deadline_ea, deadline_ed, deadline_rd,
supplemental_essay_count
```

### `applications` (per user per school)
```
id, user_id, school_id,
status (enum: not_started | in_progress | submitted | waiting | accepted | rejected | waitlisted),
application_type (EA | ED | RD),
supplemental_essays_total, supplemental_essays_done,
notes, created_at, updated_at
```

### `essays`
```
id, user_id, application_id (nullable for Common App essay),
title, content, ai_feedback (jsonb), version_history (jsonb[]),
created_at, updated_at
```

### `bio_sites`
```
id, user_id, subdomain, generated_content (jsonb),
template_id, deployed_at, is_live
```

---

## Page Structure

```
/                    Landing page (marketing)
/login               Sign in / Sign up (email + Google via Supabase Auth)
/dashboard           Application dashboard — school cards grid
/schools/[id]        School detail + application management
/resume              AI Resume upload + template display (Free)
/essays              Essay list + AI editor (Pro)
/ai/recommend        School recommender (Pro)
/ai/strategy         Application strategy advisor (Pro)
/bio                 Bio website builder + preview (Pro)
/settings            Account + subscription management
```

---

## Application Dashboard — School Card

Each school renders as a card:

```
[ Logo ]  Stanford University
Acceptance Rate: 4%   Deadline (RD): Jan 2, 2025
SAT: 1500–1570  |  ACT: 34–36
Popular Majors: CS, Engineering, Economics
Supplementals: 2 / 3 complete  ██████░░░░  67%

         [ Continue Application ]      ← large CTA button
```

**Button state by application status:**

| Status | Button label | Color |
|--------|-------------|-------|
| not_started | Start Application | Gray |
| in_progress | Continue Application | Blue |
| submitted | Submitted ✓ | Green |
| waiting | Awaiting Decision | Yellow |
| accepted | Accepted 🎉 | Green |
| rejected | Not Admitted | Red |
| waitlisted | Waitlisted | Orange |

---

## AI Resume Feature (Free)

1. User uploads PDF or Word resume
2. Server Action sends text to Claude with structured extraction prompt
3. Claude returns parsed JSON: education, activities, awards, work experience, skills
4. Data saved to `profiles.resume_parsed`
5. Fixed template renders parsed data on `/resume` page
6. All other AI features inject `resume_parsed` + `profiles` as context

---

## AI Features (Pro)

### Essay Editor
- User selects an essay, clicks "AI Polish"
- Chooses direction: tone / structure / conciseness
- Claude returns revised version with diff highlights
- Previous version saved to `essays.version_history` (user can revert)

### School Recommender
- Reads `profiles` (GPA, SAT/ACT, intended major, activities)
- Claude cross-references against `schools` table data
- Returns ranked list with match rationale per school

### Application Strategy
- Reads current `applications` statuses and deadlines
- Claude generates prioritized task list: what to do this week, what's at risk
- Output rendered as checklist on `/ai/strategy`

### Bio Website Generator
- User reviews pre-filled data from `profiles` + `resume_parsed`, edits if needed
- Selects from 3 visual templates
- Claude generates website copy (bio, activities section, goals)
- Next.js renders static page, deployed to `[username].appname.com` via Vercel subdomain
- `bio_sites` record created; user can regenerate or take offline

---

## AI Usage Control

- `users.ai_calls_this_month` incremented on every Claude API call (Server Action)
- Free tier limit: 10 calls/month (enforced before calling Claude)
- Counter resets monthly via a scheduled Supabase function
- Exceeding limit shows upgrade prompt

---

## Stripe Integration

- `/settings` → "Upgrade to Pro" → Stripe Checkout (subscription)
- Stripe webhook (`/api/stripe/webhook`) updates `users.is_pro`, `stripe_subscription_id`
- Cancellation via Stripe portal; webhook sets `is_pro = false` on subscription end
- Pro gate: Server Actions check `is_pro` before executing any Pro AI feature

---

## Security

- Supabase Row Level Security: all queries scoped to `auth.uid()`
- Claude API key only used in Server Actions, never in client-side code
- Stripe webhook verified with `STRIPE_WEBHOOK_SECRET`
- Resume file upload: validate MIME type server-side, store in Supabase Storage (private bucket)

---

## School Data Maintenance

The `schools` table is admin-maintained. Initial seed: top ~200 US universities with logo, acceptance rate, SAT/ACT medians, popular majors, and standard deadlines. Users can request additions. No scraping — data entered manually or via a one-time import script.

---

## Out of Scope (v1)

- Mobile app
- Automatic scraping of Common App or school portals
- Collaborative features (counselor access)
- Financial aid tracking
- International universities
