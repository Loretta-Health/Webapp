declare global {
  interface Window {
    clarity: (command: string, ...args: unknown[]) => void;
  }
}

let clarityInitialized = false;

export function initClarity(projectId?: string): void {
  if (clarityInitialized || typeof window === 'undefined') return;
  
  const id = projectId || import.meta.env.VITE_CLARITY_PROJECT_ID;
  
  if (!id || id === 'YOUR_PROJECT_ID') {
    console.warn('Microsoft Clarity: No project ID configured. Set VITE_CLARITY_PROJECT_ID environment variable.');
    return;
  }
  
  (function(c: Window, l: Document, a: string, r: string, i: string) {
    (c as unknown as Record<string, unknown>)[a] = (c as unknown as Record<string, unknown>)[a] || function(...args: unknown[]) {
      ((c as unknown as Record<string, { q: unknown[][] }>)[a].q = (c as unknown as Record<string, { q: unknown[][] }>)[a].q || []).push(args);
    };
    const t = l.createElement(r) as HTMLScriptElement;
    t.async = true;
    t.src = "https://www.clarity.ms/tag/" + i;
    const y = l.getElementsByTagName(r)[0];
    y.parentNode?.insertBefore(t, y);
  })(window, document, "clarity", "script", id);
  
  clarityInitialized = true;
  console.log('Microsoft Clarity initialized');
}

export const ClarityEvents = {
  PAGE_VIEW: 'page_view',
  MISSION_STARTED: 'mission_started',
  MISSION_COMPLETED: 'mission_completed',
  MISSION_ABANDONED: 'mission_abandoned',
  MEDICATION_ADDED: 'medication_added',
  MEDICATION_LOGGED: 'medication_logged',
  MEDICATION_SKIPPED: 'medication_skipped',
  MEDICATION_DELETED: 'medication_deleted',
  DAILY_CHECKIN_COMPLETED: 'daily_checkin_completed',
  EMOTIONAL_CHECKIN_COMPLETED: 'emotional_checkin_completed',
  AI_CHAT_OPENED: 'ai_chat_opened',
  AI_CHAT_MESSAGE_SENT: 'ai_chat_message_sent',
  ACTIVITY_LOGGED: 'activity_logged',
  PROFILE_UPDATED: 'profile_updated',
  QUESTIONNAIRE_STARTED: 'questionnaire_started',
  QUESTIONNAIRE_COMPLETED: 'questionnaire_completed',
  QUESTIONNAIRE_STEP_COMPLETED: 'questionnaire_step_completed',
  LEADERBOARD_VIEWED: 'leaderboard_viewed',
  LEADERBOARD_TAB_CHANGED: 'leaderboard_tab_changed',
  FRIEND_INVITED: 'friend_invited',
  FRIEND_ADDED: 'friend_added',
  STREAK_VIEWED: 'streak_viewed',
  CALENDAR_VIEWED: 'calendar_viewed',
  RISK_SCORE_VIEWED: 'risk_score_viewed',
  ACHIEVEMENT_EARNED: 'achievement_earned',
  XP_EARNED: 'xp_earned',
  LEVEL_UP: 'level_up',
  BUTTON_CLICKED: 'button_clicked',
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
  NAVIGATION: 'navigation',
  ERROR_OCCURRED: 'error_occurred',
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  CONSENT_ACCEPTED: 'consent_accepted',
  CONSENT_DECLINED: 'consent_declined',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
} as const;

export type ClarityEventName = typeof ClarityEvents[keyof typeof ClarityEvents];

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(eventName: ClarityEventName | string, properties?: EventProperties): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('event', eventName);
    
    if (properties) {
      Object.entries(properties).forEach(([key, value]) => {
        if (value !== undefined) {
          window.clarity('set', `${eventName}_${key}`, String(value));
        }
      });
    }
  }
}

export function setUserProperties(properties: EventProperties): void {
  if (typeof window !== 'undefined' && window.clarity) {
    Object.entries(properties).forEach(([key, value]) => {
      if (value !== undefined) {
        window.clarity('set', key, String(value));
      }
    });
  }
}

export function identifyUser(userId: string, properties?: EventProperties): void {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('identify', userId);
    
    if (properties) {
      setUserProperties(properties);
    }
  }
}

export function trackPageView(pageName: string, properties?: EventProperties): void {
  trackEvent(ClarityEvents.PAGE_VIEW, {
    page: pageName,
    ...properties,
  });
}

