# PluralSkill LMS - Product Requirements Document

## Original Problem Statement
Build PluralSkill - a modern, full-stack web application designed to be an online learning platform. It provides users with access to courses, workshops, and hands-on virtual labs. The platform features distinct experiences for regular users (learners) and administrators, with a focus on practical, job-ready skills.

## Architecture
- **Frontend**: React 18 with React Router, ShadCN/UI components, Tailwind CSS
- **Backend**: FastAPI (Python) with JWT authentication
- **Database**: MongoDB with Motor (async driver)
- **Styling**: Custom design system (Indigo + Acid Lime theme, Outfit + Manrope fonts)

## User Personas
1. **Learner**: Users who browse courses, enroll, and track their learning progress
2. **Admin**: Platform administrators who manage courses, users, and workshops

## Core Requirements (Static)
- User authentication (signup/login with email/password)
- Course catalog with search and filtering
- Course enrollment system
- User profile management
- Admin dashboard with CRUD for courses/workshops
- User data export (CSV)

## What's Been Implemented (Jan 29, 2026)

### Authentication
- [x] User signup with validation
- [x] User login with JWT tokens
- [x] Session persistence
- [x] Password change functionality
- [x] Admin role support

### Course Management
- [x] Course catalog with 4 seeded courses
- [x] Search and filter (by category, level)
- [x] Course detail pages with syllabus
- [x] Course enrollment for authenticated users
- [x] My Courses dashboard showing enrolled courses
- [x] Admin CRUD for courses (create, edit, delete, publish)

### User Management
- [x] User profile page (edit name, bio, skills)
- [x] Admin view of all users
- [x] CSV export of user data

### Workshops
- [x] Workshop listing (2 seeded workshops)
- [x] Admin CRUD for workshops
- [x] Workshop display on homepage

### UI/UX
- [x] Responsive design (mobile + desktop)
- [x] Marketing landing page for guests
- [x] Dashboard view for logged-in users
- [x] Admin dashboard with tabs (Courses, Users, Workshops)
- [x] Toast notifications for actions

## Prioritized Backlog

### P0 (Critical) - Done
- ✅ Core authentication
- ✅ Course catalog and enrollment
- ✅ Admin course management

### P1 (High Priority) - Future
- Course progress tracking
- Video/content player integration
- Certificate generation

### P2 (Medium Priority) - Future
- Virtual labs implementation
- Workshop registration
- Payment integration (Stripe)
- Email notifications

### P3 (Low Priority) - Future
- Social login (Google OAuth)
- Course ratings/reviews
- Discussion forums
- Instructor dashboard

## Next Tasks
1. Implement course progress tracking
2. Add video player for course content
3. Integrate Stripe for paid courses
4. Add certificate generation upon course completion

## Test Credentials
- **Admin**: admin@pluralskill.com / admin123
