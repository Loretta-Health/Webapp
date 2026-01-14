import { db } from './db';
import { userMissions, userPreferences } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

function getUserLocalDate(timezone: string): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')?.value || '2024');
  const month = parseInt(parts.find(p => p.type === 'month')?.value || '1') - 1;
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
  return new Date(year, month, day, 0, 0, 0, 0);
}

function getUserLocalDayOfWeek(timezone: string): number {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
  });
  const dayName = formatter.format(now);
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return days[dayName] || 0;
}

function getStartOfWeek(date: Date, timezone: string): Date {
  const dayOfWeek = getUserLocalDayOfWeek(timezone);
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(date);
  startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

function shouldResetDaily(lastResetAt: Date | null, timezone: string): boolean {
  if (!lastResetAt) return true;
  
  const todayStart = getUserLocalDate(timezone);
  const lastResetDate = new Date(lastResetAt);
  lastResetDate.setHours(0, 0, 0, 0);
  
  return todayStart.getTime() > lastResetDate.getTime();
}

function shouldResetWeekly(lastResetAt: Date | null, timezone: string): boolean {
  if (!lastResetAt) return true;
  
  const todayStart = getUserLocalDate(timezone);
  const thisWeekStart = getStartOfWeek(todayStart, timezone);
  const lastResetDate = new Date(lastResetAt);
  
  return thisWeekStart.getTime() > lastResetDate.getTime();
}

export async function resetMissionsForUser(userId: string): Promise<void> {
  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  const timezone = prefs?.timezone || 'UTC';
  
  const missions = await db.select().from(userMissions).where(eq(userMissions.userId, userId));
  
  for (const mission of missions) {
    let shouldReset = false;
    
    if (mission.category === 'daily') {
      shouldReset = shouldResetDaily(mission.lastResetAt, timezone);
    } else if (mission.category === 'weekly') {
      shouldReset = shouldResetWeekly(mission.lastResetAt, timezone);
    }
    
    if (shouldReset && ((mission.progress || 0) > 0 || mission.completed)) {
      await db.update(userMissions)
        .set({
          progress: 0,
          completed: false,
          completedAt: null,
          lastResetAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userMissions.id, mission.id));
      
      console.log(`[MissionReset] Reset ${mission.category} mission "${mission.title}" for user ${userId}`);
    } else if (shouldReset && !mission.lastResetAt) {
      await db.update(userMissions)
        .set({
          lastResetAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(userMissions.id, mission.id));
    }
  }
}

export async function getUserTimezone(userId: string): Promise<string> {
  const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
  return prefs?.timezone || 'UTC';
}