export function trackButtonClick(buttonName: string, location?: string, properties?: EventProperties): void {
  trackEvent(ClarityEvents.BUTTON_CLICKED, {
    button: buttonName,
    location: location || 'unknown',
    ...properties,
  });
}

export function trackNavigation(from: string, to: string): void {
  trackEvent(ClarityEvents.NAVIGATION, {
    from,
    to,
  });
}

export function trackMission(action: 'started' | 'completed' | 'abandoned', missionName: string, xpEarned?: number): void {
  const eventMap = {
    started: ClarityEvents.MISSION_STARTED,
    completed: ClarityEvents.MISSION_COMPLETED,
    abandoned: ClarityEvents.MISSION_ABANDONED,
  };
  
  trackEvent(eventMap[action], {
    mission: missionName,
    xp: xpEarned,
  });
}

export function trackMedication(action: 'added' | 'logged' | 'skipped' | 'deleted', medicationName?: string): void {
  const eventMap = {
    added: ClarityEvents.MEDICATION_ADDED,
    logged: ClarityEvents.MEDICATION_LOGGED,
    skipped: ClarityEvents.MEDICATION_SKIPPED,
    deleted: ClarityEvents.MEDICATION_DELETED,
  };
  
  trackEvent(eventMap[action], {
    medication: medicationName,
  });
}

export function trackCheckin(type: 'daily' | 'emotional', properties?: EventProperties): void {
  const event = type === 'daily' 
    ? ClarityEvents.DAILY_CHECKIN_COMPLETED 
    : ClarityEvents.EMOTIONAL_CHECKIN_COMPLETED;
  
  trackEvent(event, properties);
}

export function trackAIChat(action: 'opened' | 'message_sent', properties?: EventProperties): void {
  const event = action === 'opened' 
    ? ClarityEvents.AI_CHAT_OPENED 
    : ClarityEvents.AI_CHAT_MESSAGE_SENT;
  
  trackEvent(event, properties);
}

export function trackActivity(activityType: string, value?: number): void {
  trackEvent(ClarityEvents.ACTIVITY_LOGGED, {
    activity: activityType,
    value,
  });
}

export function trackQuestionnaire(action: 'started' | 'step_completed' | 'completed', step?: number, totalSteps?: number): void {
  const eventMap = {
    started: ClarityEvents.QUESTIONNAIRE_STARTED,
    step_completed: ClarityEvents.QUESTIONNAIRE_STEP_COMPLETED,
    completed: ClarityEvents.QUESTIONNAIRE_COMPLETED,
  };
  
  trackEvent(eventMap[action], {
    step,
    totalSteps,
    progress: step && totalSteps ? Math.round((step / totalSteps) * 100) : undefined,
  });
}

export function trackGamification(action: 'xp_earned' | 'level_up' | 'achievement_earned', properties?: EventProperties): void {
  const eventMap = {
    xp_earned: ClarityEvents.XP_EARNED,
    level_up: ClarityEvents.LEVEL_UP,
    achievement_earned: ClarityEvents.ACHIEVEMENT_EARNED,
  };
  
  trackEvent(eventMap[action], properties);
}

export function trackModal(action: 'opened' | 'closed', modalName: string): void {
  const event = action === 'opened' ? ClarityEvents.MODAL_OPENED : ClarityEvents.MODAL_CLOSED;
  trackEvent(event, { modal: modalName });
}

export function trackOnboarding(action: 'started' | 'step_completed' | 'completed', step?: number): void {
  const eventMap = {
    started: ClarityEvents.ONBOARDING_STARTED,
    step_completed: ClarityEvents.ONBOARDING_STEP_COMPLETED,
    completed: ClarityEvents.ONBOARDING_COMPLETED,
  };
  
  trackEvent(eventMap[action], { step });
}

export function trackAuth(action: 'login' | 'logout' | 'signup'): void {
  const eventMap = {
    login: ClarityEvents.LOGIN,
    logout: ClarityEvents.LOGOUT,
    signup: ClarityEvents.SIGNUP,
  };
  
  trackEvent(eventMap[action]);
}

export function trackError(errorType: string, errorMessage?: string, location?: string): void {
  trackEvent(ClarityEvents.ERROR_OCCURRED, {
    type: errorType,
    message: errorMessage,
    location,
  });
}
