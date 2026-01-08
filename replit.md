# Loretta - Gamified Health Dashboard

## Overview
Loretta is a gamified health tracking dashboard inspired by Duolingo, designed to motivate users in managing their health through engaging game mechanics like XP, levels, streaks, and achievements. It supports daily check-ins, medication tracking, and activity monitoring. The application prioritizes user privacy, offering optional data sharing, personalized health insights, and community comparison features. Loretta aims to transform health management into an interactive and motivating experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## Default UI Style Guide (MyDashboard Reference)

All UI components should follow the glass-morphism design system established in MyDashboard. This is the authoritative style reference.

### Brand Colors
- **Primary Blue**: `#013DC4` (main brand color)
- **Secondary Blue**: `#0150FF` (gradient midpoint)
- **Tertiary Blue**: `#4B7BE5` (light gradient end)
- **Lavender**: `#CDB6EF` (accent/secondary brand color)
- **Purple accent**: `purple-400` (Tailwind, for lavender gradients)

### Page Backgrounds
- **Light mode**: `bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF]`
- **Dark mode**: `dark:from-gray-900 dark:via-gray-900 dark:to-gray-800`
- **Loading state**: Same gradient with centered Loader2 spinner in `text-[#013DC4]`

### GlassCard Component (Primary Container)
```tsx
<div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl">
```
- Optional glow effect: `shadow-[#013DC4]/20`
- Hover state for clickable cards: `hover:shadow-xl transition-shadow cursor-pointer`

### Icon Containers
- **Standard size**: `w-10 h-10 rounded-xl` (desktop), `w-6 h-6 rounded-lg` (mobile)
- **Large size**: `w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl`
- **Gradient backgrounds**:
  - Primary: `bg-gradient-to-br from-[#013DC4] to-[#0150FF]`
  - Lavender: `bg-gradient-to-br from-[#CDB6EF] to-purple-400`
  - Streak/Fire: `bg-gradient-to-br from-orange-400 to-red-400`
  - Trophy/Gold: `bg-gradient-to-br from-amber-400 to-orange-400`
  - Success: `bg-gradient-to-br from-green-400 to-emerald-500`
  - Neutral: `bg-gradient-to-br from-gray-400 to-gray-500`
- Always include: `flex items-center justify-center shadow-lg text-white`

### Typography
- **Page titles**: `text-lg sm:text-2xl lg:text-3xl font-black text-white` (on gradient hero)
- **Section headers**: `font-bold text-gray-900 dark:text-white text-base sm:text-lg`
- **Category headers**: `text-xs font-black text-gray-500 uppercase tracking-wider`
- **Body text**: `text-gray-700 dark:text-gray-300 font-medium`
- **Muted text**: `text-gray-500 font-medium`
- **Small labels**: `text-[8px] sm:text-xs text-gray-500 font-medium`
- **Large numbers**: `text-xs sm:text-xl font-black text-gray-900 dark:text-white`

### Gradient Text
```tsx
<div className="bg-gradient-to-r from-[#013DC4] to-[#0150FF] bg-clip-text text-transparent font-black">
```

### Progress Bars
```tsx
<div className="h-3 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner">
  <div className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg" style={{ width: `${percent}%` }} />
</div>
```

### Buttons
- **Primary gradient**: `bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF]`
- **Touch targets**: Minimum `min-w-[44px] min-h-[44px]` for accessibility
- **Hover states**: `hover:bg-white/50 dark:hover:bg-gray-800/50` or `hover:shadow-lg`
- **Navigation buttons**: `p-3.5 rounded-2xl transition-all`
- **Active state**: `bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10`

### Badges/Pills
- **XP badge**: `px-3 py-1 bg-gradient-to-r from-[#CDB6EF]/20 to-purple-100 text-purple-600 text-xs font-bold rounded-full`
- **Level badge**: `px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white`
- **Count badge**: `px-3 py-1 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white text-xs font-bold rounded-full shadow-lg`
- **Success badge**: `px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold rounded-full shadow-lg`
- **Streak badge**: `px-3 py-1.5 bg-gradient-to-r from-orange-400 to-red-400 rounded-full shadow-lg` with white text

### Hero Banner (Welcome Section)
```tsx
<div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-3 sm:p-4 lg:p-5 bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] shadow-xl shadow-[#013DC4]/20">
  <div className="absolute top-0 right-0 w-24 sm:w-48 h-24 sm:h-48 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
  <!-- content with relative z-10 -->
</div>
```

### Collapsible Sections
- Header padding: `p-4 sm:p-5` with `min-h-[60px]`
- Chevron container: `w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 dark:bg-gray-800`
- Content padding: `px-4 pb-4 sm:px-5 sm:pb-5`
- Optional gradient header: `bg-gradient-to-r from-[#013DC4]/5 to-[#CDB6EF]/10`

