import { db } from '../db';
import { users, questionnaireAnswers, riskScores } from '../../shared/schema';
import { gatherFullFeatureSet, callMLPredictionAPI } from '../lib/riskCalculation';
import { convertQuestionnaireToMLFeatures } from '../lib/nhanesMapping';
import { eq } from 'drizzle-orm';

const VALIDATION_LIMITS: Record<string, { min: number; max: number }> = {
  age: { min: 18, max: 120 },
  weight_current: { min: 20, max: 500 },
  height: { min: 50, max: 275 },
  weight_year_ago: { min: 20, max: 500 },
  moderate_activity: { min: 0, max: 40 },
  sedentary_hours: { min: 0, max: 24 },
  weekday_sleep: { min: 0, max: 24 },
  weekend_sleep: { min: 0, max: 24 },
  household_size: { min: 1, max: 20 },
  household_rooms: { min: 1, max: 50 },
};

function isValueOutOfRange(questionId: string, value: string): boolean {
  const limits = VALIDATION_LIMITS[questionId];
  if (!limits) return false;
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return false;
  
  return numValue < limits.min || numValue > limits.max;
}

async function cleanInvalidAnswersAndRecalculate() {
  console.log('='.repeat(60));
  console.log('Cleaning invalid answers and recalculating risk scores...');
  console.log('='.repeat(60));
  
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users to process`);
  
  let totalInvalidRemoved = 0;
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const user of allUsers) {
    console.log(`\nProcessing user: ${user.username} (${user.id})`);
    
    try {
      const answerRecords = await db.select().from(questionnaireAnswers).where(
        eq(questionnaireAnswers.userId, user.id)
      );
      
      let userInvalidCount = 0;
      
      for (const record of answerRecords) {
        if (!record.answers || typeof record.answers !== 'object') continue;
        
        const answers = record.answers as Record<string, string>;
        const cleanedAnswers: Record<string, string> = {};
        const removedKeys: string[] = [];
        
        for (const [questionId, value] of Object.entries(answers)) {
          if (isValueOutOfRange(questionId, value)) {
            removedKeys.push(`${questionId}=${value}`);
            userInvalidCount++;
          } else {
            cleanedAnswers[questionId] = value;
          }
        }
        
        if (removedKeys.length > 0) {
          console.log(`  - Removed invalid answers: ${removedKeys.join(', ')}`);
          
          await db.update(questionnaireAnswers)
            .set({ answers: cleanedAnswers, updatedAt: new Date() })
            .where(eq(questionnaireAnswers.id, record.id));
        }
      }
      
      totalInvalidRemoved += userInvalidCount;
      
      const allAnswers = await gatherFullFeatureSet(user.id);
      const mlFeatures = convertQuestionnaireToMLFeatures(allAnswers);
      
      console.log(`  - Answer keys: ${Object.keys(allAnswers).join(', ')}`);
      console.log(`  - Converted ${Object.keys(allAnswers).length} answers to ${mlFeatures.length} ML features`);
      
      if (mlFeatures.length < 5) {
        console.log(`  - SKIPPED: Not enough features (${mlFeatures.length} < 5)`);
        skipCount++;
        continue;
      }
      
      const mlResult = await callMLPredictionAPI(mlFeatures, user.username);
      
      if (!mlResult || typeof mlResult.diabetes_probability !== 'number') {
        console.log(`  - SKIPPED: ML API returned no result`);
        skipCount++;
        continue;
      }
      
      const riskValue = Math.round(mlResult.diabetes_probability * 100);
      
      console.log(`  - ML probability: ${mlResult.diabetes_probability}`);
      console.log(`  - Risk score (rounded): ${riskValue}`);
      
      const [existingScore] = await db.select().from(riskScores).where(
        eq(riskScores.userId, user.id)
      );
      
      if (existingScore) {
        console.log(`  - Previous score: ${existingScore.overallScore}`);
        
        await db.update(riskScores)
          .set({
            overallScore: riskValue,
            diabetesRisk: riskValue,
            heartRisk: 0,
            strokeRisk: 0,
            calculatedAt: new Date(),
          })
          .where(eq(riskScores.userId, user.id));
        
        console.log(`  - UPDATED: ${existingScore.overallScore} -> ${riskValue}`);
      } else {
        await db.insert(riskScores).values({
          userId: user.id,
          overallScore: riskValue,
          diabetesRisk: riskValue,
          heartRisk: 0,
          strokeRisk: 0,
        });
        
        console.log(`  - CREATED: New score ${riskValue}`);
      }
      
      successCount++;
      
    } catch (error) {
      console.error(`  - ERROR: ${error}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Total invalid answers removed: ${totalInvalidRemoved}`);
  console.log(`Users processed successfully: ${successCount}`);
  console.log(`Users skipped (not enough data): ${skipCount}`);
  console.log(`Users with errors: ${errorCount}`);
  console.log('='.repeat(60));
}

cleanInvalidAnswersAndRecalculate()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
