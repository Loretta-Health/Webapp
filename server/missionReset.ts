import { db } from './db';
import { userMissions, userPreferences } from '../shared/schema';
import { eq } from 'drizzle-orm';

function formatDateInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getWeekNumberInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value || '2024';
  const month = parts.find(p => p.type === 'month')?.value || '01';
  const day = parseInt(parts.find(p => p.type === 'day')?.value || '1');
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';
  
  const days: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dayOfWeek = days[weekday] || 1;
  
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayDay = day - daysFromMonday;
  
  return `${year}-W${month}-${mondayDay}`;
}

function shouldResetDaily(lastResetAt: Date | null, timezone: string): boolean {
  if (!lastResetAt) return true;
  
  const todayStr = formatDateInTimezone(new Date(), timezone);
  const lastResetStr = formatDateInTimezone(lastResetAt, timezone);
  
  return todayStr !== lastResetStr;
}

function shouldResetWeekly(lastResetAt: Date | null, timezone: string): boolean {
  if (!lastResetAt) return true;
  
  const thisWeekStr = getWeekNumberInTimezone(new Date(), timezone);
  const lastResetWeekStr = getWeekNumberInTimezone(lastResetAt, timezone);
  
  return thisWeekStr !== lastResetWeekStr;
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
