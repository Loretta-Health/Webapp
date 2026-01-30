import { encodeFeatureValue } from './featureEncoder';

export interface FeatureMapping {
  questionId: string;
  nhanesId: string;
  valueType: 'numerical' | 'categorical' | 'time';
  valueMapping?: Record<string, string>;
  unitConversion?: 'kg_to_lbs' | 'cm_to_inches' | 'none';
}

const YES_NO_MAPPING = { 'yes': 'Yes', 'no': 'No', '1': 'Yes', '0': 'No', 'true': 'Yes', 'false': 'No' };

export const QUESTIONNAIRE_TO_NHANES: FeatureMapping[] = [
  // Demographics
  { questionId: 'age', nhanesId: 'RIDAGEYR', valueType: 'numerical' },
  { questionId: 'ethnicity', nhanesId: 'RIDRETH3', valueType: 'categorical', valueMapping: {
    // NHANES standard values
    'mexican-american': 'Mexican American',
    'other-hispanic': 'Other Hispanic',
    'non-hispanic-white': 'Non-Hispanic White',
    'non-hispanic-black': 'Non-Hispanic Black',
    'non-hispanic-asian': 'Non-Hispanic Asian',
    'other-multi-racial': 'Other Race - Including Multi-Racial',
    // Questionnaire values (map to NHANES equivalents)
    'white-european': 'Non-Hispanic White',
    'black-african': 'Non-Hispanic Black',
    'afro-caribbean': 'Non-Hispanic Black',
    'hispanic-latino': 'Other Hispanic',
    'east-asian': 'Non-Hispanic Asian',
    'south-asian': 'Non-Hispanic Asian',
    'southeast-asian': 'Non-Hispanic Asian',
    'middle-eastern': 'Other Race - Including Multi-Racial',
    'native-american': 'Other Race - Including Multi-Racial',
    'pacific-islander': 'Other Race - Including Multi-Racial',
    'mixed-multiracial': 'Other Race - Including Multi-Racial',
    'prefer-not-to-say': 'Other Race - Including Multi-Racial',
    // Legacy short values
    'white': 'Non-Hispanic White',
    'black': 'Non-Hispanic Black',
    'asian': 'Non-Hispanic Asian',
    'other': 'Other Race - Including Multi-Racial'
  }},
  { questionId: 'education', nhanesId: 'DMDEDUC2', valueType: 'categorical', valueMapping: {
    // NHANES standard values
    'less_than_9th': 'Less than 9th grade',
    '9_11th_grade': '9-11th grade (Includes 12th grade with no diploma)',
    'high_school': 'High school graduate/GED or equivalent',
    'some_college': 'Some college or AA degree',
    'college_grad': 'College graduate or above',
    // Questionnaire values (map to NHANES equivalents)
    'less_9th': 'Less than 9th grade',
    '9_11th': '9-11th grade (Includes 12th grade with no diploma)',
    'hs_grad': 'High school graduate/GED or equivalent',
    // Legacy values
    'less_than_high_school': 'Less than 9th grade',
    'high_school_grad': 'High school graduate/GED or equivalent',
    'college_graduate': 'College graduate or above'
  }},
  { questionId: 'marital_status', nhanesId: 'DMDMARTZ', valueType: 'categorical', valueMapping: {
    'married': 'Married/Living with partner',
    'living_with_partner': 'Married/Living with partner',
    'widowed': 'Widowed/Divorced/Separated',
    'divorced': 'Widowed/Divorced/Separated',
    'separated': 'Widowed/Divorced/Separated',
    'never_married': 'Never married',
    'single': 'Never married'
  }},
  { questionId: 'household_size', nhanesId: 'DMDHHSIZ', valueType: 'numerical' },
  { questionId: 'income_poverty_ratio', nhanesId: 'INDFMPIR', valueType: 'categorical', valueMapping: {
    // NHANES standard values
    'below_poverty': '0.5',
    'near_poverty': '1.0',
    'low_income': '1.5',
    'moderate': '2.5',
    'comfortable': '3.5',
    'high_income': '5.0',
    // Questionnaire values (map to NHANES equivalents)
    'struggling': '0.5',
    'getting_by': '1.5',
    'well_off': '5.0'
  }},
  { questionId: 'monthly_poverty_index', nhanesId: 'INDFMMPI', valueType: 'categorical', valueMapping: {
    // NHANES standard values
    'never': '0.5',
    'rarely': '1.0',
    'sometimes': '2.0',
    'often': '3.0',
    'always': '4.0',
    // Questionnaire value (shorthand)
    'usually': '3.0'
  }},
  { questionId: 'savings', nhanesId: 'INQ300', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'household_rooms', nhanesId: 'HOD051', valueType: 'categorical', valueMapping: {
    '1': '1', '2': '2', '3': '3', '4': '4', '5': '5',
    '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
    '11': '11', '12': '12 or more', '12_or_more': '12 or more'
  }},

  // Health Conditions
  { questionId: 'prescription_medicine', nhanesId: 'RXQ033', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'high_blood_pressure', nhanesId: 'BPQ020', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'high_cholesterol', nhanesId: 'BPQ080', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'arthritis', nhanesId: 'MCQ160A', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'heart_failure', nhanesId: 'MCQ160B', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'coronary_disease', nhanesId: 'MCQ160C', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'heart_attack', nhanesId: 'MCQ160E', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'kidney_problems', nhanesId: 'KIQ022', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'gallbladder_surgery', nhanesId: 'MCQ560', valueType: 'categorical', valueMapping: YES_NO_MAPPING },

  // General Health
  { questionId: 'general_health', nhanesId: 'HUQ010', valueType: 'categorical', valueMapping: { 
    'excellent': 'Excellent', 
    'very_good': 'Very good', 
    'good': 'Good', 
    'fair': 'Fair', 
    'poor': 'Poor' 
  }},
  { questionId: 'routine_healthcare', nhanesId: 'HUQ030', valueType: 'categorical', valueMapping: {
    'yes': 'Yes',
    'no': 'There is no place',
    'multiple': 'There is more than one place'
  }},
  { questionId: 'video_consult', nhanesId: 'HUQ055', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'sleep_trouble', nhanesId: 'DPQ030', valueType: 'categorical', valueMapping: {
    'not_at_all': 'Not at all',
    'several_days': 'Several days',
    'more_than_half': 'More than half the days',
    'nearly_every_day': 'Nearly every day'
  }},

  // Physical Measurements
  { questionId: 'height', nhanesId: 'WHD010', valueType: 'numerical', unitConversion: 'cm_to_inches' },
  { questionId: 'weight_current', nhanesId: 'WHD020', valueType: 'numerical', unitConversion: 'kg_to_lbs' },
  { questionId: 'weight_year_ago', nhanesId: 'WHD050', valueType: 'numerical', unitConversion: 'kg_to_lbs' },

  // Lifestyle & Activity
  { questionId: 'alcohol_frequency', nhanesId: 'ALQ121', valueType: 'categorical', valueMapping: {
    'never': 'Never in the last year',
    'every_day': 'Every day',
    'nearly_every_day': 'Nearly every day',
    '3_4_week': '3 to 4 times a week',
    '2_week': '2 times a week',
    '1_week': 'Once a week',
    '2_3_month': '2 to 3 times a month',
    '1_month': 'Once a month',
    '7_11_year': '7 to 11 times in the last year',
    '3_6_year': '3 to 6 times in the last year',
    '1_2_year': '1 to 2 times in the last year'
  }},
  { questionId: 'moderate_activity', nhanesId: 'PAD790', valueType: 'numerical' },
  { questionId: 'sedentary_hours', nhanesId: 'PAD680', valueType: 'numerical' },

  // Employment
  { questionId: 'job_type', nhanesId: 'OCD150', valueType: 'categorical', valueMapping: {
    // NHANES standard values
    'working': 'Working at a job or business',
    'with_job_not_working': 'With a job or business but not at work',
    'looking_for_work': 'Looking for work',
    'not_working': 'Not working at a job or business',
    // Questionnaire shorthand
    'looking': 'Looking for work',
    // Legacy values
    'employed': 'Working at a job or business',
    'unemployed': 'Looking for work',
    'retired': 'Not working at a job or business',
    'student': 'Not working at a job or business'
  }},

  // Sleep
  { questionId: 'weekday_sleep', nhanesId: 'SLD012', valueType: 'numerical' },
  { questionId: 'weekend_sleep', nhanesId: 'SLD013', valueType: 'numerical' },
  { questionId: 'sleep_time_weekday', nhanesId: 'SLQ300', valueType: 'time' },
  { questionId: 'wake_time_weekday', nhanesId: 'SLQ310', valueType: 'time' },
  { questionId: 'sleep_time_weekend', nhanesId: 'SLQ320', valueType: 'time' },
  { questionId: 'wake_time_weekend', nhanesId: 'SLQ330', valueType: 'time' },

  // Medications
  { questionId: 'daily_aspirin', nhanesId: 'RXQ510', valueType: 'categorical', valueMapping: YES_NO_MAPPING },

  // Balance & Mobility
  { questionId: 'unsteadiness', nhanesId: 'BAQ321C', valueType: 'categorical', valueMapping: YES_NO_MAPPING },
  { questionId: 'falls', nhanesId: 'BAQ530', valueType: 'categorical', valueMapping: {
    // NHANES standard values
    'never': 'Never',
    '1_2_times': '1 or 2 times',
    '3_4_times': '3 to 4 times',
    'every_year': 'About every year',
    'every_month': 'About every month',
    'every_week': 'About every week',
    'daily': 'Daily or constantly',
    // Questionnaire values (map to NHANES equivalents)
    '1_2': '1 or 2 times',
    '3_4': '3 to 4 times',
    'yearly': 'About every year',
    'monthly': 'About every month',
    'weekly': 'About every week'
  }},

  // Hearing
  { questionId: 'hearing_health', nhanesId: 'AUQ054', valueType: 'categorical', valueMapping: {
    // NHANES standard values
    'excellent': 'Excellent',
    'good': 'Good',
    'little_trouble': 'A little trouble',
    'moderate_trouble': 'Moderate hearing trouble',
    'lot_trouble': 'A lot of trouble',
    'deaf': 'Deaf',
    // Questionnaire value (shorthand)
    'moderate': 'Moderate hearing trouble'
  }},

  // Oral Health
  { questionId: 'dental_health', nhanesId: 'OHQ845', valueType: 'categorical', valueMapping: {
    'excellent': 'Excellent',
    'very_good': 'Very good',
    'good': 'Good',
    'fair': 'Fair',
    'poor': 'Poor'
  }},
  { questionId: 'mouth_aching', nhanesId: 'OHQ620', valueType: 'categorical', valueMapping: {
    'very_often': 'Very often',
    'fairly_often': 'Fairly often',
    'occasionally': 'Occasionally',
    'hardly_ever': 'Hardly ever',
    'never': 'Never'
  }},
  { questionId: 'mouth_feel_bad', nhanesId: 'OHQ630', valueType: 'categorical', valueMapping: {
    'very_often': 'Very often',
    'fairly_often': 'Fairly often',
    'occasionally': 'Occasionally',
    'hardly_ever': 'Hardly ever',
    'never': 'Never'
  }},
  { questionId: 'mouth_avoid_food', nhanesId: 'OHQ660', valueType: 'categorical', valueMapping: {
    'very_often': 'Very often',
    'fairly_often': 'Fairly often',
    'occasionally': 'Occasionally',
    'hardly_ever': 'Hardly ever',
    'never': 'Never'
  }},
  { questionId: 'mouth_eating_problems', nhanesId: 'OHQ670', valueType: 'categorical', valueMapping: {
    'very_often': 'Very often',
    'fairly_often': 'Fairly often',
    'occasionally': 'Occasionally',
    'hardly_ever': 'Hardly ever',
    'never': 'Never'
  }},
];

