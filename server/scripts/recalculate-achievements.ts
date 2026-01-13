import { db } from '../db';
import { users, userGamification, userActivities, userPreferences } from '../../shared/schema';
import { storage } from '../storage';
import { processCheckin, processActivityLogged, processXpEarned, processMedicationTaken } from '../lib/achievementManager';
import { eq, desc } from 'drizzle-orm';

async function recalculateAllAchievements() {
  console.log('='.repeat(60));
  console.log('Starting achievement recalculation for all users...');
  console.log('='.repeat(60));
  
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users to process`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const user of allUsers) {
    console.log(`\nProcessing user: ${user.username} (${user.id})`);
    
    try {
      await storage.ensureUserHasAllAchievements(user.id);
      
      const [gamification] = await db.select().from(userGamification).where(
        eq(userGamification.userId, user.id)
      );
      
      if (gamification) {
        if (gamification.currentStreak && gamification.currentStreak > 0) {
          console.log(`  - Streak: ${gamification.currentStreak} days`);
          await processCheckin(user.id, gamification.currentStreak);
        }
        
        if (gamification.totalXp && gamification.totalXp > 0) {
          console.log(`  - Total XP: ${gamification.totalXp}`);
          await processXpEarned(user.id, gamification.totalXp);
        }
      }
      
      const medicationStreak = await storage.getUserMedicationStreak(user.id);
      if (medicationStreak > 0) {
        console.log(`  - Medication streak: ${medicationStreak} days`);
        await processMedicationTaken(user.id, medicationStreak);
      }
      
      const [prefs] = await db.select().from(userPreferences).where(
        eq(userPreferences.userId, user.id)
      );
      const stepsGoal = prefs?.stepsGoal || 8000;
      const waterGoal = prefs?.waterGoal || 8;
      
      const allActivities = await db.select().from(userActivities)
        .where(eq(userActivities.userId, user.id))
        .orderBy(desc(userActivities.date));
      
      let hydrationDays = 0;
      let sleepDays = 0;
      let stepDays = 0;
      const processedDates = new Set<string>();
      
      for (const activity of allActivities) {
        const dateStr = activity.date;
        if (processedDates.has(dateStr)) continue;
        processedDates.add(dateStr);
        
        if (activity.water && activity.water >= waterGoal) {
          hydrationDays++;
        }
        if (activity.sleepHours && activity.sleepHours >= 7 && activity.sleepHours <= 8) {
          sleepDays++;
        }
        if (activity.steps && activity.steps >= stepsGoal) {
          stepDays++;
        }
      }
      
      console.log(`  - Activity days: hydration=${hydrationDays}, sleep=${sleepDays}, steps=${stepDays}`);
      
      const currentAchievements = await storage.getUserAchievements(user.id);
      
      const updateProgress = async (achievementId: string, progress: number) => {
        const ach = currentAchievements.find(a => a.achievementId === achievementId);
        if (ach && !ach.unlocked && progress > (ach.progress || 0)) {
          await storage.updateUserAchievementProgress(user.id, achievementId, progress);
          console.log(`    - Updated ${achievementId}: ${ach.progress || 0} -> ${progress}`);
        }
      };
      
      await updateProgress('hydration-champion', hydrationDays);
      await updateProgress('sleep-master', sleepDays);
      await updateProgress('step-champion', stepDays);
      
      successCount++;
      console.log(`  - SUCCESS: Achievements recalculated`);
      
    } catch (error) {
      console.error(`  - ERROR: ${error}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('Achievement recalculation complete!');
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log('='.repeat(60));
}

recalculateAllAchievements()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
