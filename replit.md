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

### Health Questionnaire & Risk Prediction
- **Questionnaire**: 46 questions across various health categories, mapped to NHANES-style API parameters.
- **ML Integration**: Designed to integrate with an external ML prediction API (currently bypassed due to issues, using a fallback evidence-based risk model).
- **Risk Calculation**: Uses an evidence-based model considering BMI, age, weight changes, medical history, lifestyle, and other factors, capped at 0-100.

### Internationalization (i18n)
- Implemented with `react-i18next` and `i18next-browser-languagedetector`.
- Supports English (en), German (de), and Turkish (tr).
- Translations are organized by namespace and stored in `client/src/i18n/locales/`.

## External Dependencies

- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`, `connect-pg-simple`.
- **UI Components**: Radix UI primitives, `embla-carousel-react`, `cmdk`, `lucide-react`, `framer-motion`.
- **Form & Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Utilities**: `date-fns`, `class-variance-authority`, `clsx`, `tailwind-merge`, `nanoid`.
- **Development Tools**: `@replit/vite-plugin-*`, `tsx`, `esbuild`.
- **Routing**: `wouter`.