const mappingByQuestionId = new Map<string, FeatureMapping>();
const mappingByNhanesId = new Map<string, FeatureMapping>();

QUESTIONNAIRE_TO_NHANES.forEach(m => {
  mappingByQuestionId.set(m.questionId, m);
  mappingByNhanesId.set(m.nhanesId, m);
});

export interface MLFeature {
  ID: string;
  Value: number;
}

function timeToMinutes(timeStr: string): number | null {
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = timeStr.match(timeRegex);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function convertTimeToCyclical(timeStr: string, nhanesId: string): MLFeature[] {
  const totalMinutes = timeToMinutes(timeStr);
  if (totalMinutes === null) return [];
  
  const totalMinutesInDay = 24 * 60;
  const radians = (2 * Math.PI * totalMinutes) / totalMinutesInDay;
  const sinValue = Math.sin(radians);
  const cosValue = Math.cos(radians);
  
  return [
    { ID: `${nhanesId}_sin`, Value: parseFloat(sinValue.toFixed(6)) },
    { ID: `${nhanesId}_cos`, Value: parseFloat(cosValue.toFixed(6)) }
  ];
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
        const encodedValue = encodeFeatureValue(questionId, stringValue);
        if (encodedValue !== null) {
          features.push({ ID: questionId, Value: encodedValue });
          seenNhanesIds.add(questionId);
        }
      }
      continue;
    }
    
    if (seenNhanesIds.has(mapping.nhanesId)) continue;
    
    if (mapping.valueType === 'time') {
      const cyclicalFeatures = convertTimeToCyclical(stringValue, mapping.nhanesId);
      if (cyclicalFeatures.length > 0) {
        features.push(...cyclicalFeatures);
        seenNhanesIds.add(mapping.nhanesId);
      } else {
        console.warn(`[NHANES Mapping] Invalid time format for ${questionId}: "${stringValue}"`);
      }
      continue;
    }
    
    let numericValue: number | null = null;
    
    if (mapping.valueType === 'categorical' && mapping.valueMapping) {
      const normalizedKey = stringValue.toLowerCase();
      const mappedValue = mapping.valueMapping[normalizedKey];
      if (!mappedValue) {
        console.warn(`[NHANES Mapping] Unmapped categorical value for ${questionId}: "${stringValue}"`);
        continue;
      }
      numericValue = encodeFeatureValue(mapping.nhanesId, mappedValue);
    } else if (mapping.valueType === 'numerical') {
      let numValue = parseFloat(stringValue);
      if (isNaN(numValue)) continue;
      
      if (mapping.unitConversion === 'kg_to_lbs') {
        numValue = numValue * 2.20462;
      } else if (mapping.unitConversion === 'cm_to_inches') {
        numValue = numValue / 2.54;
      }
      numericValue = parseFloat(numValue.toFixed(1));
    } else {
      numericValue = encodeFeatureValue(mapping.nhanesId, stringValue);
    }
    
    if (numericValue !== null) {
      features.push({ ID: mapping.nhanesId, Value: numericValue });
      seenNhanesIds.add(mapping.nhanesId);
    }
  }
  
  console.log(`[NHANES Mapping] Converted ${Object.keys(answers).length} answers to ${features.length} ML features`);
  console.log(`[NHANES Mapping] Feature values:`, features.map(f => `${f.ID}=${f.Value}`).join(', '));
  return features;
}

export function getQuestionIdFromNhanesId(nhanesId: string): string | undefined {
  return mappingByNhanesId.get(nhanesId)?.questionId;
}

export function getNhanesIdFromQuestionId(questionId: string): string | undefined {
  return mappingByQuestionId.get(questionId)?.nhanesId;
}
