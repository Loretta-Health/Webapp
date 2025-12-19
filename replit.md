# Loretta - Gamified Health Dashboard

## Overview
Loretta is a gamified health tracking dashboard inspired by Duolingo, designed to motivate users in managing their health through engaging game mechanics like XP, levels, streaks, and achievements. It supports daily check-ins, medication tracking, and activity monitoring. The application prioritizes user privacy, offering optional data sharing, personalized health insights, and community comparison features. Loretta aims to transform health management into an interactive and motivating experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Vite, Tailwind CSS, shadcn/ui (New York style), Wouter for routing.
- **Design**: Duolingo-inspired gamification with a vibrant color palette, custom typography (Nunito, DM Mono), gradient backgrounds, frosted glass effects, animations, and mobile-first responsive design.
- **State Management**: TanStack Query for server state, React hooks for UI state, LocalStorage for consent and preferences.
- **Key UI Elements**: XP progress, level indicators, streak counters, lives system, medication trackers, activity metrics, risk score cards, educational tooltips, leaderboards, achievement badges, and an interactive mascot.

### Backend
- **Server**: Express.js with TypeScript, differentiated entry points for development and production.
- **Database**: PostgreSQL via Neon serverless driver, Drizzle ORM, with a schema-first approach validated by Zod.
- **API Endpoints**: Comprehensive RESTful API for managing user data (questionnaires, profiles, preferences, gamification, risk scores), and AI chat.
- **Authentication**: Session-based using Passport.js (local strategy), PostgreSQL session store, secure password hashing, and protected routes.

### AI Health Navigator with Weather Awareness
- **Weather Context**: The AI chat system receives real-time weather data from the user's location via browser geolocation.
- **Weather Service**: Uses Open-Meteo API (free, no API key required) to fetch current conditions and outdoor activity suitability.
- **Outdoor Assessment**: Weather data is analyzed for temperature, precipitation, wind, visibility, and UV index to determine if conditions are suitable for outdoor activities.
- **Dynamic Prompts**: When weather is bad for outdoor activities, the AI is instructed to proactively suggest indoor alternatives for outdoor missions.
- **Alternative Mission Suggestions**: The AI recommends gentler indoor alternatives only when:
  1. The user has an outdoor mission ACTIVATED (in progress)
  2. AND either: user doesn't feel well OR weather is bad for outdoor activities

### Health Questionnaire & Risk Prediction
- **Questionnaire**: 46 questions across various health categories, mapped to NHANES-style API parameters.
- **ML Integration**: Designed to integrate with an external ML prediction API (currently bypassed due to issues, using a fallback evidence-based risk model).
- **Risk Calculation**: Uses an evidence-based model considering BMI, age, weight changes, medical history, lifestyle, and other factors, capped at 0-100.
- **Data Sync**: Bidirectional synchronization between profile and questionnaire for shared fields (age, height, weight, ethnicity). Changes to either automatically update the other.
- **Auto-Recalculation**: Risk scores automatically recalculate when profile health data or questionnaire answers are updated.

### Friend System
- **Unique Invite Codes**: Each user has a unique 8-character invite code stored in `user_invite_codes` table
- **Invitation Links**: Users share their unique link (e.g., `/join/abc12345`) to add friends
- **Bidirectional Friendships**: When accepting an invite, friendships are created in both directions in the `friendships` table
- **Friend Leaderboard**: "My Friends" tab in the leaderboard shows the user and all their friends ranked by XP
- **Security**: Cannot add yourself as a friend, duplicate friendship attempts are prevented

### Internationalization (i18n)
- Implemented with `react-i18next` and `i18next-browser-languagedetector`.
- Supports English (en) and German (de).
- Translations are organized by namespace and stored in `client/src/i18n/locales/`.

### Mobile Optimization
- Fully optimized for mobile viewing with responsive Tailwind breakpoints (sm:, md:, lg:).
- Key responsive patterns:
  - Grids: `grid-cols-1 sm:grid-cols-2` for form fields, `grid-cols-1 lg:grid-cols-2` for dashboard sections.
  - Tabs: Scrollable on mobile using `overflow-x-auto` wrapper with `inline-flex` on TabsList.
  - Touch targets: Minimum 44px (py-6 on buttons).
  - Text sizing: `text-[10px] sm:text-xs` for small labels, responsive padding.
- Pages optimized: auth-page, Onboarding, Profile, Dashboard, Questionnaire, MissionDetails, RiskScoreDetails, StreakDetails, Calendar, LeaderboardPage.

## External Dependencies

- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`, `connect-pg-simple`.
- **UI Components**: Radix UI primitives, `embla-carousel-react`, `cmdk`, `lucide-react`, `framer-motion`.
- **Form & Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Utilities**: `date-fns`, `class-variance-authority`, `clsx`, `tailwind-merge`, `nanoid`.
- **Development Tools**: `@replit/vite-plugin-*`, `tsx`, `esbuild`.
- **Routing**: `wouter`.