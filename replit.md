# Loretta - Gamified Health Dashboard

## Overview
Loretta is a gamified health tracking dashboard, inspired by Duolingo, designed to motivate users in managing their health. It incorporates game mechanics like XP, levels, streaks, and achievements to make health management interactive. Key features include daily check-ins, medication tracking, activity monitoring, personalized health insights, and community comparison. Loretta aims to transform health management into an engaging and motivating experience while prioritizing user privacy. The project has a business vision to capture a segment of the health tech market by offering a unique, gamified approach to well-being, fostering user retention and positive health outcomes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Frameworks**: React 18 with TypeScript, Vite, Tailwind CSS, shadcn/ui (New York style), Wouter for routing.
- **Design Principles**: Duolingo-inspired gamification, vibrant color palette, custom typography (Nunito, DM Mono), gradient backgrounds, frosted glass effects (glass-morphism), animations, and mobile-first responsive design.
- **Key UI Elements**: XP progress, level indicators, streak counters, lives system, medication trackers, activity metrics, risk score cards, educational tooltips, leaderboards, achievement badges, and an interactive mascot.
- **State Management**: TanStack Query for server state, React hooks for UI state, LocalStorage for consent and preferences.

### Backend
- **Server**: Express.js with TypeScript.
- **Database**: PostgreSQL via Neon serverless driver, Drizzle ORM, with Zod for schema validation.
- **API Endpoints**: RESTful API for user data (questionnaires, profiles, preferences, gamification, risk scores), and AI chat.
- **Authentication**: Session-based using Passport.js (local strategy) and PostgreSQL session store.

### AI Health Navigator with Weather Awareness
- **Contextual AI**: Integrates real-time weather data (via Open-Meteo API) based on user geolocation to provide context-aware health advice.
- **Dynamic Recommendations**: AI suggests indoor alternatives for outdoor missions when weather conditions are unsuitable or the user reports not feeling well. This applies only to currently activated outdoor missions.

### Location Services (Geolocation → Weather → AI Flow)
- **Capacitor Geolocation Plugin**: Uses `@capacitor/geolocation` v7.1.7 for native iOS/Android location access.
- **Platform-Aware Hook**: `useGeolocation` hook in `client/src/hooks/useGeolocation.ts` handles both native (Capacitor) and web (browser API) platforms.
- **Permission Handling**: 
  - iOS: `NSLocationWhenInUseUsageDescription` in Info.plist
  - Android: `ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` in AndroidManifest.xml
- **Default Location**: Falls back to Berlin coordinates (52.52, 13.405) when permission is denied or unavailable.
- **Weather Query Guard**: Weather API is only called when `locationEnabled` is true (user has granted permission). Both `useWeatherAssessment` hook and manual refetch calls are guarded.
- **AI Context Awareness**: The `usingDefaultLocation` flag is passed to the AI, so it knows when weather data is from a default location rather than the user's actual location. Alternative mission suggestions are only triggered when using the user's real location.
- **Weather Flow**: `useGeolocation` → `useWeatherAssessment` → `/api/weather/outdoor-assessment` → Open-Meteo API → `weatherContext` passed to `/api/chat` AND `/api/missions/suggest` → AI/mission response with weather-aware recommendations.

### Weather-Based Mission Alternatives
- **Database-Driven Alternatives**: Alternative missions are stored in the database with `isAlternative` and `alternativeOf` fields linking them to parent missions.
- **Outdoor Missions**: `walking` and `jumping-jacks` are marked as outdoor missions that trigger weather-based alternatives.
- **API Endpoint**: `GET /api/missions/:missionKey/alternative` returns the database alternative for a mission.
- **Trigger Conditions**: Weather alternatives only show when:
  1. User has granted real location permission (`locationEnabled && !usingDefault`)
  2. Weather assessment indicates bad conditions (`!isGoodForOutdoor`)
  3. The mission is an outdoor mission
- **MissionDetails Integration**: The UI fetches and displays database alternatives instead of hardcoded ones, with appropriate banners for mood-based or weather-based alternatives.

### Health Questionnaire & Risk Prediction
- **Questionnaire**: 44 health questions mapped to NHANES-style parameters.
- **ML Integration**: Connects to an external XGBoost diabetes prediction API (RDP001 model) hosted on Replit for a single, diabetes-based health risk score (0-100).
- **Data Sync**: Bidirectional synchronization between user profile and questionnaire data.
- **Auto-Recalculation**: Risk score automatically updates when relevant profile or questionnaire data changes, triggered solely by the ML API.

### Mission System with Automatic Resets
- **Mission Categories**: Daily and weekly missions with automatic progress tracking.
- **Timezone-Aware Resets**: Missions reset based on the user's configured timezone (stored in user_preferences).
- **Daily Missions**: Reset at midnight in the user's local timezone (when a new calendar day starts).
- **Weekly Missions**: Reset on Monday at midnight in the user's local timezone (when a new week begins).
- **Reset Tracking**: Each mission has a `lastResetAt` timestamp to track when it was last reset.
- **Reset Trigger**: Resets are checked and applied on each `GET /api/missions` request.
- **Implementation**: See `server/missionReset.ts` for the reset logic.

### Friend System
- **Invite Mechanism**: Users generate unique 8-character invite codes to invite friends.
- **Bidirectional Friendships**: Friendships are established in both directions upon acceptance.
- **Leaderboards**: Friends appear on a dedicated leaderboard ranked by XP.