### Stat Cards (Grid of 4)
```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-3">
  <GlassCard className="p-2 sm:p-4 flex items-center gap-1.5 sm:gap-3">
    <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg flex-shrink-0">
      <Icon className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
    </div>
    <div className="min-w-0 flex-1 overflow-hidden">
      <div className="text-xs sm:text-xl font-black text-gray-900 dark:text-white truncate">{value}</div>
      <div className="text-[8px] sm:text-xs text-gray-500 font-medium truncate">{label}</div>
    </div>
  </GlassCard>
</div>
```

### Form Inputs (Select)
```tsx
<select className="w-full appearance-none bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10 border border-[#013DC4]/20 rounded-2xl px-4 py-3 pr-10 font-semibold text-[#013DC4] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#013DC4]/30 cursor-pointer">
```

### Sidebar
- Background: `bg-gradient-to-b from-white/90 to-white/70 dark:from-gray-900/90 dark:to-gray-900/70 backdrop-blur-2xl`
- Border: `border-r border-white/50 dark:border-white/10`
- Shadow: `shadow-2xl shadow-[#013DC4]/5`
- Width: `w-80 lg:w-[340px]`

### Overlay/Backdrop
- Modal backdrop: `bg-black/30 backdrop-blur-sm`

### Spacing Conventions
- Page padding: `p-3 sm:p-5 lg:p-8`
- Section spacing: `space-y-4 sm:space-y-5 lg:space-y-7`
- Card padding: `p-4` or `p-4 sm:p-5`
- Gap between items: `gap-2`, `gap-3`, or `gap-4`

### Responsive Breakpoints
- Mobile-first design
- `sm:` for tablets (640px+)
- `lg:` for desktop (1024px+)
- Always use responsive text: `text-xs sm:text-xl`, `text-[8px] sm:text-xs`

### Transitions & Animations
- Standard: `transition-all`, `transition-colors`, `transition-shadow`, `transition-transform`
- Duration: Default or `duration-500 ease-out` for sidebar
- Hover scale: `group-hover:scale-110`
- Rotate for chevrons: `rotate-180`

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
- **Questionnaire**: 44 questions across various health categories, mapped to NHANES-style API parameters.
- **ML Integration**: Connected to external XGBoost diabetes prediction API (RDP001 model) hosted on Replit.
  - **API URL**: Configured via `PREDICTION_API_URL` environment variable (default: `https://loretta-predict.replit.app`)
  - **Authentication**: API key stored in `ML_API_KEY` secret, sent via `X-API-Key` header
  - **Feature Mapping**: `server/lib/nhanesMapping.ts` converts questionnaire answers to NHANES feature format
  - **No Fallback**: Risk score comes PURELY from the ML API. If the API is unavailable or insufficient features are provided, the risk score is not updated (no artificial risk calculation).
- **Single Health Risk Score**: The application uses ONE health risk score powered by the diabetes ML model (RDP001). Heart and stroke risk calculations have been deprecated - only the overall diabetes-based risk score is used.
- **Score Semantics**: Higher score = higher risk (0 = healthy, 100 = high risk). The ML model returns a diabetes probability which is converted to a 0-100 risk score (rounded to whole number).
- **Data Sync**: Bidirectional synchronization between profile and questionnaire for shared fields (age, height, weight, ethnicity). Changes to either automatically update the other.
- **Auto-Recalculation**: Risk score automatically recalculates when profile health data or questionnaire answers are updated via the ML API only.

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

### Analytics (Microsoft Clarity)
- **Integration**: Microsoft Clarity for user behavior analytics, heatmaps, and session recordings.
- **Configuration**: Set `VITE_CLARITY_PROJECT_ID` environment variable with your Clarity project ID.
- **Initialization**: Clarity loads automatically on app start via `client/src/main.tsx`.
- **Tracking Library**: Custom tracking utilities in `client/src/lib/clarity.ts` with typed event names.
- **Tracked Events**:
  - **Authentication**: Login, logout, signup
  - **Medications**: Added, logged, skipped, deleted
  - **Missions**: Started, completed, abandoned
  - **Check-ins**: Daily and emotional check-ins completed
  - **AI Chat**: Chat opened, messages sent
  - **Questionnaire**: Started, step completed, completed
  - **Navigation**: Page views, leaderboard views
  - **Gamification**: XP earned, level up, achievements
- **React Hook**: `useClarity` hook in `client/src/hooks/useClarity.ts` for easy integration.
- **Privacy**: User identification via Clarity's `identify` function after login.

## External Dependencies

- **Database**: `@neondatabase/serverless`, `drizzle-orm`, `drizzle-zod`, `connect-pg-simple`.
- **UI Components**: Radix UI primitives, `embla-carousel-react`, `cmdk`, `lucide-react`, `framer-motion`.
- **Form & Validation**: `react-hook-form`, `@hookform/resolvers`, `zod`.
- **Utilities**: `date-fns`, `class-variance-authority`, `clsx`, `tailwind-merge`, `nanoid`.
- **Development Tools**: `@replit/vite-plugin-*`, `tsx`, `esbuild`.
- **Routing**: `wouter`.
- **Analytics**: Microsoft Clarity (via custom integration).