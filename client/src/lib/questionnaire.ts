import { 
  Activity, 
  Heart, 
  Pill, 
  User, 
  Scale, 
  Ruler, 
  AlertTriangle, 
  Stethoscope,
  Ear,
  Moon,
  Clock,
  Video,
  Briefcase,
  Wine,
  Smile,
  Home,
  DollarSign,
  TrendingUp,
  GraduationCap,
  type LucideIcon
} from 'lucide-react';

export interface QuestionOption {
  label: string;
  value: string;
  apiValue?: number;
  riskWeight: number;
}

export interface Question {
  id: string;
  apiId?: string;
  text: string;
  type: 'choice' | 'number' | 'time';
  options?: QuestionOption[];
  placeholder?: string;
  unit?: string;
  min?: number;
  max?: number;
  icon: LucideIcon;
  category: string;
  module: 'core' | 'medical' | 'lifestyle' | 'oral' | 'financial';
  followUpFor?: string;
}

export interface QuestionnaireAnswer {
  questionId: string;
  answer: string | number;
  riskWeight: number;
}

export const CORE_QUESTION_COUNT = 8;

export const ONBOARDING_QUESTION_IDS = [
  'age',
  'weight_current',
  'high_cholesterol',
  'high_blood_pressure',
  'general_health',
] as const;

export const ONBOARDING_QUESTION_COUNT = ONBOARDING_QUESTION_IDS.length;

