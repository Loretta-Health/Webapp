import { db } from '../db';
import { users, riskScores } from '../../shared/schema';
import { gatherFullFeatureSet, callMLPredictionAPI } from '../lib/riskCalculation';
import { convertQuestionnaireToMLFeatures } from '../lib/nhanesMapping';
import { eq } from 'drizzle-orm';

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
      const allAnswers = await gatherFullFeatureSet(user.id);
      const mlFeatures = convertQuestionnaireToMLFeatures(allAnswers);
      
      console.log(`  - Answer keys: ${Object.keys(allAnswers).join(', ')}`);
      console.log(`  - Converted ${Object.keys(allAnswers).length} answers to ${mlFeatures.length} ML features`);
      console.log(`  - Feature IDs: ${mlFeatures.map(f => f.ID).join(', ')}`);
      
      if (mlFeatures.length < 5) {
        console.log(`  - SKIPPED: Not enough features (${mlFeatures.length} < 5)`);
        skipCount++;
        continue;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
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
