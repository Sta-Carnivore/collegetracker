# ApplyTracker Frontend UI/UX Design Brief

## 1. Design Goal

ApplyTracker is a college application planning website for Chinese and international
students. Its frontend should make the application season feel organized, calm, and
manageable.

This document describes only the frontend design:

- Visual direction.
- Page layout.
- Component appearance.
- Interaction behavior.
- Animation style.
- Responsive behavior.
- Light and dark themes.
- English and Simplified Chinese presentation.

It does not define backend logic, database structure, AI workflows, pricing logic, or
engineering task management.

---

## 2. Reference Sites

Visual references:

- https://dheirya.com/
- https://simplexp.org/

Do not reproduce either website exactly. Do not reuse their branding, text, images, or
illustrations. Use them to understand the emotional and visual logic.

### 2.1 What To Learn From Dheirya

The portfolio feels like a journey:

- A full-screen opening scene creates a strong first impression.
- Cool sky colors and warm cream cards create contrast.
- The user scrolls through milestones rather than a plain content list.
- A growing path connects content sections.
- Subtle animated clouds and wind lines make the background feel alive.
- Slight irregularity makes the website feel authored rather than templated.

ApplyTracker adaptation:

- Use a route-map metaphor for the public homepage.
- Let the homepage scroll through product features like milestones on an application
  journey.
- Keep ambient animation outside the daily-use dashboard.

### 2.2 What To Learn From Simple Explanations

The education website feels like a warm academic notebook:

- Paper-like background colors.
- Deep teal ink.
- Serif headings with readable sans-serif paragraphs.
- Hand-drawn lines, dashed borders, arrows, and hatching.
- Animation explains a concept instead of merely decorating the page.
- Decorative elements simplify on mobile.

ApplyTracker adaptation:

- Use hand-drawn route lines and waypoint markers.
- Use paper cards and notebook-grid backgrounds selectively.
- Use animation to explain progress and next steps.
- Keep tables and form controls crisp and conventional.

---

## 3. Core Visual Concept

### Application Atlas

The design concept is **Application Atlas**.

The application season is represented as a navigable route:

- Schools are destinations.
- Deadlines are waypoints.
- Tasks are route markers.
- Completed work is a checked milestone.
- Planner recommendations point toward the next step.
- Resume information feels like organized field notes.
- Bio websites feel like personal exhibits prepared from those notes.

The interface should feel like:

> A refined academic field notebook with subtle hand-drawn navigation marks.

The design must feel:

- Calm.
- Clear.
- Premium.
- Personal.
- Academic.
- Modern.
- Slightly handcrafted.

The design must not feel:

- Childish.
- Overly playful.
- Like a generic SaaS dashboard.
- Like a corporate admissions portal.
- Like a game.
- Visually noisy.

---

## 4. Design Balance

Use two levels of visual intensity.

### 4.1 Expressive Areas

Use stronger illustration, route lines, paper texture, and animation on:

- Public landing page.
- Onboarding welcome screen.
- Empty states.
- Bio Website template previews.
- Completion states.

### 4.2 Operational Areas

Use a restrained version of the same style on:

- Dashboard.
- Application Tracker.
- School detail drawer.
- Resume profile editor.
- Planner.
- Settings.

Operational pages should prioritize:

- Fast scanning.
- Clear hierarchy.
- Predictable controls.
- Readable tables.
- Low cognitive load.

Rule:

> The landing page should be memorable. The product workspace should be quietly beautiful.

---

## 5. Color System

### 5.1 Light Theme

| Role | Color | Usage |
| --- | --- | --- |
| Main background | `#EEE7D9` | Warm notebook-paper page background |
| Soft background | `#F7F2E8` | Alternate page sections and empty states |
| Card surface | `#FFFAF0` | Main cards, panels, dialogs |
| Raised surface | `#FFFDF7` | Hovered cards and elevated overlays |
| Deeper paper | `#E4D2B7` | Selected sections and warm accents |
| Primary ink | `#263F49` | Main headings, icons, strong text |
| Strong ink | `#1D2E36` | High-priority headings |
| Muted ink | `#687B7C` | Supporting text |
| Faint ink | `#95A3A1` | Secondary labels and placeholders |
| Teal accent | `#328F86` | Completed milestones, interactive accents |
| Pale teal | `#D7ECE6` | Teal badge backgrounds |
| Slate blue | `#4F7890` | In-progress states and selected controls |
| Pale blue | `#DCE8ED` | Blue badge backgrounds |
| Gold accent | `#C8A45A` | Active route markers and highlights |
| Pale gold | `#F1E3B8` | Gold badge backgrounds |
| Plum accent | `#76658F` | Submitted status and selected secondary accents |
| Pale plum | `#E8E1EF` | Plum badge backgrounds |
| Success | `#3F8562` | Accepted and completed states |
| Warning | `#B4873F` | Medium risk and waitlist |
| Danger | `#BA5A55` | Rejected and high-risk states |
| Critical | `#973F45` | Critical deadline states |

