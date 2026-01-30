import { storage } from '../storage';
import { convertQuestionnaireToMLFeatures, type MLFeature } from './nhanesMapping';

const PREDICTION_API_BASE_URL = process.env.PREDICTION_API_URL || 'https://loretta-predict.replit.app';
const ML_API_KEY = process.env.ML_API_KEY;

export async function gatherFullFeatureSet(userId: string): Promise<Record<string, any>> {
  const allAnswers = await storage.getAllQuestionnaireAnswers(userId);
  const profile = await storage.getUserProfile(userId);
  
  const mergedAnswers: Record<string, any> = {};
  
  allAnswers.forEach(a => {
    if (a.answers && typeof a.answers === 'object') {
      Object.assign(mergedAnswers, a.answers);
    }
  });
  
  if (profile) {
    if (profile.age) mergedAnswers.age = profile.age;
    if (profile.height) mergedAnswers.height = profile.height;
    if (profile.weight) mergedAnswers.weight_current = profile.weight;
    if (profile.ethnicity) mergedAnswers.ethnicity = profile.ethnicity;
  }
  
  return mergedAnswers;
}

export async function callMLPredictionAPI(features: MLFeature[], username: string): Promise<{ diabetes_probability: number; risk_level: string } | null> {
  if (!ML_API_KEY) {
    console.warn('[ML API] No ML_API_KEY configured, skipping ML prediction');
    return null;
  }
  
  const predictUrl = `${PREDICTION_API_BASE_URL}/predict`;
  console.log('[ML API] Calling:', predictUrl, 'with', features.length, 'features for user:', username);
  
  const response = await fetch(predictUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': ML_API_KEY,
    },
    body: JSON.stringify({ username, features }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[ML API] Error:', response.status, errorText);
    throw new Error(`ML API error: ${response.status} - ${errorText}`);
  }
  
  const result = await response.json();
  return result;
}

export interface RiskCalculationResult {
  success: boolean;
  riskValue?: number;
  featuresUsed?: number;
  error?: string;
}

export async function calculateAndSaveRiskScore(userId: string): Promise<RiskCalculationResult> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    const mergedAnswers = await gatherFullFeatureSet(userId);
    const mlFeatures = convertQuestionnaireToMLFeatures(mergedAnswers);
    
    console.log('[Risk Calculation] Gathered', Object.keys(mergedAnswers).length, 'questionnaire answers');
    console.log('[Risk Calculation] Answer keys:', Object.keys(mergedAnswers).join(', '));
    console.log('[Risk Calculation] Raw answers:', JSON.stringify(mergedAnswers, null, 2));
    console.log('[Risk Calculation] Converted to', mlFeatures.length, 'ML features');
    console.log('[Risk Calculation] Feature IDs:', mlFeatures.map(f => f.ID).join(', '));
    console.log('[Risk Calculation] Features being sent:', JSON.stringify(mlFeatures, null, 2));
    
    if (mlFeatures.length < 5) {
      return {
        success: false,
        featuresUsed: mlFeatures.length,
        error: 'Not enough features for ML model'
      };
    }
    
    const mlResult = await callMLPredictionAPI(mlFeatures, user.username);
    
    if (!mlResult || typeof mlResult.diabetes_probability !== 'number') {
      return {
        success: false,
        error: 'ML API returned no result'
      };
    }
    
    const riskValue = Math.round(mlResult.diabetes_probability * 100);
    
    const riskScore = {
      overallScore: riskValue,
      diabetesRisk: riskValue,
      heartRisk: 0,
      strokeRisk: 0,
    };
    
    await storage.saveRiskScore({
      userId,
      ...riskScore,
    });
    
    console.log('[Risk Calculation] ML model prediction:', mlResult.diabetes_probability, '-> risk score:', riskValue);
    
    return {
      success: true,
      riskValue,
      featuresUsed: mlFeatures.length
    };
  } catch (error) {
    console.error('[Risk Calculation] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
