# Loretta - Gamified Health Dashboard

## Overview

Loretta is a gamified health tracking dashboard that transforms health management into an engaging, Duolingo-inspired experience. The application uses game mechanics (XP, levels, streaks, achievements) to motivate users to maintain healthy habits through daily check-ins, medication tracking, and activity monitoring. Built with a privacy-first approach, it emphasizes user consent and optional data sharing while providing personalized health insights and community comparison features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Styling:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Tailwind CSS for utility-first styling with custom design system
- shadcn/ui component library (New York style) for consistent, accessible UI components
- Wouter for lightweight client-side routing

**Design System:**
- Duolingo-inspired gamification with vibrant color palette (lime green, electric purple, sky blue, sunset orange)
- Custom typography using Nunito (sans-serif) and DM Mono (monospace) from Google Fonts
- Gradient-based backgrounds with frosted glass card effects
- Extensive use of animations and visual feedback for user interactions
- Mobile-first responsive design with sidebar navigation

**State Management:**
- TanStack Query (React Query) for server state management and caching
- Local state with React hooks for UI interactions
- LocalStorage for consent management and user preferences

**Key UI Components:**
- Gamification elements: XP progress bars, level indicators, streak counters, lives system
- Health tracking: medication trackers, activity metrics, risk score cards
- Educational features: medical term tooltips, science explainers with citations
- Social features: leaderboards with community/family switching, achievement badges
- Interactive elements: mascot character with different poses, treasure chests, quest cards

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for API server
- Separate development (`index-dev.ts`) and production (`index-prod.ts`) entry points
- Custom middleware for request logging and JSON parsing with raw body access

**Development Setup:**
- Vite middleware integration for HMR in development
- Runtime error overlay and dev banner plugins for Replit environment
- Template-based SSR with dynamic cache busting in development mode

**Storage Layer:**
- Database storage implementation (`DatabaseStorage`) with PostgreSQL
- Interface-based design (`IStorage`) for clean separation of concerns
- Drizzle ORM configured for PostgreSQL (via Neon serverless driver)
- Schema-first approach with Zod validation using `drizzle-zod`

**Database Schema:**
- Users table with UUID primary keys, username, and password fields
- Questionnaire answers table with userId, category, and JSON answers storage
- User profiles table with demographic and health information fields
- PostgreSQL-specific features (e.g., `gen_random_uuid()`, JSONB)
- Migration system via `drizzle-kit`

**API Endpoints:**
- `GET /api/questionnaires/:userId` - Get all questionnaire answers for a user
- `GET /api/questionnaires/:userId/:category` - Get answers for specific category
- `POST /api/questionnaires` - Save/update questionnaire answers (expects Record<string, string> format)
- `GET /api/profile/:userId` - Get user profile
- `POST /api/profile` - Save/update user profile
- `GET /api/preferences/:userId` - Get user preferences (consent, newsletter, theme, language)
- `POST /api/preferences` - Save/update user preferences (accepts ISO string dates)
- `GET /api/gamification/:userId` - Get gamification data (XP, level, streak, lives, achievements)
- `POST /api/gamification` - Initialize/update gamification data
- `POST /api/gamification/:userId/checkin` - Record daily check-in
- `POST /api/gamification/:userId/xp` - Add XP to user
- `GET /api/risk-scores/:userId/latest` - Get latest risk score
- `POST /api/risk-scores` - Save calculated risk score
- `POST /api/chat` - Health Navigator AI chat endpoint

**Frontend-Backend Integration:**
- Welcome page syncs consent/newsletter preferences to backend on accept/decline
- Onboarding page syncs profile data, questionnaire answers, risk scores, and initializes gamification
- Dashboard fetches gamification data and risk scores from backend with localStorage fallback
- Profile page loads/saves questionnaire answers and profile data from/to backend
- All mutations properly invalidate React Query cache for data consistency

### Health Questionnaire & Risk Prediction API

**Questionnaire Structure:**
- 46 questions mapped to NHANES-style API parameter IDs
- Categories: Demographics, Body Measurements, Medical History, Recent Health, Medications, Health Ratings, Oral Health, Physical Activity, Work, Sleep, Lifestyle, Healthcare Access, Financial, Living Situation
- Each question has: id, apiId, text, type (choice/number/time), and options with apiValue mappings