### 5.2 Dark Theme

| Role | Color |
| --- | --- |
| Main background | `#17262C` |
| Soft background | `#1D3037` |
| Card surface | `#22363D` |
| Raised surface | `#294149` |
| Primary ink | `#E9E2D5` |
| Strong ink | `#FFF9ED` |
| Muted ink | `#B9C7C4` |
| Faint ink | `#8EA09F` |
| Teal accent | `#71B9AF` |
| Slate blue | `#87AFC1` |
| Gold accent | `#D9BA72` |
| Plum accent | `#AD9BC2` |
| Success | `#79BD92` |
| Warning | `#DBB36E` |
| Danger | `#DF8B83` |
| Critical | `#EF989F` |

### 5.3 Color Rules

- Avoid pure black and pure white.
- Use warm surfaces and cool ink colors.
- Use gold only for emphasis, not as a dominant page color.
- Use soft color backgrounds behind status text.
- Always pair status colors with labels and icons.
- Keep the authenticated workspace more neutral than the homepage.

---

## 6. Application Status Design

| Status | Chinese | Color | Icon |
| --- | --- | --- | --- |
| Not Started | 未开始 | Neutral gray | Empty circle |
| In Progress | 进行中 | Slate blue | Half-filled circle |
| Submitted | 已提交 | Plum | Check circle |
| Accepted | 录取 | Success green | Star or badge check |
| Rejected | 拒绝 | Muted red | X circle |
| Waitlisted | Waitlist | Gold | Pause circle |
| Deferred | Deferred | Blue-gold combination | Clock |

Status chips should be compact rounded pills:

- Soft tinted background.
- Small icon.
- Clear label.
- Medium-weight sans-serif text.
- No gradients.
- No flashing or pulsing.

---

## 7. Deadline Risk Design

| Risk | Color | Meaning |
| --- | --- | --- |
| Low | Green | Comfortable timeline |
| Medium | Gold | Needs attention this week |
| High | Muted red | Needs action soon |
| Critical | Stronger red | Urgent deadline or missing materials |

Risk presentation:

- Use a small label and icon.
- Add a one-sentence explanation when space allows.
- Reserve stronger red backgrounds for Critical only.
- Do not make ordinary risk cards feel alarming.
- Use calm, direct language.

Example:

```text
High risk: two essays remain and the deadline is in four days.
```

---

## 8. Typography

### 8.1 Font Pairing

Use:

- Display headings: `"STIX Two Text"`, Georgia, serif.
- UI text and body copy: `"Montserrat"`, Inter, Arial, sans-serif.

### 8.2 Typography Roles

| Role | Size |
| --- | --- |
| Landing hero title | `clamp(3.25rem, 7vw, 7.4rem)` |
| Page title | `clamp(2rem, 3.4vw, 3.25rem)` |
| Section title | `clamp(1.45rem, 2.2vw, 2rem)` |
| Card title | `1.15rem` |
| Body text | `1rem` |
| Small UI text | `0.875rem` |
| Tiny metadata | `0.75rem` |

### 8.3 Typography Rules

- Use serif for page identity, welcome headings, and major section titles.
- Use sans-serif for table data, filters, forms, buttons, badges, and body text.
- Use italics only for occasional narrative accents.
- Keep long-form text between `55ch` and `72ch`.
- Do not use handwritten fonts in the authenticated product.
- Use `clamp()` so typography scales smoothly.

---

## 9. Shape Language

### 9.1 Cards

Cards should feel like clean sheets of premium paper:

- Background: warm card surface.
- Border: thin, low-contrast ink line.
- Radius: `14px` to `20px`.
- Shadow: soft and shallow.
- Padding: generous.

