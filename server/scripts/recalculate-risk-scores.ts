import { db } from '../db';
import { users, questionnaireAnswers, userProfiles, riskScores } from '../../shared/schema';
import { convertQuestionnaireToMLFeatures, type MLFeature } from '../lib/nhanesMapping';
import { eq } from 'drizzle-orm';

const PREDICTION_API_BASE_URL = process.env.PREDICTION_API_URL || 'https://loretta-predict.replit.app';
const ML_API_KEY = process.env.ML_API_KEY;

async function callMLPredictionAPI(features: MLFeature[]): Promise<{ diabetes_probability: number; risk_level: string } | null> {
  if (!ML_API_KEY) {
    console.warn('[ML API] No ML_API_KEY configured, skipping ML prediction');
    return null;
  }
  
  const predictUrl = `${PREDICTION_API_BASE_URL}/predict`;
  
  const response = await fetch(predictUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ML_API_KEY,
    },
    body: JSON.stringify({ features }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ML API] Error:', response.status, errorText);
    throw new Error(`ML API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result;
}

async function recalculateAllRiskScores() {
  console.log('='.repeat(60));
  console.log('Starting risk score recalculation for all users...');
  console.log('='.repeat(60));
  
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users to process`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const user of allUsers) {
    console.log(`\nProcessing user: ${user.username} (${user.id})`);
    
    try {
      const answers = await db.select().from(questionnaireAnswers).where(
        eq(questionnaireAnswers.userId, user.id)
      );
      const [profile] = await db.select().from(userProfiles).where(
        eq(userProfiles.userId, user.id)
      );
      
      const allAnswers: Record<string, any> = {};
      answers.forEach(a => {
        if (a.answers && typeof a.answers === 'object') {
          Object.assign(allAnswers, a.answers);
        }
      });
      
      if (profile) {
        if (profile.age && !allAnswers.age) allAnswers.age = profile.age;
        if (profile.height && !allAnswers.height) allAnswers.height = profile.height;
        if (profile.weight && !allAnswers.weight_current) allAnswers.weight_current = profile.weight;
      }
      
      const mlFeatures = convertQuestionnaireToMLFeatures(allAnswers);
      console.log(`  - Converted ${Object.keys(allAnswers).length} answers to ${mlFeatures.length} ML features`);
      
      if (mlFeatures.length < 5) {
        console.log(`  - SKIPPED: Not enough features (${mlFeatures.length} < 5)`);
        skipCount++;
        continue;
      }
      
      const mlResult = await callMLPredictionAPI(mlFeatures);
      
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
  console.log('Risk score recalculation complete!');
  console.log(`  Success: ${successCount}`);
  console.log(`  Skipped: ${skipCount}`);
  console.log(`  Errors:  ${errorCount}`);
  console.log('='.repeat(60));
}

recalculateAllRiskScores()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
