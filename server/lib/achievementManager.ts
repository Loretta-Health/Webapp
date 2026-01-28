import { storage } from "../storage";

export type AchievementEvent = 
  | { type: 'checkin'; streak: number }
  | { type: 'activity_logged'; date: string; steps?: number; stepsGoal?: number; sleepHours?: number; water?: number; waterGoal?: number }
  | { type: 'xp_earned'; totalXp: number }
  | { type: 'medication_taken'; consecutiveDays: number }
  | { type: 'onboarding_complete' }
  | { type: 'profile_complete' }
  | { type: 'questionnaire_complete' }
  | { type: 'water_mission_completed'; missionKey: string; date: string };

interface AchievementRule {
  id: string;
  getProgress: (event: AchievementEvent, currentProgress: number, context?: { lastActivityDate?: string }) => number | null;
}

const activityProgressDates = new Map<string, Map<string, string>>();

function hasAlreadyIncrementedToday(userId: string, achievementId: string, date: string): boolean {
  const userDates = activityProgressDates.get(userId);
  if (!userDates) return false;
  return userDates.get(achievementId) === date;
}

function markIncrementedToday(userId: string, achievementId: string, date: string): void {
  if (!activityProgressDates.has(userId)) {
    activityProgressDates.set(userId, new Map());
  }
  activityProgressDates.get(userId)!.set(achievementId, date);
}

const ACHIEVEMENT_RULES: AchievementRule[] = [
  {
    id: 'daily-dedication', 
    getProgress: (event) => {
      if (event.type === 'checkin') return 1;
      return null;
    }
  },
  {
    id: 'streak-legend',
    getProgress: (event) => {
      if (event.type === 'checkin') return event.streak;
      return null;
    }
  },
  {
    id: 'hydration-champion',
    getProgress: (event, currentProgress) => {
      if (event.type === 'activity_logged' && event.water !== undefined && event.waterGoal !== undefined) {
        if (event.water >= event.waterGoal) {
          return currentProgress + 1;
        }
      }
      if (event.type === 'water_mission_completed') {
        return currentProgress + 1;
      }
      return null;
    }
  },
  {
    id: 'sleep-master',
    getProgress: (event, currentProgress) => {
      if (event.type === 'activity_logged' && event.sleepHours !== undefined) {
        if (event.sleepHours >= 7 && event.sleepHours <= 8) {
          return currentProgress + 1;
        }
      }
      return null;
    }
  },
  {
    id: 'step-champion',
    getProgress: (event, currentProgress) => {
      if (event.type === 'activity_logged' && event.steps !== undefined && event.stepsGoal !== undefined) {
        if (event.steps >= event.stepsGoal) {
          return currentProgress + 1;
        }
      }
      return null;
    }
  },
  {
    id: 'medication-adherence',
    getProgress: (event) => {
      if (event.type === 'medication_taken') return event.consecutiveDays;
      return null;
    }
  },
  {
    id: 'wellness-warrior',
    getProgress: (event) => {
      if (event.type === 'xp_earned') return event.totalXp;
      return null;
    }
  },
];

const ACTIVITY_ACHIEVEMENTS = ['hydration-champion', 'sleep-master', 'step-champion'];
const WATER_MISSION_KEYS = ['water-glasses', 'sip-water'];

export async function processAchievementEvent(
  userId: string, 
  event: AchievementEvent
): Promise<{ achievementsUpdated: string[]; achievementsUnlocked: string[]; totalXpAwarded: number }> {
  await storage.ensureUserHasAllAchievements(userId);
  
  const userAchievements = await storage.getUserAchievements(userId);
  const achievementsUpdated: string[] = [];
  const achievementsUnlocked: string[] = [];
  let totalXpAwarded = 0;

  for (const rule of ACHIEVEMENT_RULES) {
    const userAch = userAchievements.find(a => a.achievementId === rule.id);
    if (!userAch) continue;
    
    if (userAch.unlocked) continue;
    
    const currentProgress = userAch.progress || 0;
    const newProgress = rule.getProgress(event, currentProgress);
    
    if (newProgress !== null && newProgress > currentProgress) {
      // For activity-based achievements, only allow one increment per day
      if (event.type === 'activity_logged' && ACTIVITY_ACHIEVEMENTS.includes(rule.id)) {
        if (hasAlreadyIncrementedToday(userId, rule.id, event.date)) {
          continue;
        }
      }
      
      // For water mission achievements, only allow one increment per day
      if (event.type === 'water_mission_completed' && rule.id === 'hydration-champion') {
        if (hasAlreadyIncrementedToday(userId, rule.id, event.date)) {
          continue;
        }
      }
      
      const result = await storage.updateUserAchievementProgress(userId, rule.id, newProgress);
      
      if (result.updated) {
        achievementsUpdated.push(rule.id);
        
        // Mark as incremented today only after successful update
        if (event.type === 'activity_logged' && ACTIVITY_ACHIEVEMENTS.includes(rule.id)) {
          markIncrementedToday(userId, rule.id, event.date);
        }
        if (event.type === 'water_mission_completed' && rule.id === 'hydration-champion') {
          markIncrementedToday(userId, rule.id, event.date);
        }
        
        if (result.justUnlocked) {
          achievementsUnlocked.push(rule.id);
          totalXpAwarded += result.xpReward;
        }
      }
    }
  }

  return { achievementsUpdated, achievementsUnlocked, totalXpAwarded };
}

export async function processCheckin(userId: string, streak: number) {
  return processAchievementEvent(userId, { type: 'checkin', streak });
}

export async function processActivityLogged(userId: string, date: string, activity: {
  steps?: number;
  stepsGoal?: number;
  sleepHours?: number;
  water?: number;
  waterGoal?: number;
}) {
  return processAchievementEvent(userId, { 
    type: 'activity_logged',
    date,
    ...activity 
  });
}

export async function processXpEarned(userId: string, totalXp: number) {
  return processAchievementEvent(userId, { type: 'xp_earned', totalXp });
}

export async function processMedicationTaken(userId: string, consecutiveDays: number) {
  return processAchievementEvent(userId, { type: 'medication_taken', consecutiveDays });
}

export async function processWaterMissionCompleted(userId: string, missionKey: string) {
  if (!WATER_MISSION_KEYS.includes(missionKey)) {
    return { achievementsUpdated: [], achievementsUnlocked: [], totalXpAwarded: 0 };
  }
  const today = new Date().toISOString().split('T')[0];
  return processAchievementEvent(userId, { 
    type: 'water_mission_completed',
    missionKey,
    date: today
  });
}