Use stronger shadows only for:

- Modal dialogs.
- Drawers.
- Template previews.
- Hovered interactive cards.

### 9.2 Buttons

Primary button:

- Deep teal or deep ink background.
- Warm white text.
- Rounded corners around `10px`.
- Medium-weight sans-serif label.
- Soft hover brightness change.

Secondary button:

- Transparent or warm-paper background.
- Thin ink border.
- Ink-colored text.

Tertiary button:

- Text-only.
- Underline or subtle background on hover.

Avoid:

- Pill-shaped buttons everywhere.
- Overly shiny gradients.
- Loud shadows.

### 9.3 Inputs

Inputs should be conventional and easy to use:

- Warm raised surface.
- Thin ink border.
- Clear focus ring using teal or blue.
- Rounded corners around `9px`.
- Helpful placeholder text.
- Labels above fields.

### 9.4 Badges

Use compact pills for:

- Application round.
- Status.
- Risk.
- Essay count.
- Materials progress.
- Pro feature labels.

Badges should not dominate the card.

---

## 10. Decorative Visual Language

### 10.1 Notebook Grid

Use a subtle grid selectively:

```css
background-image:
  linear-gradient(rgba(38, 63, 73, 0.075) 1px, transparent 1px),
  linear-gradient(90deg, rgba(38, 63, 73, 0.075) 1px, transparent 1px);
background-size: 28px 28px;
```

Use on:

- Landing hero.
- Onboarding welcome.
- Empty states.
- Bio template previews.

Avoid under:

- Dense table rows.
- Long text forms.
- Mobile content where it causes visual noise.

### 10.2 Hand-Drawn Annotations

Use rough-style annotations sparingly:

- Underline.
- Circle.
- Dashed route.
- Small arrow.
- Corner bracket.
- Hatched highlight region.

Use only where it adds meaning:

- Emphasized homepage phrase.
- Current onboarding waypoint.
- Recommended planner task.
- Selected Bio template.
- Empty-state illustration.

Do not outline every card with a sketch effect.

### 10.3 Route Markers

Waypoint marker style:

- Small circular outline.
- Tiny center dot or simple icon.
- Optional number.
- Gold for active.
- Teal for complete.
- Muted ink for upcoming.

Use in:

- Homepage feature route.
- Onboarding progress.
- Planner timeline.
- School application timeline.

---

## 11. Motion Principles

Motion should explain progress and state changes.

Use:

- Route line drawing.
- Waypoint reveal.
- Gentle card entry.
- Drawer and modal transitions.
- Small checkbox completion animation.
- Restrained hover lift.

Avoid:

- Constant animation behind tables.
- Infinite typing loops inside the dashboard.
- Random card wobble.
- Large parallax effects.
- Flashing risk indicators.
- Animation required to understand content.

### 11.1 Hover Behavior

Cards:

- Move upward by `2px` to `4px`.
- Slightly strengthen shadow.

Buttons:

- Adjust brightness modestly.
- Move no more than `1px`.

Media previews:

- Scale up to approximately `1.03`.
- Optional rotation between `-1deg` and `1deg`.

### 11.2 Reduced Motion

When reduced motion is enabled:

- Show final route lines immediately.
- Disable ambient particles.
- Remove staggered reveals.
- Keep only short opacity changes under `150ms`.

---

## 12. Public Landing Page

### 12.1 Purpose

The landing page should communicate:

1. College applications are complex.
2. ApplyTracker turns them into a clear route.
3. Schools, deadlines, Resume profile, Bio website, and priorities are managed in one place.

### 12.2 Hero

Desktop:

- Full viewport height.
- Two-column layout.
- Left side: title, short paragraph, two CTA buttons.
- Right side: original route-map illustration.
- Background: warm paper with subtle notebook grid.
- Add a faint cool atmospheric wash behind the illustration.

Mobile:

- Stack content.
- Title first.
- CTA buttons below paragraph.
- Illustration below CTA.
- Reduce decorative density.

Suggested English copy:

```text
Your college application season,
mapped clearly.

Track schools, deadlines, materials, your profile, and the next task that matters.
```

Suggested Chinese copy:

```text
把复杂的申请季，
变成一条清晰的路线。

统一管理学校、截止日期、材料、个人履历，以及下一件最重要的事。
```

