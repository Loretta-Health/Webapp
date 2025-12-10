export const XP_REWARDS = {
  ONBOARDING: {
    CONSENT_COMPLETED: 10,
    PROFILE_COMPLETED: 25,
    QUESTIONNAIRE_COMPLETED: 50,
    FIRST_CHECKIN: 15,
  },
  DAILY: {
    STREAK_UPDATE: 10,
    EMOTIONAL_CHECKIN: 10,
  },
  MISSIONS: {
    DEFAULT: 50,
  },
  ACHIEVEMENTS: {
    COMMON: 50,
    RARE: 200,
    EPIC: 400,
    LEGENDARY: 1000,
  },
} as const;

export const LEVEL_CONFIG = {
  BASE_XP_PER_LEVEL: 100,
  LEVEL_OFFSET: 200,
} as const;

export function calculateLevelFromXP(xp: number): number {
  return Math.floor(xp / LEVEL_CONFIG.BASE_XP_PER_LEVEL) + 1;
}

export function getXPForLevel(level: number): number {
  return (level - 1) * LEVEL_CONFIG.BASE_XP_PER_LEVEL;
}

export function getXPForNextLevel(currentLevel: number): number {
  return currentLevel * LEVEL_CONFIG.BASE_XP_PER_LEVEL + LEVEL_CONFIG.LEVEL_OFFSET;
}

export function getXPProgressInCurrentLevel(xp: number): { current: number; needed: number; percent: number } {
  const level = calculateLevelFromXP(xp);
  const xpForCurrentLevel = getXPForLevel(level);
  const xpForNextLevel = getXPForNextLevel(level);
  const current = xp - xpForCurrentLevel;
  const needed = xpForNextLevel - xpForCurrentLevel;
  const percent = Math.min(100, Math.round((current / needed) * 100));
  
  return { current, needed, percent };
}

export function didLevelUp(oldXP: number, newXP: number): boolean {
  return calculateLevelFromXP(newXP) > calculateLevelFromXP(oldXP);
}

export function getNewLevel(xp: number): number {
  return calculateLevelFromXP(xp);
}

export type XPRewardType = 
  | 'consent_completed'
  | 'profile_completed'
  | 'questionnaire_completed'
  | 'first_checkin'
  | 'streak_update'
  | 'emotional_checkin'
  | 'mission_completed'
  | 'achievement_unlocked';

export function getXPRewardAmount(type: XPRewardType, metadata?: { rarity?: string; xpReward?: number }): number {
  switch (type) {
    case 'consent_completed':
      return XP_REWARDS.ONBOARDING.CONSENT_COMPLETED;
    case 'profile_completed':
      return XP_REWARDS.ONBOARDING.PROFILE_COMPLETED;
    case 'questionnaire_completed':
      return XP_REWARDS.ONBOARDING.QUESTIONNAIRE_COMPLETED;
    case 'first_checkin':
      return XP_REWARDS.ONBOARDING.FIRST_CHECKIN;
    case 'streak_update':
      return XP_REWARDS.DAILY.STREAK_UPDATE;
    case 'emotional_checkin':
      return XP_REWARDS.DAILY.EMOTIONAL_CHECKIN;
    case 'mission_completed':
      return metadata?.xpReward ?? XP_REWARDS.MISSIONS.DEFAULT;
    case 'achievement_unlocked':
      if (metadata?.xpReward) return metadata.xpReward;
      switch (metadata?.rarity) {
        case 'legendary': return XP_REWARDS.ACHIEVEMENTS.LEGENDARY;
        case 'epic': return XP_REWARDS.ACHIEVEMENTS.EPIC;
        case 'rare': return XP_REWARDS.ACHIEVEMENTS.RARE;
        default: return XP_REWARDS.ACHIEVEMENTS.COMMON;
      }
    default:
      return 0;
  }
}
