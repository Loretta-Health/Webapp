# Loretta - Gamified Health Dashboard

## Overview
Loretta is a gamified health tracking dashboard, inspired by Duolingo, that motivates users in managing their health through game mechanics like XP, levels, streaks, and achievements. It offers daily check-ins, medication tracking, activity monitoring, personalized health insights, and community comparison. The project aims to transform health management into an engaging and motivating experience, prioritizing user privacy, and capturing a segment of the health tech market with its unique gamified approach.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Vite, Tailwind CSS, shadcn/ui (New York style), Wouter for routing.
- **Design Principles**: Duolingo-inspired gamification, vibrant color palette, custom typography (Nunito, DM Mono), gradient backgrounds, frosted glass effects (glass-morphism), animations, and mobile-first responsive design.
- **Key UI Elements**: XP progress, level indicators, streak counters, lives system, medication trackers, activity metrics, risk score cards, educational tooltips, leaderboards, achievement badges, and an interactive mascot.
- **State Management**: TanStack Query for server state, React hooks for UI state, LocalStorage for consent and preferences.
- **Consolidated XP Updates**: `useXPUpdater` hook (`client/src/hooks/useXPUpdater.ts`) provides a single function (`updateAllXPDisplays`) that updates all XP visual representations in real-time, including total XP, level, XP today, missions, and check-ins. Supports event listeners for custom XP update reactions.
- **Internationalization**: `react-i18next` for English and German support.
- **Mobile Optimization**: Fully responsive design using Tailwind CSS breakpoints, with Capacitor 7.x for native iOS/Android app wrapping.

### Backend
- **Server**: Express.js with TypeScript.
- **Database**: PostgreSQL via Neon serverless driver, Drizzle ORM, with Zod for schema validation.
- **API Endpoints**: RESTful API for user data, gamification, risk scores, AI chat, and calendar events.
- **Authentication**: Session-based using Passport.js (local strategy) and PostgreSQL session store, with token-based authentication for native mobile apps.

### Core Features
- **Email Verification**: Configurable 6-digit code verification system with security measures (hashing, expiry, rate limiting, lockout).
- **AI Health Navigator**: Contextual AI providing health advice based on user geolocation and real-time weather data (Open-Meteo API), suggesting dynamic recommendations for outdoor missions.
- **Location Services**: Uses Capacitor Geolocation for native and browser API for web, with permission handling and fallback to a default location. Weather assessment and AI context are dependent on location availability.
- **Weather-Based Mission Alternatives**: Database-driven alternative missions are offered when real location data indicates bad outdoor weather conditions, for specific outdoor missions (marked with `isOutdoor` flag in database).
- **Alternative Mission Triggering**: Gentler alternative missions are offered when EITHER: (1) user has checked in with a negative emotional state today, OR (2) weather is bad AND the mission is an outdoor mission. The AI is aware of all alternatives and their triggering conditions.
- **Health Questionnaire & Risk Prediction**: 44-questionnaire mapped to NHANES parameters, integrating with an external XGBoost diabetes prediction API for a single diabetes-based health risk score (0-100), with auto-recalculation upon data changes.
- **Mission System**: Daily and weekly missions with automatic progress tracking and timezone-aware resets based on user preferences.
- **Calendar System**: Database-backed personal calendar events with CRUD operations via REST API, supporting four event types and week navigation.
- **Friend System**: Unique invite codes for bidirectional friendships and XP-based leaderboards.

### Native Mobile App Specifics (Capacitor)
- **Bundle ID**: `com.lorettahealth.healthnavigator`.
- **API Configuration**: Native apps route API requests to `https://loretta-care.replit.app`.
- **CORS Support**: Server includes CORS middleware for Capacitor origins and Replit domains, with `X-Auth-Token` support.
- **Authentication**: Token-based authentication stored in Capacitor Preferences, sent via `X-Auth-Token` header, persisted in `auth_tokens` table. Includes 401 handling for invalid tokens and a global fetch interceptor for consistency.
- **Platform Classes**: `main.tsx` adds `capacitor-android` or `capacitor-ios` class to document body on initialization for platform-specific CSS targeting.
- **Android Safe Area**: Uses edge-to-edge layout with `StatusBar.setOverlaysWebView({ overlay: true })`. CSS provides 28px fallback for safe-area-inset-top via `.capacitor-android .safe-area-top { padding-top: max(28px, env(safe-area-inset-top, 28px)); }`.
- **iOS Safe Area**: Uses standard `env(safe-area-inset-*)` CSS environment variables which are automatically provided by iOS Safari/WebKit.

## External Dependencies

- **Database**: Neon serverless driver.
- **ML Prediction API**: External XGBoost diabetes prediction API (hosted on Replit).
- **Weather API**: Open-Meteo.
- **Analytics**: Microsoft Clarity.
- **Frontend Libraries**: Radix UI, Embla Carousel, CMDQ, Lucide React, Framer Motion.
- **Form & Validation**: React Hook Form, Zod.
- **Utilities**: date-fns, class-variance-authority, clsx, tailwind-merge, nanoid.
- **Routing**: Wouter.