CTA:

| English | Chinese |
| --- | --- |
| Start planning | 开始规划 |
| See how it works | 看看怎么用 |

### 12.3 Hero Illustration

Create an original hand-drawn route map:

- Starting point.
- Four route segments.
- Four waypoint concepts:
  - School list.
  - Resume profile.
  - Applications.
  - Submit with confidence.
- Original abstract icons:
  - compass,
  - document,
  - school building,
  - checked flag.
- Gold active route.
- Teal hatched highlight regions.
- Deep ink labels.

Initial animation:

1. Render paper grid.
2. Draw route.
3. Reveal waypoints one by one.
4. Reveal checked final marker.
5. Settle into a very quiet idle state.

Do not recreate the exact chart from Simple Explanations.

### 12.4 Problem Strip

Use three concise items:

- Too many deadlines.
- Too many scattered materials.
- No clear next step.

Each item:

- Simple icon.
- Short heading.
- One sentence.
- Small rough annotation.

### 12.5 Feature Journey

Create a vertical route line with four alternating feature panels:

1. Organize your schools.
2. Turn your Resume into a structured profile.
3. Generate a personal Bio website.
4. Know what to do next.

Desktop:

- Alternate panels left and right.
- Route line stays in the center.

Mobile:

- Stack panels.
- Route line moves to the left edge.

### 12.6 Tracker Preview

Show a polished mockup of the tracker:

- List and Icons segmented control.
- Three sample schools.
- Deadline dates.
- Status chips.
- Risk badge.
- Search and filters.

The preview should resemble the real product UI.

### 12.7 Planner Preview

Show:

- Today's Priority.
- This Week.
- High Risk Deadlines.

Keep it calm and clear. Do not make it look like an emergency dashboard.

### 12.8 Bio Website Preview

Show three template cards:

- Academic / Research.
- Builder / Project.
- Creative / Hybrid.

Each card should have a miniature preview with a distinct personality.

### 12.9 Final CTA

Use a warm paper panel with:

- One concise sentence.
- One primary CTA.
- A small route marker reaching a checked destination.

---

## 13. Login And Signup

Desktop:

- Split-screen layout.
- Left side: form card.
- Right side: static route-map illustration and short reassurance.

Mobile:

- Single-column layout.
- Form first.
- Illustration reduced or hidden if necessary.

Style:

- Calm and conventional.
- No excessive animation.
- Visible language switch.
- Clear input labels.
- Clear error states.

---

## 14. Onboarding

### 14.1 Layout

Use:

- Quiet notebook-grid background.
- Centered paper card.
- Small ApplyTracker identity at the top.
- Language switcher.
- `Skip for now` action.
- Route-style progress strip at the bottom.

### 14.2 Onboarding Screens

One question per step:

- Name.
- Graduation year.
- Intended major.
- Target school count.
- Whether a school list exists.
- Whether the user wants to upload a Resume.

Each step:

- Serif question.
- One short explanation.
- Minimal control.
- Back button.
- Continue button.
- Skip option.

### 14.3 Progress Strip

Use small connected waypoint circles:

- Completed: teal check.
- Current: gold marker.
- Upcoming: muted outline.

Final completion state:

```text
Your route is ready to start.
```

```text
你的申请路线已经可以开始规划了。
```

---

## 15. Authenticated App Shell

### 15.1 Desktop Layout

- Left sidebar: approximately `240px`.
- Top bar inside content region.
- Main content area with generous whitespace.
- Maximum content width around `1600px`.
- Content padding around `24px` to `32px`.

### 15.2 Mobile Layout

- Bottom navigation for primary pages.
- Overflow menu for secondary pages.
- Sticky top bar with title and key action.
- Use full-screen sheets instead of narrow drawers.

### 15.3 Sidebar

Primary navigation:

- Dashboard.
- Tracker.
- Planner.
- AI Resume.
- Bio Website.

Secondary navigation:

- Profile.
- Billing.
- Settings.

Visual style:

- Deep ink background.
- Warm-paper selected item.
- Fine line icons.
- One subtle route-line decoration.
- No animated Canvas.

### 15.4 Top Bar

Include:

- Current page title.
- Optional short context line.
- Language switch.
- Theme switch.
- Notifications.
- User menu.

Keep it uncluttered.

---

## 16. Dashboard

### 16.1 Purpose