**API Parameter Mapping (in Onboarding.tsx):**
- Demographics: RIDAGEYR (age), RIDRETH3 (ethnicity), DMDEDUC2 (education), DMDMARTZ (marital status), DMDHHSIZ (household size)
- Body: WHD010 (height in inches), WHD020 (weight in lbs), WHD050 (weight 1yr ago in lbs)
- Medical History: BPQ020, BPQ080, DIQ160, DIQ180, MCQ160A/B/C/E, KIQ022, MCQ560
- Balance/Falls: BAQ321C (unsteadiness), BAQ530 (falls), DPQ030 (sleep trouble)
- Medications: RXQ033 (prescription), RXQ510 (aspirin)
- Health Ratings: HUQ010 (general), AUQ054 (hearing), OHQ845 (dental)
- Oral Health: OHQ620/630/660/670 (mouth problems)
- Activity: PAD790 (moderate activity hours/week), PAD680 (sedentary hours/day)
- Work: OCD150 (job type)
- Sleep: SLD012/013 (sleep hours), SLQ300/310/320/330 (sleep/wake times)
- Lifestyle: ALQ121 (alcohol frequency)
- Healthcare: HUQ030 (routine healthcare), HUQ055 (video consult)
- Financial: INDFMPIR, INDFMMPI (income ratios), INQ300 (savings)
- Housing: HOD051 (rooms)

**buildFeatureJson Function:**
- Exported from Onboarding.tsx for API integration
- Converts answers to API format with unit conversions:
  - Height: cm → inches (÷ 2.54)
  - Weight: kg → pounds (× 2.20462)
  - Time: HH:MM → decimal hours
  - Rooms: 1-12 → API codes 0-11
- Returns array format `[{ ID: "RIDAGEYR", Value: "57" }, ...]` for prediction API POST body

**ML Prediction API Integration:**
- Backend proxy endpoint at `/api/predict` forwards requests to external ML service
- External service URL: `https://loretta-ml-prediction-dev-5oc2gjs2kq-el.a.run.app/predict` (configurable via PREDICTION_API_URL env var)
- Request format: `{ features: [{ ID: string, Value: string }] }`
- Response format: `{ diabetes_probability: number, risk_level: string }`
- **CURRENTLY DISABLED**: ML backend producing incorrect predictions, using fallback route

**Risk Calculation (Current Implementation):**
1. Primary: Server-side calculation (`/api/risk-scores/:userId/calculate`)
2. Fallback: Client-side `calculateRiskScore` function
- ML prediction API bypassed until backend issues are resolved
- Live score during questionnaire uses client-side calculation

### External Dependencies

**Database & ORM:**
- `@neondatabase/serverless` - PostgreSQL database connection for serverless environments
- `drizzle-orm` - Type-safe ORM with schema-first design
- `drizzle-zod` - Zod schema generation from Drizzle schemas
- `connect-pg-simple` - PostgreSQL session store (prepared for session management)

**UI Component Libraries:**
- Extensive Radix UI primitives for accessible components (accordion, dialog, dropdown, popover, tabs, toast, tooltip, etc.)
- `embla-carousel-react` - Touch-friendly carousel component
- `cmdk` - Command menu component
- `lucide-react` - Icon library
- `framer-motion` - Animation library (used in consent form and modals)

**Form & Validation:**
- `react-hook-form` - Form state management
- `@hookform/resolvers` - Form validation resolvers
- `zod` - Schema validation library

**Utilities:**
- `date-fns` - Date manipulation and formatting
- `class-variance-authority` - Type-safe variant styling
- `clsx` & `tailwind-merge` - Conditional class name utilities
- `nanoid` - Unique ID generation

**Development Tools:**
- `@replit/vite-plugin-*` - Replit-specific development plugins
- `tsx` - TypeScript execution for development
- `esbuild` - Production build bundler

**Routing:**
- `wouter` - Lightweight routing library (replacing React Router)

### Authentication & Authorization

**Current Implementation:**
- Consent-based access control via localStorage (`loretta_consent`)
- Route guards (`ConsentGuard`) protecting dashboard access
- Basic user schema prepared for authentication (username/password fields)
- Session infrastructure ready (connect-pg-simple imported)

**Prepared Infrastructure:**
- Storage interface includes user CRUD methods
- Session store package included but not yet implemented
- Password fields in schema (authentication logic to be added)

### Design Philosophy & Accessibility

**Gamification Strategy:**
- Duolingo-inspired progression system with levels, XP, and streaks
- Visual reward mechanisms (treasure chests, achievement badges, level-up modals)
- Lives system and energy bars for engagement pacing
- Quest/mission cards with daily, weekly, and bonus categories

**Health Education:**
- Medical term tooltips with simple and technical explanations
- Expandable science sections with peer-reviewed citations
- Community tips and practical health advice
- Risk scoring with trend indicators and actionable feedback

**Privacy & Consent:**
- Comprehensive consent form with detailed privacy points
- Explicit opt-in/opt-out flow with decline acknowledgment page
- Educational messaging about data usage and optional features
- Transparency about medical document handling and wearable integration

**Accessibility:**
- Semantic HTML with ARIA attributes via Radix UI
- Keyboard navigation support
- Screen reader-friendly tooltips and dialogs
- Responsive design with mobile considerations
- Test IDs on interactive elements for testing