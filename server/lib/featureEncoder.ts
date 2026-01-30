import * as fs from 'fs';
import * as path from 'path';

interface FeatureDefinition {
  feature_id: string;
  feature_desc: string;
  value_type: string;
  recode_dict: Record<string, number | null>;
  age_filter: string;
  value_dict: Record<string, string>;
}

interface FeatureConfig {
  demographics: Record<string, FeatureDefinition[]>;
  examination: Record<string, FeatureDefinition[]>;
  questionnaire: Record<string, FeatureDefinition[]>;
}

let featureConfig: FeatureConfig | null = null;
let featureLookup: Map<string, FeatureDefinition> = new Map();
let valueToCodeLookup: Map<string, Map<string, number>> = new Map();

function loadFeatureConfig(): void {
  if (featureConfig !== null) return;
  
  try {
    const configPath = path.join(process.cwd(), 'feature_config.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    featureConfig = JSON.parse(configData);
    
    const categories = ['demographics', 'examination', 'questionnaire'] as const;
    for (const category of categories) {
      const categoryData = featureConfig?.[category];
      if (!categoryData) continue;
      
      for (const [, features] of Object.entries(categoryData)) {
        for (const feature of features) {
          featureLookup.set(feature.feature_id, feature);
          
          if (feature.value_type === 'Categorical' && feature.value_dict) {
            const valueToCodes = new Map<string, number>();
            
            for (const [code, label] of Object.entries(feature.value_dict)) {
              if (label && typeof label === 'string') {
                valueToCodes.set(label.toLowerCase(), parseInt(code, 10));
              }
            }
            
            valueToCodeLookup.set(feature.feature_id, valueToCodes);
          }
        }
      }
    }
    
    console.log(`[FeatureEncoder] Loaded ${featureLookup.size} feature definitions`);
  } catch (error) {
    console.error('[FeatureEncoder] Failed to load feature_config.json:', error);
  }
}

loadFeatureConfig();

export function getFeatureDefinition(featureId: string): FeatureDefinition | undefined {
  return featureLookup.get(featureId);
}

export function encodeFeatureValue(featureId: string, value: string | number): number | null {
  const feature = featureLookup.get(featureId);
  if (!feature) {
    return typeof value === 'number' ? value : parseFloat(value) || null;
  }
  
  if (feature.value_type === 'Numerical') {
    const numVal = typeof value === 'number' ? value : parseFloat(String(value));
    return isNaN(numVal) ? null : numVal;
  }
  
  if (feature.value_type === 'Categorical') {
    const stringValue = String(value).toLowerCase().trim();
    
    const valueCodes = valueToCodeLookup.get(featureId);
    if (valueCodes) {
      const code = valueCodes.get(stringValue);
      if (code !== undefined) {
        return code;
      }
    }
    
    const numVal = parseFloat(stringValue);
    if (!isNaN(numVal) && Number.isInteger(numVal)) {
      return numVal;
    }
    
    console.warn(`[FeatureEncoder] Could not encode value "${value}" for feature ${featureId}`);
    return null;
  }
  
  return typeof value === 'number' ? value : parseFloat(value) || null;
}

export function isFeatureExpectedByModel(featureId: string): boolean {
  return featureLookup.has(featureId);
}

export function getExpectedModelFeatures(): string[] {
  return [
    'RIDAGEYR', 'WHD050', 'WHD020', 'RXQ033', 'HUQ010', 'BPQ020', 'BPQ080', 'RXQ510',
    'OHQ845', 'INDFMPIR', 'PAD680', 'INDFMMPI', 'PAD790', 'WHD010', 'OCD150',
    'MCQ160A', 'SLQ310_cos', 'SLD012', 'DMDEDUC2', 'SLQ330_cos', 'SLD013', 'HOD051',
    'SLQ300_sin', 'SLQ310_sin', 'SLQ320_sin', 'SLQ330_sin', 'SLQ300_cos', 'ALQ121',
    'SLQ320_cos', 'AUQ054', 'DMDHHSIZ', 'RIDRETH3', 'KIQ022', 'OHQ630', 'OHQ660',
    'OHQ620', 'BAQ530', 'OHQ670', 'MCQ160C', 'BAQ321C', 'DMDMARTZ', 'HUQ055',
    'OHQ680', 'DPQ030'
  ];
}