Answer:

1. What should I do today?
2. Which deadlines need attention?
3. How far along am I?

### 16.2 Desktop Layout

Top row:

- Welcome card: wider.
- Application-season progress card: narrower.

Middle row:

- Today's Priority: wider.
- Deadline Radar: narrower.

Bottom row:

- Recent Schools: wider.
- Profile and Bio completion: narrower.

Tablet and mobile:

- Stack cards in priority order.

### 16.3 Welcome Card

Example:

```text
Good morning, Steven.
Let's make the next step clear.
```

Show:

- One short recommendation.
- One primary CTA.
- Small rough underline under the actionable phrase.

### 16.4 Season Progress

Use a horizontal route:

- School list.
- Resume profile.
- Applications in progress.
- Submitted.

Display completion visually without creating fake admission predictions.

### 16.5 Today's Priority

Main task card:

- Task title.
- Related school.
- Due date.
- Short reason.
- Primary action.
- Complete action.

Below:

- Up to three smaller secondary tasks.

### 16.6 Deadline Radar

Use compact rows:

- Next 7 days.
- Next 30 days.
- High-risk schools.

Do not add a complex chart unless it genuinely improves scanning.

### 16.7 Empty Dashboard

Use:

- Original empty map illustration.
- One muted route line ending at the first empty waypoint.
- Copy explaining that the first school creates the first destination.
- CTA: `Add your first school`.

---

## 17. Application Tracker

This is the most frequently used page. It should be the cleanest page in the product.

### 17.1 Header

Top line:

- Page title.
- Application count.
- List / Icons segmented control.
- Add school.
- Export.

Second line:

- Search.
- Round filter.
- Status filter.
- Deadline sort.

Keep controls aligned and easy to scan.

### 17.2 List View

Use a clean table with a sticky header.

Columns:

| Column | Presentation |
| --- | --- |
| School | School name with external-link icon |
| Round | Small neutral badge |
| Deadline | Exact date |
| Notification | Optional date |
| Status | Colored status chip |
| Essays Left | Compact numeric badge |
| Materials | Progress count such as `4 / 6` |
| Risk | Risk label |
| Actions | Detail and more menu |

Visual rules:

- Warm raised surface.
- Thin outer border.
- Very subtle row dividers.
- Soft row hover.
- Sans-serif table text.
- No sketch effects inside normal rows.
- Avoid oversized badges.

### 17.3 Icon View

Use a responsive school-card grid.

Each school card:

- School name.
- Round.
- Deadline.
- Status.
- Essay count.
- Materials progress.
- Risk.
- Optional favorite star.
- Small route-marker detail in one corner.

Grid:

- Wide desktop: `3-4` cards per row.
- Tablet: `2` cards per row.
- Mobile: `1` card per row.

### 17.4 Add School

Use:

- Right-side drawer on desktop.
- Full-screen sheet on mobile.

Design:

- Clear title.
- Search field.
- School results.
- Selected school summary.
- Round selector.
- Deadline field.
- Portal link field.
- Confirm button.

Allow custom school entry with a secondary action.

### 17.5 School Detail Drawer

Desktop:

- Right-side drawer.

Mobile:

- Full-screen sheet.

Sections:

- School overview.
- Application round.
- Deadline.
- Notification date.
- SAT / ACT median.
- Acceptance rate.
- Intended major.
- Supplemental essays.
- Materials checklist.
- Notes.
- Official website.
- Portal link.

Use a small vertical waypoint timeline:

- School added.
- Materials ready.
- Essays complete.
- Submitted.
- Notification received.

### 17.6 Tracker Empty State

Use:

- Atlas-like blank route.
- One school-marker outline.
- Short explanation.
- Primary `Add school` CTA.

---

## 18. AI Resume

### 18.1 Upload State

Use a centered upload panel:

- Document icon.
- Drag-and-drop area.
- PDF and DOCX labels.
- Maximum size label.
- Privacy reassurance.
- Usage indicator if relevant.

Style:

- Warm card.
- Dashed rough-inspired border.
- Clear primary action.

Copy:

```text
Your original resume stays private.
We use it to organize your profile, not to publish it.
```

### 18.2 Processing State

Use a route progress strip with three steps:

1. Reading resume.
2. Organizing experiences.
3. Preparing profile.

Use:

