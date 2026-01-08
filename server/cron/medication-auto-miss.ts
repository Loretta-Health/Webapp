import cron from 'node-cron';
import { storage } from '../storage';

export function startMedicationAutoMissCron() {
  console.log('[Cron] Starting medication auto-miss scheduler');
  
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running midnight auto-miss job at', new Date().toISOString());
    await markMissedDosesForYesterday();
  });
  
  console.log('[Cron] Medication auto-miss cron job scheduled for midnight daily');
}

export async function markMissedDosesForYesterday() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    console.log(`[Cron] Checking for missed doses on ${yesterdayStr}`);
    
    const allMedications = await storage.getAllMedications();
    let totalMissed = 0;
    
    for (const med of allMedications) {
      if (!med.isActive) continue;
      
      const frequency = med.frequency;
      if (frequency === 'as-needed') continue;
      
      const scheduledTimes = (med.scheduledTimes as string[]) || [];
      const dosesPerDay = med.dosesPerDay || scheduledTimes.length || 1;
      
      if (frequency === 'weekly') {
        const dayOfWeek = yesterday.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const weeklyDoses = scheduledTimes.filter(schedule => {
          const parts = schedule.split(':');
          return parts[0].toLowerCase() === dayOfWeek;
        });
        
        for (let doseNum = 1; doseNum <= weeklyDoses.length; doseNum++) {
          const missed = await markDoseAsMissedIfNotLogged(
            med.id,
            med.userId,
            yesterdayStr,
            doseNum
          );
          if (missed) totalMissed++;
        }
      } else {
        for (let doseNum = 1; doseNum <= dosesPerDay; doseNum++) {
          const missed = await markDoseAsMissedIfNotLogged(
            med.id,
            med.userId,
            yesterdayStr,
            doseNum
          );
          if (missed) totalMissed++;
        }
      }
    }
    
    console.log(`[Cron] Auto-missed ${totalMissed} doses for ${yesterdayStr}`);
    return totalMissed;
  } catch (error) {
    console.error('[Cron] Error in auto-miss job:', error);
    return 0;
  }
}

async function markDoseAsMissedIfNotLogged(
  medicationId: string,
  userId: string,
  date: string,
  doseNumber: number
): Promise<boolean> {
  try {
    const existingLog = await storage.getMedicationLogForDose(medicationId, date, doseNumber);
    
    if (existingLog) {
      return false;
    }
    
    await storage.logMedicationDose({
      medicationId,
      userId,
      doseNumber,
      scheduledDate: date,
      status: 'missed',
      source: 'auto',
      xpAwarded: 0,
    } as any);
    
    console.log(`[Cron] Auto-marked dose ${doseNumber} as missed for medication ${medicationId} on ${date}`);
    return true;
  } catch (error) {
    console.error(`[Cron] Error marking dose as missed:`, error);
    return false;
  }
}