### Internationalization (i18n)
- Implemented with `react-i18next` and `i18next-browser-languagedetector`, supporting English and German.

### Mobile Optimization
- Fully responsive design using Tailwind CSS breakpoints, ensuring optimal viewing across devices.
- Key patterns include responsive grids, scrollable tabs, and accessible touch targets.

### Native Mobile Apps (Capacitor)
- **Framework**: Capacitor 7.x for wrapping the React web app as native iOS/Android apps.
- **Bundle ID**: `com.lorettahealth.healthnavigator`
- **Platforms**: iOS and Android folders generated in project root.
- **Plugins**: SplashScreen and StatusBar configured with Loretta brand colors.
- **Safe Areas**: CSS env() variables handle notches and rounded corners on modern devices.
- **API Configuration**: Native apps use `getApiUrl()` from `client/src/lib/queryClient.ts` to route API requests to the deployed Replit backend (`https://loretta-care.replit.app`).
- **CORS Support**: Server includes CORS middleware (`server/app.ts`) allowing Capacitor origins and Replit domains. `X-Auth-Token` is included in `Access-Control-Allow-Headers`.
- **Token-Based Auth**: Native apps use token-based authentication stored in Capacitor Preferences to handle iOS cookie limitations. Tokens are sent via `X-Auth-Token` header and validated by the server. Tokens are persisted in the database (`auth_tokens` table) to survive server restarts and deployments.
- **401 Handling**: The client automatically clears invalid tokens on 401 responses (native platforms only), ensuring stale tokens don't cause login loops.
- **Unified Fetch Helper**: Use `authenticatedFetch()` from `client/src/lib/queryClient.ts` for ALL API calls. This helper automatically adds auth tokens for native apps, handles URL prefixing, and provides consistent error handling.
- **Global Fetch Interceptor (Safety Net)**: A global fetch interceptor in `queryClient.ts` automatically patches `window.fetch` to add auth tokens for any API calls that might have been missed. This ensures native app authentication works even if a developer accidentally uses direct `fetch()` calls.
- **Build Process**: `npm run build` followed by `npx cap sync` to update native projects.
- **Setup Guide**: See `MOBILE_SETUP.md` for detailed instructions on running on simulators/devices.

### Mobile Build History
**Last Capacitor-affecting commit synced:** Latest (Native geolocation support) - 2026-01-21

Any commits after the last synced commit that touch `client/` or `capacitor.config.ts` will require a rebuild.

| Date | Platform | Last Synced Commit | Notes |
|------|----------|-------------------|-------|
| 2026-01-21 | iOS & Android | Latest | Native geolocation plugin, iOS/Android location permissions |
| 2026-01-21 | iOS & Android | a7cd2e3 | Modal centering refactor, full safe area support for all dialogs |
| 2026-01-20 | iOS & Android | bca4103 | Database token storage, 401 handling, session expiry toast, Cache-Control headers |
| 2026-01-20 | iOS & Android | d1f2b89 | Mission progress sync, database source of truth |
| 2026-01-19 | iOS & Android | e35f192 | Token-based auth to fix iOS login persistence |
| 2026-01-13 | iOS & Android | ba6e33b | Questionnaire state fix, ML API updates |
| 2026-01-13 | Android | 3ab6a2a | Safe area support, swipe-to-close menu |

### Analytics
- **Microsoft Clarity**: Integrated for user behavior analytics, heatmaps, and session recordings, with custom event tracking for core user actions and gamification.

### UI Style Guide (MyDashboard Reference)
- **Glass-morphism Design**: All UI components adhere to a consistent glass-morphism style.
- **Color Palette**: Defined primary (blue family), accent (lavender/purple), semantic (success, warning, danger, streak, trophy, neutral), and text colors.
- **Backgrounds**: Standard page backgrounds use blue/purple gradients, while loading states and headers feature specific gradient and SVG grid patterns.
- **Components**: Standardized `GlassCard` for containers, icon containers with size and gradient variants, responsive typography, distinct progress bar styles, various button types (primary, secondary, ghost, icon), and specialized badges (count, XP, streak, success, level, status).
- **Layout Elements**: Consistent styling for hero banners, collapsible sections, stat cards, form elements (select, input), list items (checklist), sidebar, header, and modal overlays.
- **Spacing and Responsiveness**: Strict conventions for padding, gaps, and responsive breakpoints (`sm:`, `lg:`).
- **Transitions & Animations**: Standardized transition classes (`transition-all`, `transition-shadow`) and hover effects.
- **Icons**: Uses Lucide React, with common icons defined for navigation, actions, gamification, health, UI states, communication, and system functions.
- **Shadows**: Specific shadow styles for cards, glows, headers, icon containers, and sidebar.
- **Dark Mode**: Comprehensive dark mode support for all UI elements.

## External Dependencies

- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`, `connect-pg-simple`.
- **UI Components**: Radix UI primitives, `embla-carousel-react`, `cmdk`, `lucide-react`, `framer-motion`.
- **Form & Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Utilities**: `date-fns`, `class-variance-authority`, `clsx`, `tailwind-merge`, `nanoid`.
- **Routing**: `wouter`.
- **Analytics**: Microsoft Clarity.
- **Weather API**: Open-Meteo.
- **ML Prediction API**: External XGBoost diabetes prediction API hosted on Replit (`PREDICTION_API_URL`).