- One-time route drawing.
- Calm step transitions.
- No fake percentage precision.

### 18.3 Parsed Profile

Use editable paper cards:

- Basic Information.
- Education.
- Intended Major.
- Activities.
- Awards.
- Projects.
- Skills.
- Personal Strengths.
- Areas To Strengthen.
- Suggested Application Themes.

Each section:

- Collapsible.
- Clear edit action.
- Add-item affordance.
- Save state.

Pro-only suggestions:

- Clearly labeled.
- Visually present but not obstructive.
- Use a small lock icon and restrained accent.

---

## 19. Profile

Use the same editable paper-card language as AI Resume.

Sections:

- Personal details.
- Graduation year.
- Intended major.
- Education.
- Activities.
- Awards.
- Projects.
- Skills.
- Personal themes.

Layout:

- Single readable column for editing.
- Optional right-side profile-completion summary on desktop.
- Stack on mobile.

---

## 20. Bio Website Generator

### 20.1 Generator Home

Show:

- Existing Bio websites.
- Draft or published status.
- Last updated time.
- Version count.
- Create new website CTA.

Use cards that resemble miniature exhibit labels.

### 20.2 Creation Wizard

Use a step-based layout:

1. Choose template.
2. Answer optional emphasis questions.
3. Confirm profile sections.
4. Preview.
5. Publish or save draft.

Every step should feel calm and reversible.

### 20.3 Template A: Academic / Research

Personality:

- Editorial academic journal.

Visual language:

- Cream paper.
- Fine horizontal rules.
- Deep teal ink.
- Gold margin annotations.
- Research and awards appear prominently.
- Serif headings.

Preview feeling:

- Thoughtful.
- Credible.
- Precise.

### 20.4 Template B: Builder / Project

Personality:

- Refined blueprint notebook.

Visual language:

- Cooler blue-green tones.
- Paper cards over blueprint-like grid.
- Small diagram connectors.
- Project media is more prominent.
- Technical skill chips.

Preview feeling:

- Inventive.
- Practical.
- Energetic but controlled.

### 20.5 Template C: Creative / Hybrid

Personality:

- Editorial constellation scrapbook.

Visual language:

- Warm paper.
- Plum accents.
- More asymmetric composition.
- Constellation-like connectors.
- Personal story and identity appear early.

Preview feeling:

- Expressive.
- Personal.
- Polished.

### 20.6 Bio Editor

Desktop layout:

- Left: section list.
- Center: live preview.
- Right: style and content controls.

Allow:

- Reorder sections.
- Show or hide sections.
- Choose palette variant.
- Choose formal or bold presentation.
- Select featured projects.
- Edit text.
- Enter a small natural-language adjustment request.

The editor should feel controlled and approachable, not like a code editor.

### 20.7 Version History

Use a route-style timeline:

- Version number.
- Timestamp.
- Published status.
- Short description.
- Preview.
- Restore.
- Republish.

---

## 21. Planner

### 21.1 Purpose

Show:

- Today's Priority.
- This Week.
- High Risk Deadlines.
- Completed Tasks.

### 21.2 Layout

Desktop:

- Two-column layout.
- Main priority area wider than secondary lists.

Mobile:

- Single-column layout.
- Today's Priority first.

### 21.3 Today's Priority

Use one featured card:

- Task.
- School.
- Deadline.
- Reason.
- Primary action.
- Complete action.

Add one small rough underline beneath the recommendation phrase.

### 21.4 Weekly Timeline

Use a vertical route:

- Date marker.
- Task.
- School.
- Risk.
- Completion checkbox.

Keep the visual simple. Do not build a complex calendar for the first version.

### 21.5 High Risk Deadlines

Use compact cards:

- School.
- Deadline.
- Remaining essays.
- Missing materials.
- Risk reason.
- Open school action.

---

## 22. Pricing Page

Show four cards:

| Plan | Price |
| --- | --- |
| Free | `$0` |
| Pro Monthly | `$20 / month` |
| Pro 3-Month | `$50 / 3 months` |
| Bio One-Time | `$15 / site` |

Visual rules:

- Use simple comparison cards.
- Highlight Pro 3-Month as `Best for application season`.
- Keep Free visually respectable.
- Avoid aggressive upgrade design.
- Use one gold route-marker motif connecting the plans.

---

## 23. Settings

Use a simple single-column settings page with grouped cards:

