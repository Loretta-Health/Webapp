export interface FeatureMapping {
  questionId: string;
  nhanesId: string;
  valueType: 'numerical' | 'categorical';
  valueMapping?: Record<string, string>;
  unitConversion?: 'kg_to_lbs' | 'cm_to_inches' | 'none';
}

const YES_NO_MAPPING = { 'yes': 'Yes', 'no': 'No', '1': 'Yes', '0': 'No', 'true': 'Yes', 'false': 'No' };

export const QUESTIONNAIRE_TO_NHANES: FeatureMapping[] = [
  { questionId: 'blood_test_3_years', nhanesId: 'DIQ180', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'prescription_medicine', nhanesId: 'RXQ033', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'high_blood_pressure', nhanesId: 'BPQ020', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'general_health', nhanesId: 'HUQ010', valueType: 'categorical', valueMapping: { 
    'excellent': 'Excellent', 
    'very_good': 'Very good', 
    'good': 'Good', 
    'fair': 'Fair', 
    'poor': 'Poor' 
  }},
  { questionId: 'age', nhanesId: 'RIDAGEYR', valueType: 'numerical' },
  { questionId: 'weight_current', nhanesId: 'WHD020', valueType: 'numerical', unitConversion: 'kg_to_lbs' },
  { questionId: 'height', nhanesId: 'WHD010', valueType: 'numerical', unitConversion: 'cm_to_inches' },
  { questionId: 'high_cholesterol', nhanesId: 'BPQ080', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'daily_aspirin', nhanesId: 'RXQ510', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'prediabetes', nhanesId: 'DIQ160', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'weight_year_ago', nhanesId: 'WHD050', valueType: 'numerical', unitConversion: 'kg_to_lbs' },
  { questionId: 'arthritis', nhanesId: 'MCQ160A', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'heart_failure', nhanesId: 'MCQ160B', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'coronary_disease', nhanesId: 'MCQ160C', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'heart_attack', nhanesId: 'MCQ160E', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'kidney_problems', nhanesId: 'KIQ022', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'gallbladder_surgery', nhanesId: 'MCQ560', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'unsteadiness', nhanesId: 'BAQ321C', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'stroke', nhanesId: 'MCQ160F', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'thyroid', nhanesId: 'MCQ160M', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'cancer', nhanesId: 'MCQ220', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'liver_condition', nhanesId: 'MCQ160L', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'copd', nhanesId: 'MCQ160P', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'asthma', nhanesId: 'MCQ010', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'hepatitis_b', nhanesId: 'HEQ010', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'health_insurance', nhanesId: 'HIQ011', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'smoked_tobacco', nhanesId: 'SMQ681', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'ever_smoked_100', nhanesId: 'SMQ020', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'alcohol', nhanesId: 'ALQ111', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'weekday_sleep', nhanesId: 'SLD012', valueType: 'numerical' },
  { questionId: 'weekend_sleep', nhanesId: 'SLD013', valueType: 'numerical' },
  { questionId: 'moderate_activity', nhanesId: 'PAD790', valueType: 'numerical' },
  { questionId: 'sedentary_hours', nhanesId: 'PAD680', valueType: 'numerical' },
];

const mappingByQuestionId = new Map<string, FeatureMapping>();
const mappingByNhanesId = new Map<string, FeatureMapping>();

QUESTIONNAIRE_TO_NHANES.forEach(m => {
  mappingByQuestionId.set(m.questionId, m);
  mappingByNhanesId.set(m.nhanesId, m);
});

export interface MLFeature {
  ID: string;
  Value: string;
}

export function convertQuestionnaireToMLFeatures(answers: Record<string, any>): MLFeature[] {
  const features: MLFeature[] = [];
  const seenNhanesIds = new Set<string>();
  
  for (const [questionId, rawValue] of Object.entries(answers)) {
    if (rawValue === null || rawValue === undefined) continue;
    const stringValue = String(rawValue).trim();
    if (stringValue === '') continue;
    
    const mapping = mappingByQuestionId.get(questionId);
    if (!mapping) {
      if (mappingByNhanesId.has(questionId) && !seenNhanesIds.has(questionId)) {
        features.push({ ID: questionId, Value: stringValue });
        seenNhanesIds.add(questionId);
      }
      continue;
    }
    
    if (seenNhanesIds.has(mapping.nhanesId)) continue;
    
    let value: string;
    if (mapping.valueType === 'categorical' && mapping.valueMapping) {
      const normalizedKey = stringValue.toLowerCase();
      const mappedValue = mapping.valueMapping[normalizedKey];
      if (!mappedValue) {
        console.warn(`[NHANES Mapping] Unmapped categorical value for ${questionId}: "${stringValue}"`);
        continue;
      }
      value = mappedValue;
    } else if (mapping.valueType === 'numerical') {
      const numValue = parseFloat(stringValue);
      if (isNaN(numValue)) continue;
      
      if (mapping.unitConversion === 'kg_to_lbs') {
        const poundsValue = numValue * 2.20462;
        value = poundsValue.toFixed(1);
      } else if (mapping.unitConversion === 'cm_to_inches') {
        const inchesValue = numValue / 2.54;
        value = inchesValue.toFixed(1);
      } else {
        value = numValue.toString();
      }
    } else {
      value = stringValue;
    }
    
    features.push({ ID: mapping.nhanesId, Value: value });
    seenNhanesIds.add(mapping.nhanesId);
  }
  
  console.log(`[NHANES Mapping] Converted ${Object.keys(answers).length} answers to ${features.length} ML features`);
  return features;
}

export function getQuestionIdFromNhanesId(nhanesId: string): string | undefined {
  return mappingByNhanesId.get(nhanesId)?.questionId;
}

export function getNhanesIdFromQuestionId(questionId: string): string | undefined {
  return mappingByQuestionId.get(questionId)?.nhanesId;
}