export const baseQuestions: Question[] = [
  // === CORE QUESTIONS (Quick Health Check) ===
  {
    id: 'prescription_medicine',
    apiId: 'RXQ033',
    text: "Have you taken any prescription medicine in the past month?",
    type: 'choice',
    icon: Pill,
    category: "Quick Health Check",
    module: 'core',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 1 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'high_blood_pressure',
    apiId: 'BPQ020',
    text: "Have you ever been told you have high blood pressure?",
    type: 'choice',
    icon: Heart,
    category: "Quick Health Check",
    module: 'core',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 2 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'general_health',
    apiId: 'HUQ010',
    text: "How would you rate your general health condition?",
    type: 'choice',
    icon: Heart,
    category: "Quick Health Check",
    module: 'core',
    options: [
      { label: 'Excellent', value: 'excellent', apiValue: 0, riskWeight: 0 },
      { label: 'Very good', value: 'very_good', apiValue: 1, riskWeight: 0 },
      { label: 'Good', value: 'good', apiValue: 2, riskWeight: 1 },
      { label: 'Fair', value: 'fair', apiValue: 3, riskWeight: 2 },
      { label: 'Poor', value: 'poor', apiValue: 4, riskWeight: 3 },
    ],
  },
  {
    id: 'age',
    apiId: 'RIDAGEYR',
    text: "What is your age?",
    type: 'number',
    icon: User,
    category: "Quick Health Check",
    module: 'core',
    placeholder: "Enter your age",
    unit: "years",
    min: 18,
    max: 120,
  },
  {
    id: 'weight_current',
    apiId: 'WHD020',
    text: "What is your current weight?",
    type: 'number',
    icon: Scale,
    category: "Quick Health Check",
    module: 'core',
    placeholder: "Enter weight",
    unit: "kg",
    min: 20,
    max: 500,
  },
  {
    id: 'height',
    apiId: 'WHD010',
    text: "What is your current height?",
    type: 'number',
    icon: Ruler,
    category: "Quick Health Check",
    module: 'core',
    placeholder: "Enter height",
    unit: "cm",
    min: 50,
    max: 275,
  },
  {
    id: 'high_cholesterol',
    apiId: 'BPQ080',
    text: "Has a doctor told you that you have high cholesterol?",
    type: 'choice',
    icon: Heart,
    category: "Quick Health Check",
    module: 'core',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 2 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'daily_aspirin',
    apiId: 'RXQ510',
    text: "Has a doctor told you to take daily low-dose aspirin?",
    type: 'choice',
    icon: Pill,
    category: "Quick Health Check",
    module: 'core',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 1 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },

  // === MEDICAL HISTORY ===
  {
    id: 'weight_year_ago',
    apiId: 'WHD050',
    text: "What was your weight 1 year ago?",
    type: 'number',
    icon: Scale,
    category: "Medical History",
    module: 'medical',
    placeholder: "Enter weight",
    unit: "kg",
    min: 20,
    max: 500,
  },
  {
    id: 'arthritis',
    apiId: 'MCQ160A',
    text: "Has a doctor ever said you have arthritis?",
    type: 'choice',
    icon: Activity,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 1 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'heart_failure',
    apiId: 'MCQ160B',
    text: "Have you ever been told you had congestive heart failure?",
    type: 'choice',
    icon: Heart,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 3 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'coronary_disease',
    apiId: 'MCQ160C',
    text: "Have you ever been told you had coronary heart disease?",
    type: 'choice',
    icon: Heart,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 3 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'heart_attack',
    apiId: 'MCQ160E',
    text: "Have you ever been told you had a heart attack?",
    type: 'choice',
    icon: Heart,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 3 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'kidney_problems',
    apiId: 'KIQ022',
    text: "Have you ever been told you have weak or failing kidneys?",
    type: 'choice',
    icon: Activity,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 2 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'gallbladder_surgery',
    apiId: 'MCQ560',
    text: "Have you ever had gallbladder surgery?",
    type: 'choice',
    icon: Stethoscope,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 1 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'unsteadiness',
    apiId: 'BAQ321C',
    text: "In the past 12 months, have you had problems with feeling unsteady?",
    type: 'choice',
    icon: AlertTriangle,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 2 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },
  {
    id: 'falls',
    apiId: 'BAQ530',
    text: "In the past 5 years, how many times have you fallen?",
    type: 'choice',
    icon: AlertTriangle,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Never', value: 'never', apiValue: 0, riskWeight: 0 },
      { label: '1 or 2 times', value: '1_2', apiValue: 1, riskWeight: 1 },
      { label: '3 to 4 times', value: '3_4', apiValue: 2, riskWeight: 1 },
      { label: 'About every year', value: 'yearly', apiValue: 3, riskWeight: 2 },
      { label: 'About every month', value: 'monthly', apiValue: 4, riskWeight: 2 },
      { label: 'About every week', value: 'weekly', apiValue: 5, riskWeight: 3 },
      { label: 'Daily or constantly', value: 'daily', apiValue: 6, riskWeight: 3 },
    ],
  },
  {
    id: 'hearing_health',
    apiId: 'AUQ054',
    text: "What is the general condition of your hearing?",
    type: 'choice',
    icon: Ear,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Excellent', value: 'excellent', apiValue: 0, riskWeight: 0 },
      { label: 'Good', value: 'good', apiValue: 1, riskWeight: 0 },
      { label: 'A little trouble', value: 'little_trouble', apiValue: 2, riskWeight: 1 },
      { label: 'Moderate hearing trouble', value: 'moderate', apiValue: 3, riskWeight: 2 },
      { label: 'A lot of trouble', value: 'lot_trouble', apiValue: 4, riskWeight: 2 },
      { label: 'Deaf', value: 'deaf', apiValue: 5, riskWeight: 3 },
    ],
  },
  {
    id: 'routine_healthcare',
    apiId: 'HUQ030',
    text: "Is there a place you usually go to when you are sick or need advice about your health?",
    type: 'choice',
    icon: Stethoscope,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes, there is a place', value: 'yes', apiValue: 0, riskWeight: 0 },
      { label: 'There is no place', value: 'no', apiValue: 1, riskWeight: 1 },
      { label: 'There is more than one place', value: 'multiple', apiValue: 2, riskWeight: 0 },
    ],
  },
  {
    id: 'video_consult',
    apiId: 'HUQ055',
    text: "In the past 12 months, have you had a video conference with a doctor or health professional?",
    type: 'choice',
    icon: Video,
    category: "Medical History",
    module: 'medical',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 0 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 0 },
    ],
  },

  // === LIFESTYLE & ACTIVITY ===
  {
    id: 'moderate_activity',
    apiId: 'PAD790',
    text: "In a typical week, how many hours do you spend doing moderate leisure-time physical activity?",
    type: 'number',
    icon: Activity,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "Hours per week",
    unit: "hours",
    min: 0,
    max: 40,
  },
  {
    id: 'sedentary_hours',
    apiId: 'PAD680',
    text: "On a typical day, how many hours do you sit or recline (not including sleep)?",
    type: 'number',
    icon: Activity,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "Hours per day",
    unit: "hours",
    min: 0,
    max: 24,
  },
  {
    id: 'job_type',
    apiId: 'OCD150',
    text: "What type of work were you doing last week?",
    type: 'choice',
    icon: Briefcase,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    options: [
      { label: 'Working at a job or business', value: 'working', apiValue: 0, riskWeight: 0 },
      { label: 'With a job but not at work', value: 'with_job_not_working', apiValue: 1, riskWeight: 0 },
      { label: 'Looking for work', value: 'looking', apiValue: 2, riskWeight: 1 },
      { label: 'Not working at a job or business', value: 'not_working', apiValue: 3, riskWeight: 1 },
    ],
  },
  {
    id: 'weekday_sleep',
    apiId: 'SLD012',
    text: "How many hours of sleep do you usually get on weekdays or workdays?",
    type: 'number',
    icon: Moon,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "Hours of sleep",
    unit: "hours",
    min: 0,
    max: 24,
  },
  {
    id: 'weekend_sleep',
    apiId: 'SLD013',
    text: "How many hours of sleep do you usually get on weekends?",
    type: 'number',
    icon: Moon,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "Hours of sleep",
    unit: "hours",
    min: 0,
    max: 24,
  },
  {
    id: 'sleep_time_weekday',
    apiId: 'SLQ300',
    text: "What time do you usually go to sleep on weekdays?",
    type: 'time',
    icon: Clock,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "e.g., 22:30",
  },
  {
    id: 'wake_time_weekday',
    apiId: 'SLQ310',
    text: "What time do you usually wake up on weekdays?",
    type: 'time',
    icon: Clock,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "e.g., 06:45",
  },
  {
    id: 'sleep_time_weekend',
    apiId: 'SLQ320',
    text: "What time do you usually go to sleep on weekends?",
    type: 'time',
    icon: Clock,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "e.g., 23:00",
  },
  {
    id: 'wake_time_weekend',
    apiId: 'SLQ330',
    text: "What time do you usually wake up on weekends?",
    type: 'time',
    icon: Clock,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    placeholder: "e.g., 08:00",
  },
  {
    id: 'sleep_trouble',
    apiId: 'DPQ030',
    text: "Over the last 2 weeks, how often have you had trouble sleeping or slept too much?",
    type: 'choice',
    icon: Moon,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    options: [
      { label: 'Not at all', value: 'not_at_all', apiValue: 0, riskWeight: 0 },
      { label: 'Several days', value: 'several_days', apiValue: 1, riskWeight: 1 },
      { label: 'More than half the days', value: 'more_than_half', apiValue: 2, riskWeight: 2 },
      { label: 'Nearly every day', value: 'nearly_every_day', apiValue: 3, riskWeight: 3 },
    ],
  },
  {
    id: 'alcohol_frequency',
    apiId: 'ALQ121',
    text: "In the past 12 months, how often did you drink any type of alcoholic beverage?",
    type: 'choice',
    icon: Wine,
    category: "Lifestyle & Activity",
    module: 'lifestyle',
    options: [
      { label: 'Never in the last year', value: 'never', apiValue: 0, riskWeight: 0 },
      { label: 'Every day', value: 'every_day', apiValue: 1, riskWeight: 3 },
      { label: 'Nearly every day', value: 'nearly_every_day', apiValue: 2, riskWeight: 3 },
      { label: '3 to 4 times a week', value: '3_4_week', apiValue: 3, riskWeight: 2 },
      { label: '2 times a week', value: '2_week', apiValue: 4, riskWeight: 2 },
      { label: 'Once a week', value: '1_week', apiValue: 5, riskWeight: 1 },
      { label: '2 to 3 times a month', value: '2_3_month', apiValue: 6, riskWeight: 1 },
      { label: 'Once a month', value: '1_month', apiValue: 7, riskWeight: 0 },
      { label: '7 to 11 times in the last year', value: '7_11_year', apiValue: 8, riskWeight: 0 },
      { label: '3 to 6 times in the last year', value: '3_6_year', apiValue: 9, riskWeight: 0 },
      { label: '1 to 2 times in the last year', value: '1_2_year', apiValue: 10, riskWeight: 0 },
    ],
  },

  // === ORAL HEALTH ===
  {
    id: 'dental_health',
    apiId: 'OHQ845',
    text: "How would you rate the health of your teeth and gums?",
    type: 'choice',
    icon: Smile,
    category: "Oral Health",
    module: 'oral',
    options: [
      { label: 'Excellent', value: 'excellent', apiValue: 0, riskWeight: 0 },
      { label: 'Very good', value: 'very_good', apiValue: 1, riskWeight: 0 },
      { label: 'Good', value: 'good', apiValue: 2, riskWeight: 1 },
      { label: 'Fair', value: 'fair', apiValue: 3, riskWeight: 2 },
      { label: 'Poor', value: 'poor', apiValue: 4, riskWeight: 3 },
    ],
  },
  {
    id: 'mouth_aching',
    apiId: 'OHQ620',
    text: "In the past year, how often have you had aching anywhere in your mouth?",
    type: 'choice',
    icon: Smile,
    category: "Oral Health",
    module: 'oral',
    options: [
      { label: 'Very often', value: 'very_often', apiValue: 0, riskWeight: 3 },
      { label: 'Fairly often', value: 'fairly_often', apiValue: 1, riskWeight: 2 },
      { label: 'Occasionally', value: 'occasionally', apiValue: 2, riskWeight: 1 },
      { label: 'Hardly ever', value: 'hardly_ever', apiValue: 3, riskWeight: 0 },
      { label: 'Never', value: 'never', apiValue: 4, riskWeight: 0 },
    ],
  },
  {
    id: 'mouth_feel_bad',
    apiId: 'OHQ630',
    text: "How often have you felt bad or embarrassed because of your mouth?",
    type: 'choice',
    icon: Smile,
    category: "Oral Health",
    module: 'oral',
    options: [
      { label: 'Very often', value: 'very_often', apiValue: 0, riskWeight: 3 },
      { label: 'Fairly often', value: 'fairly_often', apiValue: 1, riskWeight: 2 },
      { label: 'Occasionally', value: 'occasionally', apiValue: 2, riskWeight: 1 },
      { label: 'Hardly ever', value: 'hardly_ever', apiValue: 3, riskWeight: 0 },
      { label: 'Never', value: 'never', apiValue: 4, riskWeight: 0 },
    ],
  },
  {
    id: 'mouth_avoid_food',
    apiId: 'OHQ660',
    text: "In the past year, have you avoided particular foods because of problems with your mouth?",
    type: 'choice',
    icon: Smile,
    category: "Oral Health",
    module: 'oral',
    options: [
      { label: 'Very often', value: 'very_often', apiValue: 0, riskWeight: 3 },
      { label: 'Fairly often', value: 'fairly_often', apiValue: 1, riskWeight: 2 },
      { label: 'Occasionally', value: 'occasionally', apiValue: 2, riskWeight: 1 },
      { label: 'Hardly ever', value: 'hardly_ever', apiValue: 3, riskWeight: 0 },
      { label: 'Never', value: 'never', apiValue: 4, riskWeight: 0 },
    ],
  },
  {
    id: 'mouth_eating_problems',
    apiId: 'OHQ670',
    text: "In the past year, were you unable to eat because of problems with your mouth?",
    type: 'choice',
    icon: Smile,
    category: "Oral Health",
    module: 'oral',
    options: [
      { label: 'Very often', value: 'very_often', apiValue: 0, riskWeight: 3 },
      { label: 'Fairly often', value: 'fairly_often', apiValue: 1, riskWeight: 2 },
      { label: 'Occasionally', value: 'occasionally', apiValue: 2, riskWeight: 1 },
      { label: 'Hardly ever', value: 'hardly_ever', apiValue: 3, riskWeight: 0 },
      { label: 'Never', value: 'never', apiValue: 4, riskWeight: 0 },
    ],
  },
  {
    id: 'mouth_job_difficulty',
    apiId: 'OHQ640',
    text: "In the past year, have you had difficulty doing your job because of problems with your mouth?",
    type: 'choice',
    icon: Smile,
    category: "Oral Health",
    module: 'oral',
    options: [
      { label: 'Very often', value: 'very_often', apiValue: 0, riskWeight: 3 },
      { label: 'Fairly often', value: 'fairly_often', apiValue: 1, riskWeight: 2 },
      { label: 'Occasionally', value: 'occasionally', apiValue: 2, riskWeight: 1 },
      { label: 'Hardly ever', value: 'hardly_ever', apiValue: 3, riskWeight: 0 },
      { label: 'Never', value: 'never', apiValue: 4, riskWeight: 0 },
    ],
  },
  {
    id: 'mouth_embarrassed',
    apiId: 'OHQ680',
    text: "In the past year, have you felt embarrassed because of your mouth?",
    type: 'choice',
    icon: Smile,
    category: "Oral Health",
    module: 'oral',
    options: [
      { label: 'Very often', value: 'very_often', apiValue: 0, riskWeight: 3 },
      { label: 'Fairly often', value: 'fairly_often', apiValue: 1, riskWeight: 2 },
      { label: 'Occasionally', value: 'occasionally', apiValue: 2, riskWeight: 1 },
      { label: 'Hardly ever', value: 'hardly_ever', apiValue: 3, riskWeight: 0 },
      { label: 'Never', value: 'never', apiValue: 4, riskWeight: 0 },
    ],
  },

  // === BACKGROUND / DEMOGRAPHICS / FINANCIAL ===
  {
    id: 'ethnicity',
    apiId: 'RIDRETH3',
    text: "What is your race or ethnic background?",
    type: 'choice',
    icon: User,
    category: "Background",
    module: 'financial',
    options: [
      { label: 'White / European', value: 'white-european', apiValue: 2, riskWeight: 0 },
      { label: 'Black / African', value: 'black-african', apiValue: 3, riskWeight: 0 },
      { label: 'Afro-Caribbean', value: 'afro-caribbean', apiValue: 3, riskWeight: 0 },
      { label: 'Hispanic / Latino', value: 'hispanic-latino', apiValue: 1, riskWeight: 0 },
      { label: 'East Asian', value: 'east-asian', apiValue: 4, riskWeight: 0 },
      { label: 'South Asian', value: 'south-asian', apiValue: 4, riskWeight: 0 },
      { label: 'Southeast Asian', value: 'southeast-asian', apiValue: 4, riskWeight: 0 },
      { label: 'Middle Eastern / North African', value: 'middle-eastern', apiValue: 5, riskWeight: 0 },
      { label: 'Native American / Indigenous', value: 'native-american', apiValue: 5, riskWeight: 0 },
      { label: 'Pacific Islander', value: 'pacific-islander', apiValue: 5, riskWeight: 0 },
      { label: 'Mixed / Multiracial', value: 'mixed-multiracial', apiValue: 5, riskWeight: 0 },
      { label: 'Prefer not to say', value: 'prefer-not-to-say', apiValue: 5, riskWeight: 0 },
      { label: 'Other', value: 'other', apiValue: 5, riskWeight: 0 },
    ],
  },
  {
    id: 'education',
    apiId: 'DMDEDUC2',
    text: "What is your highest level of education?",
    type: 'choice',
    icon: GraduationCap,
    category: "Background",
    module: 'financial',
    options: [
      { label: 'Less than 9th grade', value: 'less_9th', apiValue: 0, riskWeight: 2 },
      { label: '9-11th grade (no diploma)', value: '9_11th', apiValue: 1, riskWeight: 2 },
      { label: 'High school graduate / GED', value: 'hs_grad', apiValue: 2, riskWeight: 1 },
      { label: 'Some college or AA degree', value: 'some_college', apiValue: 3, riskWeight: 1 },
      { label: 'College graduate or above', value: 'college_grad', apiValue: 4, riskWeight: 0 },
    ],
  },
  {
    id: 'marital_status',
    apiId: 'DMDMARTZ',
    text: "What is your marital status?",
    type: 'choice',
    icon: User,
    category: "Background",
    module: 'financial',
    options: [
      { label: 'Married or living with partner', value: 'married', apiValue: 0, riskWeight: 0 },
      { label: 'Widowed, divorced, or separated', value: 'separated', apiValue: 1, riskWeight: 1 },
      { label: 'Never married', value: 'never_married', apiValue: 2, riskWeight: 0 },
    ],
  },
  {
    id: 'household_size',
    apiId: 'DMDHHSIZ',
    text: "How many people live in your household (including yourself)?",
    type: 'number',
    icon: Home,
    category: "Background",
    module: 'financial',
    placeholder: "Number of people",
    min: 1,
    max: 20,
  },
  {
    id: 'income_poverty_ratio',
    apiId: 'INDFMPIR',
    text: "How would you describe your household income relative to your needs?",
    type: 'choice',
    icon: DollarSign,
    category: "Background",
    module: 'financial',
    options: [
      { label: 'Struggling to meet basic needs', value: 'struggling', apiValue: 0.5, riskWeight: 3 },
      { label: 'Just getting by', value: 'getting_by', apiValue: 1.5, riskWeight: 2 },
      { label: 'Comfortable', value: 'comfortable', apiValue: 3.0, riskWeight: 1 },
      { label: 'Well off', value: 'well_off', apiValue: 5.0, riskWeight: 0 },
    ],
  },
  {
    id: 'monthly_poverty_index',
    apiId: 'INDFMMPI',
    text: "In a typical month, how often does your income cover all expenses?",
    type: 'choice',
    icon: TrendingUp,
    category: "Background",
    module: 'financial',
    options: [
      { label: 'Never - always short', value: 'never', apiValue: 0.5, riskWeight: 3 },
      { label: 'Sometimes - often short', value: 'sometimes', apiValue: 1.0, riskWeight: 2 },
      { label: 'Usually - occasional shortfall', value: 'usually', apiValue: 2.0, riskWeight: 1 },
      { label: 'Always - comfortable margin', value: 'always', apiValue: 4.0, riskWeight: 0 },
    ],
  },
  {
    id: 'savings',
    apiId: 'INQ300',
    text: "Does your family have savings of more than $20,000?",
    type: 'choice',
    icon: DollarSign,
    category: "Background",
    module: 'financial',
    options: [
      { label: 'Yes', value: 'yes', apiValue: 1, riskWeight: 0 },
      { label: 'No', value: 'no', apiValue: 0, riskWeight: 1 },
    ],
  },
  {
    id: 'household_rooms',
    apiId: 'HOD051',
    text: "How many rooms are in your home (excluding bathrooms)?",
    type: 'number',
    icon: Home,
    category: "Background",
    module: 'financial',
    placeholder: "Number of rooms",
    min: 1,
    max: 50,
  },
];

export function getQuestionById(id: string): Question | undefined {
  return baseQuestions.find(q => q.id === id);
}

export function getQuestionByApiId(apiId: string): Question | undefined {
  return baseQuestions.find(q => q.apiId === apiId);
}

export function formatAnswerDisplay(questionId: string, answerValue: string | number, language: 'en' | 'de' = 'en'): string {
  const question = getQuestionById(questionId);
  if (!question) return String(answerValue);
  
  if (question.type === 'number') {
    return `${answerValue} ${question.unit || ''}`.trim();
  }
  
  if (question.type === 'time') {
    return String(answerValue);
  }
  
  if (question.options) {
    const option = question.options.find(o => o.value === answerValue);
    if (option) {
      return option.label;
    }
  }
  
  return String(answerValue);
}

export function getQuestionsByCategory(): Record<string, Question[]> {
  const categories: Record<string, Question[]> = {};
  
  for (const question of baseQuestions) {
    if (!categories[question.category]) {
      categories[question.category] = [];
    }
    categories[question.category].push(question);
  }
  
  return categories;
}

export function getQuestionsByModule(module: Question['module']): Question[] {
  return baseQuestions.filter(q => q.module === module);
}

export const TOTAL_QUESTION_COUNT = baseQuestions.length;