- Account.
- Language.
- Appearance.
- Notifications.
- Privacy.
- Billing shortcut.

Use:

- Clear section titles.
- Conventional toggles.
- Calm spacing.
- Short explanations.

---

## 24. Bilingual Presentation

Support:

- English.
- Simplified Chinese.

Design rules:

- Language switch appears on public navigation and app top bar.
- Allow buttons to grow naturally.
- Avoid fixed-width labels that break when translated.
- Keep common abbreviations such as `ED`, `EA`, and `RD`.
- Use locale-appropriate dates.
- Preserve official school names unless localized names are available.
- Check both languages at mobile widths.

---

## 25. Responsive Rules

Required widths to inspect:

```text
320px
375px
768px
1024px
1440px
```

### 25.1 Breakpoints

| Width | Behavior |
| --- | --- |
| `>= 1280px` | Full sidebar, wide tables, two-column dashboard |
| `1024px-1279px` | Slightly tighter app shell |
| `768px-1023px` | Collapsible sidebar, stacked secondary panels |
| `< 768px` | Bottom nav, single-column content, sheets instead of drawers |
| `< 480px` | Reduced decorations and tighter spacing |

### 25.2 Mobile Rules

- Preserve at least `16px` side padding.
- Keep touch targets at least `44px`.
- Use `svh` for full-screen sections.
- Reduce decorative grid and rough marks.
- Keep status and deadlines visible.
- Use Icon View as a comfortable alternative to the tracker table.
- If the List View table scrolls horizontally, show a visual cue.
- Do not use fixed card heights.
- Avoid bottom-nav overlap with actions.

---

## 26. Loading, Empty, And Error States

### 26.1 Loading

- Use skeletons shaped like final cards and rows.
- Avoid full-page spinners.
- Use route-progress visuals only for Resume parsing and Bio generation.

### 26.2 Empty States

| Page | Illustration idea | CTA |
| --- | --- | --- |
| Dashboard | Empty route ending at first waypoint | Add your first school |
| Tracker | Blank atlas with one school marker | Add school |
| Resume | Field-notes document | Upload resume |
| Bio Website | Empty exhibit card | Create Bio website |
| Planner | Calm completed route | Review tracker |

### 26.3 Error States

- Use clear plain language.
- Keep user input visible.
- Offer retry.
- Avoid technical error codes as the main message.
- Use muted danger color, not a full red page.

---

## 27. Accessibility Design

- Use visible keyboard focus rings.
- Do not use color alone for status or risk.
- Label icon-only buttons.
- Keep text contrast readable in both themes.
- Ensure dialogs and sheets are easy to close.
- Do not require animation to understand content.
- Respect reduced motion.
- Add meaningful alt text for illustrations and images.
- Keep decorative illustrations visually separate from form controls.
- Make mobile touch targets at least `44px`.

---

## 28. Design QA Checklist

Review these screens:

```text
Landing page
Pricing
Login
Signup
Onboarding
Dashboard
Tracker List View
Tracker Icon View
Add School
School Detail
AI Resume Upload
AI Resume Processing
Parsed Resume Profile
Profile
Bio Website Home
Bio Template Selection
Bio Editor
Bio Version History
Planner
Settings
```

Check:

- Visual style feels consistent.
- Homepage is expressive but product workspace stays calm.
- Application Atlas metaphor appears subtly across the product.
- Tables remain easy to read.
- Cards do not feel overdecorated.
- Status and risk colors are distinct.
- Light and dark themes both feel intentional.
- Chinese and English labels fit.
- Mobile views are usable at `320px` and `375px`.
- No clipped copy.
- No accidental horizontal scrolling except the tracker table.
- Drawers become full-screen sheets on mobile.
- Bottom navigation does not cover actions.
- Reduced-motion mode remains understandable.
- Empty, loading, and error states feel designed rather than forgotten.

---

## 29. Final Visual Standard

The finished frontend should achieve this balance:

- The public homepage feels authored, memorable, and visually distinctive.
- The dashboard feels calm and helpful.
- The Tracker feels efficient enough to open every day.
- Resume pages feel private, structured, and supportive.
- Bio Website templates feel personal without becoming chaotic.
- Planner recommendations feel clear rather than stressful.
- Decorative rough marks feel deliberate and rare.
- The complete system feels like one product.
