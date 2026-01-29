# PluralSkill LMS v2 - Product Requirements Document

## Original Problem Statement
Build PluralSkill v2 - an enhanced online learning platform with:
1. **Workshops** (first priority) - Led by industry leaders from top organizations
2. **Open Source** - AI-powered learning roadmaps for industry-specific skills
3. **Courses** - Curriculum-based with videos, tests, and industry focus
4. **Labs** - Simulation-based learning with guided step-by-step practice

## Architecture
- **Frontend**: React 18 with React Router, ShadCN/UI components, Tailwind CSS
- **Backend**: FastAPI (Python) with JWT authentication
- **Database**: MongoDB with Motor (async driver)
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM key for learning path generation
- **Styling**: Custom design system (Indigo + Acid Lime theme, Outfit + Manrope fonts)

## User Personas
1. **Learner**: Professionals seeking industry-specific skills (Finance, HR, Retail, Supply Chain)
2. **Admin**: Platform administrators managing content and users
3. **Workshop Attendee**: Users interested in live sessions with industry experts

## Core Requirements (Static)
- User authentication (signup/login with JWT)
- Workshops with industry leaders (speakers, companies, tags)
- AI-powered open source learning path generation
- Course catalog with videos, tests, modules
- Labs with simulation-based step-by-step learning
- Admin dashboard with full CRUD

## What's Been Implemented (Jan 29, 2026)

### Workshops Section
- [x] 3 workshops with industry leaders (Goldman Sachs, Microsoft, Amazon, Toyota, Stripe)
- [x] Speaker profiles with avatars, titles, company logos
- [x] Instagram Live platform integration
- [x] Tags for categorization (Finance, AI, HR, Supply Chain)
- [x] Registration count and max participants

### Open Source Learning Paths
- [x] AI-powered path generation using GPT-5.2
- [x] Industry-specific roadmaps (Finance, HR, Retail, Technology)
- [x] Curated resources (YouTube, GitHub, documentation, tutorials)
- [x] Week-by-week structured learning with skills tracking

### Courses
- [x] 6 industry-focused courses (Finance FP&A, HR Analytics, Retail, Operations, AI Tools, Power BI)
- [x] Module structure with video placeholders
- [x] Test questions with explanations
- [x] Learning outcomes per course
- [x] Enrollment tracking

### Labs
- [x] 4 simulation-based labs (Python Pipeline, ML Deployment, Excel VBA, Power BI)
- [x] Step-by-step guided instructions
- [x] Prerequisites and skills gained
- [x] Hints and expected outcomes per step
- [x] Completion tracking

### Admin Dashboard
- [x] Stats overview (users, courses, workshops, labs)
- [x] Full CRUD for courses
- [x] Workshop management with speakers
- [x] User list with CSV export

## Prioritized Backlog

### P0 (Critical) - Done
- ✅ Workshops with industry leaders
- ✅ AI learning path generation
- ✅ Industry-focused courses
- ✅ Simulation labs

### P1 (High Priority) - Future
- Video upload for course modules
- Lab environment simulation (code editor)
- Workshop registration
- Course progress tracking

### P2 (Medium Priority) - Future
- Certificate generation
- Payment integration (Stripe)
- Email notifications for workshops
- Discussion forums

### P3 (Low Priority) - Future
- Social login (Google OAuth)
- Course ratings/reviews
- Instructor dashboard
- Analytics dashboard

## Next Tasks
1. Implement video upload for course modules
2. Add interactive code editor for labs
3. Enable workshop registration
4. Track course progress per user

## Test Credentials
- **Admin**: admin@pluralskill.com / admin123

## AI Integration Details
- Uses `emergentintegrations` library with EMERGENT_LLM_KEY
- Model: OpenAI GPT-5.2
- Generates 4-8 week roadmaps with curated open source resources
