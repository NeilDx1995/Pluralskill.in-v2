# PluralSkill LMS v3 - Product Requirements Document

## Original Problem Statement
Build PluralSkill v3 - an enhanced online learning platform with:
1. **Workshops** (first priority) - Led by industry leaders from top organizations
2. **Open Source** - AI-powered learning roadmaps for industry-specific skills
3. **Courses** - Curriculum-based with videos, tests, and industry focus
4. **Labs** - Simulation-based learning with guided step-by-step practice
5. **Role-Based Access Control** - Admin, Trainer, and Learner roles with distinct permissions

## Architecture
- **Frontend**: React 18 with React Router, ShadCN/UI components, Tailwind CSS
- **Backend**: FastAPI (Python) with JWT authentication & RBAC
- **Database**: MongoDB with Motor (async driver)
- **AI Integration**: OpenAI GPT-5.2 via Emergent LLM key for learning path generation
- **Styling**: Custom design system (Indigo + Acid Lime theme, Outfit + Manrope fonts)
- **Authentication**: JWT tokens with role claims (admin, trainer, learner)

## User Personas
1. **Learner**: Professionals seeking industry-specific skills (Finance, HR, Retail, Supply Chain) - view-only access to content
2. **Trainer**: Content creators who can create and manage their own courses, labs, and workshops
3. **Admin**: Platform administrators with full analytics, user management, and content oversight

## Core Requirements (Static)
- User authentication (signup/login with JWT)
- Workshops with industry leaders (speakers, companies, tags)
- AI-powered open source learning path generation
- Course catalog with videos, tests, modules
- Labs with simulation-based step-by-step learning
- Admin dashboard with full CRUD

## What's Been Implemented

### RBAC System (Jan 29, 2026 - Latest)
- [x] Three-tier role system: Admin, Trainer, Learner
- [x] Backend RBAC: `require_admin` and `require_trainer_or_admin` decorators
- [x] Frontend AuthContext: `isAdmin`, `isTrainer`, `isTrainerOrAdmin` flags
- [x] Conditional navigation based on user role
- [x] Trainer Dashboard at `/trainer-dashboard` for content management
- [x] Admin Dashboard with full analytics at `/admin`
- [x] Role-protected API endpoints:
  - `/api/admin/*` - Admin only (403 for others)
  - `/api/trainer/*` - Admin and Trainer (403 for learners)
  - Public endpoints accessible to all
- [x] Default seeded users: admin@pluralskill.com / trainer@pluralskill.com

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
- [x] Stats overview (users by role, courses, workshops, labs)
- [x] Full CRUD for courses, workshops, labs
- [x] User management with role assignment
- [x] Analytics with top courses/labs by engagement
- [x] User list with role breakdown (Learners, Trainers)

### Trainer Dashboard
- [x] Personal content stats (My Courses, My Labs, My Workshops)
- [x] Course CRUD (trainers see only their own content)
- [x] Lab CRUD with step-by-step editing
- [x] Workshop creation and management

## Prioritized Backlog

### P0 (Critical) - Done ✅
- ✅ Workshops with industry leaders
- ✅ AI learning path generation
- ✅ Industry-focused courses
- ✅ Simulation labs
- ✅ Role-Based Access Control (Admin/Trainer/Learner)

### P1 (High Priority) - Next
- Video upload for course modules (Trainer content management)
- Test/quiz creation for courses
- Full admin analytics (live webinars, access data)
- Course progress tracking per user

### P2 (Medium Priority) - Future
- Interactive Labs with code editor simulation
- Certificate generation
- Payment integration (Stripe)
- Email notifications for workshops
- Workshop registration with capacity limits

### P3 (Low Priority) - Future
- Social login (Google OAuth)
- Course ratings/reviews
- Document management (resume uploads)
- Discussion forums

## Next Tasks
1. Implement video upload for course modules (Trainer feature)
2. Add test/quiz builder for courses
3. Complete admin analytics dashboard data
4. Track course progress per user

## Test Credentials
- **Admin**: admin@pluralskill.com / admin123
- **Trainer**: trainer@pluralskill.com / trainer123
- **Learner**: Sign up a new user (default role is learner)

## AI Integration Details
- Uses `emergentintegrations` library with EMERGENT_LLM_KEY
- Model: OpenAI GPT-5.2
- Generates 4-8 week roadmaps with curated open source resources
