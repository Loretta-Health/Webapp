import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronRight, 
  ChevronLeft,
  Shield,
  Lock,
  Eye,
  FileText,
  Watch,
  UserX,
  Ban,
  Heart,
  User,
  Mail,
  Sparkles,
  Activity,
  Moon,
  Flame,
  Pill,
  Stethoscope,
  Scale,
  Ruler,
  Clock,
  Home,
  GraduationCap,
  DollarSign,
  Ear,
  Wine,
  Video,
  AlertTriangle,
  Smile,
  ChevronDown,
  ChevronUp,
  Briefcase,
  TrendingUp,
  HelpCircle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient, authenticatedFetch } from '@/lib/queryClient';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useAuth } from '@/hooks/use-auth';
import { 
  baseQuestions, 
  ONBOARDING_QUESTION_IDS,
  ONBOARDING_QUESTION_COUNT,
  type Question,
  type QuestionnaireAnswer
} from '@/lib/questionnaire';

interface QuestionnaireRecord {
  category: string;
  answers: Record<string, string>;
}
import lorettaLogo from '@assets/logos/loretta_logo.png';
import lorettaLogoHorizontal from '@assets/logos/loretta_logo_horizontal.png';

type OnboardingStep = 'welcome' | 'consent' | 'registration' | 'questionnaire' | 'riskScore';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
}

const privacyPoints = [
  { icon: Eye, title: "You control what you share", description: "All identity fields are optional.", color: "text-[#013DC4]" },
  { icon: Heart, title: "Personalised insights", description: "We use your data to provide personalised health insights.", color: "text-[#CDB6EF]" },
  { icon: FileText, title: "Document privacy", description: "Medical documents are deleted immediately after processing.", color: "text-[#0150FF]" },
  { icon: Watch, title: "Optional integrations", description: "Wearable and location data are only used if you choose.", color: "text-[#013DC4]" },
  { icon: Lock, title: "Data security", description: "We take appropriate measures to protect your data.", color: "text-[#CDB6EF]" },
  { icon: UserX, title: "Your choice", description: "Withdraw consent at any time.", color: "text-[#0150FF]" },
  { icon: Ban, title: "No data selling", description: "We never sell your data.", color: "text-[#013DC4]" }
];


function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function getTimeDifferenceMinutes(time1: string, time2: string): number {
  const mins1 = parseTimeToMinutes(time1);
  const mins2 = parseTimeToMinutes(time2);
  
  let diff = Math.abs(mins1 - mins2);
  if (diff > 720) {
    diff = 1440 - diff;
  }
  return diff;
}

function calculateNumericRiskWeight(questionId: string, value: number, allAnswers: QuestionnaireAnswer[]): number {
  switch (questionId) {
    case 'age':
      if (value >= 75) return 3;
      if (value >= 65) return 2;
      if (value >= 50) return 1;
      return 0;
    
    case 'height':
      return 0;
    
    case 'weight_current': {
      const heightAnswer = allAnswers.find(a => a.questionId === 'height');
      if (heightAnswer && typeof heightAnswer.answer === 'number') {
        const heightM = heightAnswer.answer / 100;
        const bmi = value / (heightM * heightM);
        if (bmi >= 35) return 3;
        if (bmi >= 30) return 2;
        if (bmi >= 25) return 1;
        if (bmi < 18.5) return 2;
        return 0;
      }
      return 0;
    }
    
    case 'weight_year_ago': {
      const currentWeightAnswer = allAnswers.find(a => a.questionId === 'weight_current');
      if (currentWeightAnswer && typeof currentWeightAnswer.answer === 'number') {
        const weightChange = currentWeightAnswer.answer - value;
        const percentChange = Math.abs(weightChange) / value * 100;
        if (percentChange > 10) return 2;
        if (percentChange > 5) return 1;
        return 0;
      }
      return 0;
    }
    
    case 'household_rooms':
      if (value <= 2) return 2;
      if (value <= 3) return 1;
      return 0;
    
    case 'household_size':
      return 0;
    
    case 'moderate_activity':
      if (value >= 5) return 0;
      if (value >= 2.5) return 1;
      if (value >= 1) return 2;
      return 3;
    
    case 'sedentary_hours':
      if (value >= 10) return 3;
      if (value >= 8) return 2;
      if (value >= 6) return 1;
      return 0;
    
    case 'weekday_sleep':
    case 'weekend_sleep':
      if (value < 5) return 3;
      if (value < 6) return 2;
      if (value > 9) return 1;
      if (value >= 7 && value <= 9) return 0;
      return 1;
    
    default:
      return 0;
  }
}

function calculateTimeRiskWeight(questionId: string, value: string, allAnswers: QuestionnaireAnswer[]): number {
  switch (questionId) {
    case 'wake_time_weekday':
      return 0;
    
    case 'sleep_time_weekday':
      return 0;
    
    case 'wake_time_weekend': {
      const weekdayWake = allAnswers.find(a => a.questionId === 'wake_time_weekday');
      if (weekdayWake && typeof weekdayWake.answer === 'string') {
        const diffMinutes = getTimeDifferenceMinutes(value, weekdayWake.answer);
        if (diffMinutes > 180) return 2;
        if (diffMinutes > 120) return 1;
        return 0;
      }
      return 0;
    }
    
    case 'sleep_time_weekend': {
      const weekdaySleep = allAnswers.find(a => a.questionId === 'sleep_time_weekday');
      if (weekdaySleep && typeof weekdaySleep.answer === 'string') {
        const diffMinutes = getTimeDifferenceMinutes(value, weekdaySleep.answer);
        if (diffMinutes > 180) return 2;
        if (diffMinutes > 120) return 1;
        return 0;
      }
      return 0;
    }
    
    default:
      return 0;
  }
}

// Helper to get answer value by question ID
function getAnswerValue(answers: QuestionnaireAnswer[], questionId: string): string | undefined {
  const answer = answers.find(a => a.questionId === questionId);
  return answer ? String(answer.answer) : undefined;
}

// Helper to parse numeric values safely
function parseNumericAnswer(value: string | undefined, defaultValue: number = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Calculate BMI from height (cm) and weight (kg) - metric formula
function calculateBMIMetric(heightCm: number, weightKg: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// Evidence-based risk calculation matching server-side logic
// Uses only diabetes risk as the single health risk score (ML model focus)
function calculateRiskScore(answers: QuestionnaireAnswer[]): { score: number; level: string; color: string } {
  if (answers.length === 0) return { score: 50, level: 'Unknown', color: 'text-muted-foreground' };
  
  let diabetesRisk = 0;
  
  // === BIOMETRIC FACTORS ===
  
  // Get height (cm) and weight (kg) for BMI - using correct question IDs
  const heightCm = parseNumericAnswer(getAnswerValue(answers, 'height'));
  const weightKg = parseNumericAnswer(getAnswerValue(answers, 'weight_current'));
  
  const bmi = calculateBMIMetric(heightCm, weightKg);
  if (bmi > 0) {
    if (bmi < 18.5) { diabetesRisk += 5; }
    else if (bmi >= 25 && bmi < 30) { diabetesRisk += 10; }
    else if (bmi >= 30 && bmi < 35) { diabetesRisk += 18; }
    else if (bmi >= 35 && bmi < 40) { diabetesRisk += 25; }
    else if (bmi >= 40) { diabetesRisk += 30; }
  }
  
  // Weight change in kg
  const weightOneYearAgo = parseNumericAnswer(getAnswerValue(answers, 'weight_year_ago'));
  if (weightOneYearAgo > 0 && weightKg > 0) {
    const weightGainKg = weightKg - weightOneYearAgo;
    if (weightGainKg >= 10) { diabetesRisk += 8; }
    else if (weightGainKg >= 5) { diabetesRisk += 4; }
  }
  
  // Age-based risk
  const age = parseNumericAnswer(getAnswerValue(answers, 'age'));
  if (age >= 75) { diabetesRisk += 25; }
  else if (age >= 65) { diabetesRisk += 22; }
  else if (age >= 55) { diabetesRisk += 18; }
  else if (age >= 45) { diabetesRisk += 12; }
  else if (age >= 35) { diabetesRisk += 5; }
  
  // === MEDICAL HISTORY ===
  
  // High blood pressure
  const hasHighBP = getAnswerValue(answers, 'high_blood_pressure') === 'yes';
  if (hasHighBP) {
    diabetesRisk += 8;
  }
  
  // High cholesterol
  const hasHighCholesterol = getAnswerValue(answers, 'high_cholesterol') === 'yes';
  if (hasHighCholesterol) {
    diabetesRisk += 5;
  }
  
  // Kidney problems - use correct question ID
  const hasKidneyProblems = getAnswerValue(answers, 'kidney_problems') === 'yes';
  if (hasKidneyProblems) {
    diabetesRisk += 12;
  }
  
  // === LIFESTYLE FACTORS ===
  
  // Physical activity
  const moderateActivity = parseNumericAnswer(getAnswerValue(answers, 'moderate_activity'));
  const sedentaryHours = parseNumericAnswer(getAnswerValue(answers, 'sedentary_hours'));
  
  let activityScore = 0;
  if (moderateActivity >= 5) activityScore -= 15;
  else if (moderateActivity >= 2.5) activityScore -= 8;
  else if (moderateActivity >= 1) activityScore += 5;
  else activityScore += 15;
  
  if (sedentaryHours >= 10) activityScore += 12;
  else if (sedentaryHours >= 8) activityScore += 8;
  else if (sedentaryHours >= 6) activityScore += 4;
  
  const activityRiskPoints = Math.max(0, activityScore);
  diabetesRisk += activityRiskPoints;
  
  // Sleep patterns - use correct question IDs from questionnaire
  const weekdaySleep = parseNumericAnswer(getAnswerValue(answers, 'weekday_sleep'), 7);
  const weekendSleep = parseNumericAnswer(getAnswerValue(answers, 'weekend_sleep'), 7);
  const avgSleep = (weekdaySleep + weekendSleep) / 2;
  const hasSleepTrouble = getAnswerValue(answers, 'sleep_trouble') === 'yes';
  
  let sleepScore = 0;
  if (avgSleep < 5) sleepScore += 15;
  else if (avgSleep < 6) sleepScore += 10;
  else if (avgSleep < 7) sleepScore += 5;
  else if (avgSleep > 9) sleepScore += 5;
  if (hasSleepTrouble) sleepScore += 8;
  
  diabetesRisk += sleepScore;
  
  // === GENERAL HEALTH ===
  const generalHealth = getAnswerValue(answers, 'general_health');
  if (generalHealth === 'fair' || generalHealth === 'poor') {
    diabetesRisk += 8;
  } else if (generalHealth === 'excellent') {
    diabetesRisk -= 5;
  }
  
  // === ORAL HEALTH (correlates with metabolic health) ===
  const dentalHealth = getAnswerValue(answers, 'dental_health');
  const hasMouthAching = getAnswerValue(answers, 'mouth_aching') === 'yes';
  const hasMouthEatingProblems = getAnswerValue(answers, 'mouth_eating_problems') === 'yes';
  
  const oralHealthIssues = [
    dentalHealth === 'fair' || dentalHealth === 'poor',
    hasMouthAching,
    hasMouthEatingProblems
  ].filter(Boolean).length;
  
  if (oralHealthIssues >= 2) {
    diabetesRisk += 8;
  } else if (oralHealthIssues >= 1) {
    diabetesRisk += 4;
  }
  
  // === NORMALIZE SCORE ===
  diabetesRisk = Math.max(0, Math.min(100, diabetesRisk));
  
  // Apply minimum baseline for older users
  if (age >= 40 && diabetesRisk < 10) diabetesRisk = 10;
  
  // Use diabetes risk as the single health risk score
  const healthScore = Math.round(100 - diabetesRisk);
  
  if (healthScore >= 80) return { score: healthScore, level: 'Excellent', color: 'text-emerald-500' };
  if (healthScore >= 60) return { score: healthScore, level: 'Good', color: 'text-[#013DC4]' };
  if (healthScore >= 40) return { score: healthScore, level: 'Moderate', color: 'text-amber-500' };
  return { score: healthScore, level: 'Needs Attention', color: 'text-destructive' };
}

function convertTimeToDecimal(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours + (minutes / 60);
}

function cmToInches(cm: number): number {
  return cm / 2.54;
}

function kgToLbs(kg: number): number {
  return kg * 2.20462;
}

interface FeatureItem {
  ID: string;
  Value: string;
}

function buildFeatureJson(answers: QuestionnaireAnswer[]): FeatureItem[] {
  const features: FeatureItem[] = [];
  const allQuestions = [...baseQuestions];
  
  for (const answer of answers) {
    const question = allQuestions.find(q => q.id === answer.questionId);
    if (!question || !question.apiId) continue;
    
    let value: string;
    
    if (question.type === 'choice' && question.options) {
      const selectedOption = question.options.find(opt => opt.value === answer.answer);
      if (selectedOption && selectedOption.apiValue !== undefined) {
        value = String(selectedOption.apiValue);
      } else {
        continue;
      }
    } else if (question.type === 'number' && typeof answer.answer === 'number') {
      switch (question.apiId) {
        case 'WHD010':
          value = String(cmToInches(answer.answer));
          break;
        case 'WHD020':
        case 'WHD050':
          value = String(kgToLbs(answer.answer));
          break;
        case 'HOD051':
          value = String(Math.min(answer.answer - 1, 11));
          break;
        default:
          value = String(answer.answer);
      }
    } else if (question.type === 'time' && typeof answer.answer === 'string') {
      value = String(convertTimeToDecimal(answer.answer));
    } else {
      continue;
    }
    
    features.push({ ID: question.apiId, Value: value });
  }
  
  return features;
}

function getQuestionsWithFollowUps(answers: QuestionnaireAnswer[]): Question[] {
  return baseQuestions.filter(q => (ONBOARDING_QUESTION_IDS as readonly string[]).includes(q.id));
}

export default function Onboarding() {
  const { t } = useTranslation('pages');
  const [, navigate] = useLocation();
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [inviteData, setInviteData] = useState<{ inviterName?: string; organization?: string; code?: string } | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [showFullPolicy, setShowFullPolicy] = useState(false);
  const [registration, setRegistration] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [contactConsent, setContactConsent] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuestionnaireAnswer[]>([]);
  const [skippedQuestions, setSkippedQuestions] = useState<string[]>([]);
  const [wantToSkip, setWantToSkip] = useState(false);
  const [numberInput, setNumberInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [showModuleSelection, setShowModuleSelection] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [calculatedRiskScore, setCalculatedRiskScore] = useState<number | null>(null);
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [scoreCalculationError, setScoreCalculationError] = useState(false);
  const { user } = useAuth();
  const userId = user?.id;
  const { markQuestionnaireComplete, markConsentComplete, isQuestionnaireComplete, isConsentComplete, isOnboardingComplete, isLoading: progressLoading } = useOnboardingProgress();
  const [initialStepSet, setInitialStepSet] = useState(false);

  // Clear stale localStorage when starting onboarding without a logged-in user
  // This prevents cross-user data contamination on shared devices
  useEffect(() => {
    if (!userId) {
      localStorage.removeItem('loretta_user');
      localStorage.removeItem('loretta_profile');
      localStorage.removeItem('loretta_questionnaire_answers');
      localStorage.removeItem('loretta_questionnaire');
      localStorage.removeItem('loretta_risk_score');
    }
  }, [userId]);

  const { data: questionnaireData, isLoading: questLoading } = useQuery<QuestionnaireRecord[]>({
    queryKey: ['/api/questionnaires'],
    enabled: !!userId,
  });

  const { data: profileData, isLoading: profileLoading } = useQuery<{ 
    firstName?: string; 
    lastName?: string; 
    email?: string;
    age?: string;
    height?: string;
    weight?: string;
    ethnicity?: string;
  } | null>({
    queryKey: ['/api/profile', userId],
    enabled: !!userId,
  });

  const { data: preferencesData, isLoading: prefsLoading } = useQuery<{ consentAccepted?: boolean } | null>({
    queryKey: ['/api/preferences', userId],
    enabled: !!userId,
  });
  const profileComplete = !!(profileData?.firstName && profileData?.lastName && profileData?.email) || !!(user?.firstName && user?.lastName && user?.email);
  
  const coreQuestionIds = [...ONBOARDING_QUESTION_IDS];
  
  // Check if all core questions have been answered in saved data
  const getSavedAnswerIds = (): string[] => {
    if (!Array.isArray(questionnaireData) || questionnaireData.length === 0) return [];
    const healthRecord = questionnaireData.find(r => r.category === 'health_risk_assessment');
    if (!healthRecord?.answers) return [];
    return Object.keys(healthRecord.answers);
  };
  
  const savedAnswerIds = getSavedAnswerIds();
  const allCoreQuestionsAnswered = coreQuestionIds.every(id => savedAnswerIds.includes(id));
  const legacyQuestionnaireComplete = allCoreQuestionsAnswered;
  
  const allLoading = progressLoading || questLoading || profileLoading || prefsLoading;
  const effectiveQuestionnaireComplete = isQuestionnaireComplete || legacyQuestionnaireComplete;
  const effectiveConsentComplete = isConsentComplete || preferencesData?.consentAccepted === true;
  const effectiveOnboardingComplete = isOnboardingComplete || effectiveQuestionnaireComplete;
  
  useEffect(() => {
    if (!allLoading && effectiveOnboardingComplete && step !== 'riskScore') {
      navigate('/my-dashboard');
    }
  }, [allLoading, effectiveOnboardingComplete, navigate, step]);

  useEffect(() => {
    if (!allLoading && !initialStepSet && !effectiveOnboardingComplete) {
      let targetStep: OnboardingStep = 'consent';
      
      if (effectiveConsentComplete) {
        targetStep = 'questionnaire';
      }
      
      setStep(targetStep);
      setInitialStepSet(true);
    }
  }, [allLoading, effectiveConsentComplete, effectiveOnboardingComplete, initialStepSet]);

  // Load saved answers from database and pre-fill from profile data
  const [savedAnswersLoaded, setSavedAnswersLoaded] = useState(false);
  
  useEffect(() => {
    if (questLoading || profileLoading || savedAnswersLoaded) return;
    
    const loadedAnswers: QuestionnaireAnswer[] = [];
    const answeredIds = new Set<string>();
    
    // First, load saved questionnaire answers
    if (Array.isArray(questionnaireData) && questionnaireData.length > 0) {
      const healthRecord = questionnaireData.find(r => r.category === 'health_risk_assessment');
      if (healthRecord?.answers && typeof healthRecord.answers === 'object') {
        const savedAnswersRecord = healthRecord.answers as Record<string, string>;
        
        for (const [questionId, answerValue] of Object.entries(savedAnswersRecord)) {
          const question = baseQuestions.find(q => q.id === questionId);
          let riskWeight = 0;
          
          if (question?.options) {
            const matchingOption = question.options.find(o => o.value === answerValue);
            riskWeight = matchingOption?.riskWeight || 0;
          }
          
          loadedAnswers.push({
            questionId,
            answer: answerValue,
            riskWeight,
          });
          answeredIds.add(questionId);
        }
      }
    }
    
    // Pre-fill from profile data for fields that aren't already answered
    if (profileData) {
      const profileMappings: { questionId: string; profileField: keyof typeof profileData; }[] = [
        { questionId: 'age', profileField: 'age' },
        { questionId: 'height', profileField: 'height' },
        { questionId: 'weight_current', profileField: 'weight' },
        { questionId: 'ethnicity', profileField: 'ethnicity' },
      ];
      
      for (const mapping of profileMappings) {
        const profileValue = profileData[mapping.profileField];
        if (profileValue && !answeredIds.has(mapping.questionId)) {
          const question = baseQuestions.find(q => q.id === mapping.questionId);
          let riskWeight = 0;
          
          if (question?.options) {
            const matchingOption = question.options.find(o => o.value === profileValue);
            riskWeight = matchingOption?.riskWeight || 0;
          }
          
          loadedAnswers.push({
            questionId: mapping.questionId,
            answer: profileValue,
            riskWeight,
          });
          answeredIds.add(mapping.questionId);
          console.log(`[Onboarding] Pre-filled ${mapping.questionId} from profile: ${profileValue}`);
        }
      }
    }
    
    if (loadedAnswers.length > 0) {
      setAnswers(loadedAnswers);
      console.log('[Onboarding] Loaded', loadedAnswers.length, 'total answers (questionnaire + profile)');
      
      // Find first unanswered core question
      const firstUnansweredIndex = coreQuestionIds.findIndex(id => !answeredIds.has(id));
      
      if (firstUnansweredIndex !== -1 && firstUnansweredIndex > 0) {
        setCurrentQuestion(firstUnansweredIndex);
        console.log('[Onboarding] Resuming from question', firstUnansweredIndex);
      }
    }
    
    setSavedAnswersLoaded(true);
  }, [questLoading, profileLoading, questionnaireData, profileData, savedAnswersLoaded, coreQuestionIds]);

  // Auto-save answers after each change (debounced) and sync to profile
  const [lastSavedCount, setLastSavedCount] = useState(0);
  
  useEffect(() => {
    if (!savedAnswersLoaded || !userId || answers.length === 0) return;
    if (answers.length === lastSavedCount) return; // No new answers
    
    const saveTimer = setTimeout(async () => {
      const answersRecord: Record<string, string> = {};
      answers.forEach(a => {
        answersRecord[a.questionId] = String(a.answer);
      });
      
      try {
        // Save questionnaire answers
        await apiRequest('POST', '/api/questionnaires?skipRiskCalc=true', {
          userId,
          category: 'health_risk_assessment',
          answers: answersRecord,
        });
        console.log('[Onboarding] Auto-saved', answers.length, 'answers');
        setLastSavedCount(answers.length);
        
        // Sync relevant fields to profile
        const profileUpdates: Record<string, string> = {};
        const questionToProfileMap: Record<string, string> = {
          'age': 'age',
          'height': 'height',
          'weight_current': 'weight',
          'ethnicity': 'ethnicity',
        };
        
        for (const [questionId, profileField] of Object.entries(questionToProfileMap)) {
          const answer = answers.find(a => a.questionId === questionId);
          if (answer) {
            profileUpdates[profileField] = String(answer.answer);
          }
        }
        
        if (Object.keys(profileUpdates).length > 0) {
          await apiRequest('POST', '/api/profile?skipRiskCalc=true', {
            userId,
            ...profileUpdates,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
          console.log('[Onboarding] Synced to profile:', Object.keys(profileUpdates).join(', '));
        }
      } catch (error) {
        console.error('[Onboarding] Auto-save failed:', error);
      }
    }, 1000); // Debounce 1 second
    
    return () => clearTimeout(saveTimer);
  }, [answers, savedAnswersLoaded, userId, lastSavedCount]);
  

  const savePreferencesMutation = useMutation({
    mutationFn: async ({ consentAccepted, newsletterSubscribed }: { consentAccepted: boolean; newsletterSubscribed: boolean }) => {
      console.log('Saving preferences:', { userId, consentAccepted, newsletterSubscribed });
      return apiRequest('POST', '/api/preferences', {
        userId,
        consentAccepted,
        consentDate: new Date().toISOString(),
        newsletterSubscribed,
      });
    },
    onSuccess: () => {
      console.log('Preferences saved successfully');
    },
    onError: (error) => {
      console.error('Failed to save preferences:', error);
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data: RegistrationData) => {
      console.log('Saving profile:', { userId, ...data });
      return apiRequest('POST', '/api/profile', {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      });
    },
    onSuccess: () => {
      console.log('Profile saved successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
    },
    onError: (error) => {
      console.error('Failed to save profile:', error);
    },
  });

  const saveQuestionnaireMutation = useMutation({
    mutationFn: async (answersData: QuestionnaireAnswer[]) => {
      const answersRecord: Record<string, string> = {};
      answersData.forEach(a => {
        answersRecord[a.questionId] = String(a.answer);
      });
      console.log('Saving questionnaire:', { userId, category: 'health_risk_assessment', answersCount: Object.keys(answersRecord).length });
      return apiRequest('POST', '/api/questionnaires?skipRiskCalc=true', {
        userId,
        category: 'health_risk_assessment',
        answers: answersRecord,
      });
    },
    onSuccess: () => {
      console.log('Questionnaire saved successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/questionnaires'] });
    },
    onError: (error) => {
      console.error('Failed to save questionnaire:', error);
    },
  });


  const initializeGamificationMutation = useMutation({
    mutationFn: async () => {
      console.log('Initializing gamification:', { userId });
      return apiRequest('POST', '/api/gamification', {
        userId,
        xp: 100,
        level: 1,
        currentStreak: 1,
        longestStreak: 1,
        lives: 5,
        achievements: ['first_steps'],
      });
    },
    onSuccess: () => {
      console.log('Gamification initialized successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/gamification', userId] });
    },
    onError: (error) => {
      console.error('Failed to initialize gamification:', error);
    },
  });

  const initializeAchievementsMutation = useMutation({
    mutationFn: async () => {
      console.log('Initializing achievements:', { userId });
      const response = await authenticatedFetch(`/api/achievements/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to initialize achievements');
      }
      return response.json();
    },
    onSuccess: () => {
      console.log('Achievements initialized successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/achievements', userId] });
    },
    onError: (error) => {
      console.error('Failed to initialize achievements:', error);
    },
  });

  const initializeMissionsMutation = useMutation({
    mutationFn: async () => {
      console.log('Initializing missions:', { userId });
      const response = await authenticatedFetch(`/api/missions/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to initialize missions');
      }
      return response.json();
    },
    onSuccess: () => {
      console.log('Missions initialized successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/missions', userId] });
    },
    onError: (error) => {
      console.error('Failed to initialize missions:', error);
    },
  });

  useEffect(() => {
    const stored = localStorage.getItem('loretta_invite');
    if (stored) {
      try {
        setInviteData(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse invite data:', e);
      }
    }
  }, []);

  const questions = getQuestionsWithFollowUps(answers);

  const stepProgress: Record<OnboardingStep, number> = {
    welcome: 0,
    consent: 15,
    registration: 20,
    questionnaire: 20 + (currentQuestion / questions.length) * 70,
    riskScore: 100,
  };

  const handleConsentAccept = async () => {
    await savePreferencesMutation.mutateAsync({
      consentAccepted: true,
      newsletterSubscribed: newsletterOptIn,
    });
    await markConsentComplete();
    queryClient.invalidateQueries({ queryKey: ['/api/preferences', userId] });
    setStep('questionnaire');
  };

  const handleConsentDecline = () => {
    savePreferencesMutation.mutate({
      consentAccepted: false,
      newsletterSubscribed: false,
    });
    navigate('/declined');
  };

  const handleRegistrationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Registration data is stored in component state and sent to server via saveProfileMutation
    // No localStorage needed - server is the source of truth
    saveProfileMutation.mutate(registration);
    setStep('questionnaire');
  };

  const handleChoiceAnswer = (option: { label: string; value: string; riskWeight: number }) => {
    const question = questions[currentQuestion];
    const newAnswer: QuestionnaireAnswer = {
      questionId: question.id,
      answer: option.value,
      riskWeight: option.riskWeight,
    };
    
    const updatedAnswers = [...answers.filter(a => a.questionId !== newAnswer.questionId), newAnswer];
    setAnswers(updatedAnswers);
    setNumberInput('');
    setTimeInput('');
    setInputError('');
    setWantToSkip(false);

    const updatedQuestions = getQuestionsWithFollowUps(updatedAnswers);
    
    if (currentQuestion < updatedQuestions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      finishQuestionnaire(updatedAnswers);
    }
  };

  const handleNumberSubmit = () => {
    const question = questions[currentQuestion];
    const value = parseFloat(numberInput);
    
    if (isNaN(value)) {
      setInputError('Please enter a valid number');
      return;
    }
    
    if (question.min !== undefined && value < question.min) {
      setInputError(`Value must be at least ${question.min}`);
      return;
    }
    
    if (question.max !== undefined && value > question.max) {
      setInputError(`Value must be at most ${question.max}`);
      return;
    }
    
    const updatedAnswersWithoutCurrent = answers.filter(a => a.questionId !== question.id);
    const riskWeight = calculateNumericRiskWeight(question.id, value, updatedAnswersWithoutCurrent);
    
    const newAnswer: QuestionnaireAnswer = {
      questionId: question.id,
      answer: value,
      riskWeight,
    };
    
    const updatedAnswers = [...updatedAnswersWithoutCurrent, newAnswer];
    setAnswers(updatedAnswers);
    setNumberInput('');
    setInputError('');
    setWantToSkip(false);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      finishQuestionnaire(updatedAnswers);
    }
  };

  const handleTimeSubmit = () => {
    const question = questions[currentQuestion];
    
    if (!timeInput) {
      setInputError('Please select a time');
      return;
    }
    
    const updatedAnswersWithoutCurrent = answers.filter(a => a.questionId !== question.id);
    const riskWeight = calculateTimeRiskWeight(question.id, timeInput, updatedAnswersWithoutCurrent);
    
    const newAnswer: QuestionnaireAnswer = {
      questionId: question.id,
      answer: timeInput,
      riskWeight,
    };
    
    const updatedAnswers = [...updatedAnswersWithoutCurrent, newAnswer];
    setAnswers(updatedAnswers);
    setTimeInput('');
    setInputError('');
    setWantToSkip(false);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      finishQuestionnaire(updatedAnswers);
    }
  };
  
  const handleGetEarlyResults = async () => {
    await finishQuestionnaire(answers);
  };
  
  const handleContinueWithModules = () => {
    setShowModuleSelection(false);
    setCurrentQuestion(ONBOARDING_QUESTION_COUNT);
  };
  
  const getModuleInfo = (module: string) => {
    const moduleQuestions = baseQuestions.filter(q => q.module === module);
    const moduleIcons: Record<string, typeof Activity> = {
      medical: Stethoscope,
      lifestyle: Moon,
      oral: Smile,
      financial: DollarSign,
    };
    const moduleNames: Record<string, string> = {
      medical: 'Medical History',
      lifestyle: 'Lifestyle & Sleep',
      oral: 'Oral Health',
      financial: 'Background & Financial',
    };
    const moduleDescriptions: Record<string, string> = {
      medical: 'Heart conditions, kidney health, balance issues',
      lifestyle: 'Sleep patterns, activity levels, alcohol use',
      oral: 'Teeth and gum health, eating problems',
      financial: 'Demographics, income, living situation',
    };
    return {
      icon: moduleIcons[module] || Activity,
      name: moduleNames[module] || module,
      description: moduleDescriptions[module] || '',
      questionCount: moduleQuestions.length,
    };
  };

  const finishQuestionnaire = async (finalAnswers: QuestionnaireAnswer[]) => {
    if (userId) {
      localStorage.setItem(`loretta_questionnaire_${userId}`, JSON.stringify(finalAnswers));
    }
    
    setIsCalculatingScore(true);
    setScoreCalculationError(false);
    setStep('riskScore');
    
    try {
      await saveQuestionnaireMutation.mutateAsync(finalAnswers);
    } catch (error) {
      console.error('[Onboarding] Failed to save questionnaire:', error);
    }
    
    try {
      const response = await authenticatedFetch('/api/risk-scores/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        const data = await response.json();
        const score = data.overallScore ?? data.diabetesRisk ?? null;
        setCalculatedRiskScore(score);
      } else {
        console.log('[Prediction] Risk score calculation returned error:', response.status);
        setScoreCalculationError(true);
      }
    } catch (error) {
      console.log('[Prediction] Risk score calculation failed:', error);
      setScoreCalculationError(true);
    }
    
    setIsCalculatingScore(false);
    
    initializeGamificationMutation.mutate();
    initializeAchievementsMutation.mutate();
    initializeMissionsMutation.mutate();
  };
  
  const handleRiskScoreContinue = async () => {
    await markQuestionnaireComplete();
    navigate('/my-dashboard');
  };

  const handleSaveAndExit = async () => {
    try {
      if (step === 'consent' && acknowledged) {
        await savePreferencesMutation.mutateAsync({
          consentAccepted: true,
          newsletterSubscribed: newsletterOptIn,
        });
        await markConsentComplete();
      }
      
      if (step === 'registration' && registration.firstName && registration.lastName && registration.email) {
        await saveProfileMutation.mutateAsync(registration);
      }
      
      if ((step === 'questionnaire' || step === 'registration' || step === 'consent') && answers.length > 0) {
        await saveQuestionnaireMutation.mutateAsync(answers);
        
        const coreAnswered = ONBOARDING_QUESTION_IDS.filter(id =>
          answers.some(a => a.questionId === id)
        ).length;
        if (coreAnswered >= ONBOARDING_QUESTION_IDS.length) {
          try {
            await authenticatedFetch('/api/risk-scores/calculate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({}),
            });
          } catch (e) {
            console.error('[Onboarding] Risk calc on save-and-exit failed:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
    navigate('/my-dashboard');
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
      setNumberInput('');
      setTimeInput('');
      setInputError('');
      setWantToSkip(false);
    }
  };

  const handleSkipQuestion = () => {
    const currentQuestions = questions;
    const question = currentQuestions[currentQuestion];
    
    const newSkippedQuestions = skippedQuestions.includes(question.id) 
      ? skippedQuestions 
      : [...skippedQuestions, question.id];
    setSkippedQuestions(newSkippedQuestions);
    
    const updatedAnswers = answers.filter(a => a.questionId !== question.id);
    setAnswers(updatedAnswers);
    setNumberInput('');
    setTimeInput('');
    setInputError('');
    setWantToSkip(false);

    const updatedQuestions = getQuestionsWithFollowUps(updatedAnswers);
    
    const currentQuestionIndex = currentQuestions.findIndex(q => q.id === question.id);
    const nextQuestionId = currentQuestions[currentQuestionIndex + 1]?.id;
    
    if (nextQuestionId) {
      const nextIndexInUpdated = updatedQuestions.findIndex(q => q.id === nextQuestionId);
      if (nextIndexInUpdated !== -1) {
        setTimeout(() => setCurrentQuestion(nextIndexInUpdated), 300);
      } else if (currentQuestion < updatedQuestions.length - 1) {
        setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
      } else {
        finishQuestionnaire(updatedAnswers);
      }
    } else {
      finishQuestionnaire(updatedAnswers);
    }
  };

  const renderWelcome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center space-y-6"
    >
      <motion.div
        className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Heart className="w-12 h-12 text-white" />
      </motion.div>
      
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2">Welcome to Loretta!</h1>
        {inviteData?.inviterName && (
          <p className="text-muted-foreground">
            You were invited by <span className="font-bold text-[#013DC4]">{inviteData.inviterName}</span>
          </p>
        )}
        {inviteData?.code && (
          <p className="text-sm text-muted-foreground mt-1">
            Invite code: <span className="font-mono">{inviteData.code}</span>
          </p>
        )}
      </div>

      <Card className="p-6 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">Gamified Health Journey</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Earn XP, maintain streaks, unlock achievements</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center shadow-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">Personalized Risk Score</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Understand your health with AI-powered insights</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0150FF] to-[#013DC4] flex items-center justify-center shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-gray-900 dark:text-white">Privacy First</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Your data stays yours, always</p>
            </div>
          </div>
        </div>
      </Card>

      <Button
        onClick={() => setStep('consent')}
        className="w-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-black text-lg py-6 rounded-2xl shadow-lg shadow-[#013DC4]/20"
        data-testid="button-start-onboarding"
      >
        Get Started
        <ChevronRight className="w-5 h-5 ml-2" />
      </Button>

      <Button
        variant="outline"
        onClick={handleSaveAndExit}
        disabled={saveQuestionnaireMutation.isPending}
        className="w-full mt-2 text-muted-foreground"
        data-testid="button-save-and-exit-welcome"
      >
        {saveQuestionnaireMutation.isPending ? 'Saving...' : 'Save and Exit'}
      </Button>
    </motion.div>
  );

  const renderConsent = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] flex items-center justify-center shadow-lg">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Privacy & Consent</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Please review our privacy practices</p>
        </div>
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {privacyPoints.map((point, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-muted/30 to-transparent"
          >
            <point.icon className={`w-5 h-5 ${point.color} flex-shrink-0 mt-0.5`} />
            <div>
              <p className="font-bold text-foreground text-sm">{point.title}</p>
              <p className="text-xs text-muted-foreground">{point.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30"
        data-testid="disclaimer-notice-onboarding"
      >
        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-foreground text-sm">Important Disclaimer</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Loretta is not a diagnostic tool. The information provided is for educational purposes only 
            and should not replace professional medical advice, diagnosis, or treatment. 
            Always consult your healthcare provider.
          </p>
        </div>
      </motion.div>

      <Button
        variant="ghost"
        className="w-full justify-between"
        onClick={() => setShowFullPolicy(!showFullPolicy)}
        data-testid="button-toggle-policy"
      >
        <span className="text-sm">Read Full Privacy Policy</span>
        {showFullPolicy ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </Button>

      <AnimatePresence>
        {showFullPolicy && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground" data-testid="policy-content-onboarding">
              <Tabs defaultValue="en" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="de">Deutsch</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  <div className="text-center border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm">LORETTA HEALTH UG — PRIVACY POLICY</h3>
                    <p className="text-[10px] mt-1">Last Updated: January 21, 2026 | Effective Date: January 21, 2026</p>
                  </div>
                  
                  <div className="space-y-2 p-3 bg-primary/10 rounded-xl">
                    <h4 className="font-bold text-foreground">Privacy at a Glance</h4>
                    <ul className="space-y-1">
                      <li><strong>We never sell your data.</strong> Your health information belongs to you.</li>
                      <li><strong>You're in control.</strong> Access, update, or delete your data at support@loretta.care.</li>
                      <li><strong>Anonymization first.</strong> Your name is anonymized in our database.</li>
                      <li><strong>European data protection.</strong> We're based in Berlin and fully comply with GDPR.</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">1. Data Controller</h4>
                    <p>Loretta Health UG<br/>c/o Scaling Spaces, Cuvrystr. 53<br/>10997 Berlin, Germany<br/>Email: support@loretta.care</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">2. What Data We Collect</h4>
                    <p><strong>Health Data:</strong> Medication information, health risk scores, emotional check-ins, wellbeing data.</p>
                    <p><strong>Personal Information:</strong> Name (anonymized), email address, phone number.</p>
                    <p><strong>Usage Data:</strong> App interactions, features accessed, performance data.</p>
                    <p><strong>Analytics:</strong> Device information, usage patterns via Microsoft Clarity.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">3. How We Use Your Data</h4>
                    <p><strong>Health Services:</strong> Personalized recommendations, health insights, medication tracking, risk score monitoring.</p>
                    <p><strong>Research:</strong> Advancing chronic disease prevention through health AI research.</p>
                    <p><strong>App Improvement:</strong> Analyzing usage patterns, monitoring performance.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">4. Legal Basis (GDPR)</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Consent (Art. 6(1)(a), Art. 9(2)(a)) for health data</li>
                      <li>Legitimate Interest (Art. 6(1)(f)) for analytics</li>
                      <li>Contract Performance (Art. 6(1)(b)) for services</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">5. Your Rights</h4>
                    <p>Access, rectification, erasure, restriction, data portability, objection, and withdrawal of consent. Contact support@loretta.care to exercise your rights.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">6. Data Sharing</h4>
                    <p><strong>We do not sell your personal data.</strong> We may share with service providers (Microsoft Clarity), when required by law, or anonymized data for research.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">7. Contact & Complaints</h4>
                    <p>Questions: support@loretta.care<br/>Complaints: Berlin Commissioner for Data Protection, Friedrichstr. 219, 10969 Berlin</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="de" className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  <div className="text-center border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm">LORETTA HEALTH UG — DATENSCHUTZERKLÄRUNG</h3>
                    <p className="text-[10px] mt-1">Letzte Aktualisierung: 21. Januar 2026 | Gültig ab: 21. Januar 2026</p>
                  </div>
                  
                  <div className="space-y-2 p-3 bg-primary/10 rounded-xl">
                    <h4 className="font-bold text-foreground">Datenschutz auf einen Blick</h4>
                    <ul className="space-y-1">
                      <li><strong>Wir verkaufen niemals Ihre Daten.</strong> Ihre Gesundheitsdaten gehören Ihnen.</li>
                      <li><strong>Sie haben die Kontrolle.</strong> Zugriff, Aktualisierung oder Löschung unter support@loretta.care.</li>
                      <li><strong>Anonymisierung zuerst.</strong> Ihr Name wird in unserer Datenbank anonymisiert.</li>
                      <li><strong>Europäischer Datenschutz.</strong> Wir sind in Berlin ansässig und DSGVO-konform.</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">1. Verantwortlicher</h4>
                    <p>Loretta Health UG<br/>c/o Scaling Spaces, Cuvrystr. 53<br/>10997 Berlin, Deutschland<br/>E-Mail: support@loretta.care</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">2. Welche Daten wir erheben</h4>
                    <p><strong>Gesundheitsdaten:</strong> Medikamenteninformationen, Gesundheitsrisikobewertungen, emotionale Check-ins, Wohlbefindensdaten.</p>
                    <p><strong>Persönliche Daten:</strong> Name (anonymisiert), E-Mail-Adresse, Telefonnummer.</p>
                    <p><strong>Nutzungsdaten:</strong> App-Interaktionen, genutzte Funktionen, Leistungsdaten.</p>
                    <p><strong>Analytik:</strong> Geräteinformationen, Nutzungsmuster über Microsoft Clarity.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">3. Wie wir Ihre Daten verwenden</h4>
                    <p><strong>Gesundheitsdienste:</strong> Personalisierte Empfehlungen, Gesundheitseinblicke, Medikamentenverfolgung, Risikobewertung.</p>
                    <p><strong>Forschung:</strong> Förderung der Prävention chronischer Krankheiten durch KI-Gesundheitsforschung.</p>
                    <p><strong>App-Verbesserung:</strong> Analyse von Nutzungsmustern, Leistungsüberwachung.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">4. Rechtsgrundlage (DSGVO)</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Einwilligung (Art. 6(1)(a), Art. 9(2)(a)) für Gesundheitsdaten</li>
                      <li>Berechtigtes Interesse (Art. 6(1)(f)) für Analytik</li>
                      <li>Vertragserfüllung (Art. 6(1)(b)) für Dienste</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">5. Ihre Rechte</h4>
                    <p>Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch und Widerruf der Einwilligung. Kontakt: support@loretta.care</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">6. Datenweitergabe</h4>
                    <p><strong>Wir verkaufen Ihre Daten nicht.</strong> Weitergabe an Dienstleister (Microsoft Clarity), bei rechtlicher Verpflichtung oder anonymisierte Daten für Forschung.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">7. Kontakt & Beschwerden</h4>
                    <p>Fragen: support@loretta.care<br/>Beschwerden: Berliner Beauftragte für Datenschutz, Friedrichstr. 219, 10969 Berlin</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-3 p-3 rounded-lg border border-[#013DC4]/30 bg-[#013DC4]/5">
        <Checkbox 
          id="consent" 
          checked={acknowledged}
          onCheckedChange={(checked) => setAcknowledged(checked as boolean)}
          data-testid="checkbox-consent"
        />
        <Label htmlFor="consent" className="text-sm cursor-pointer">
          I have read and agree to the privacy policy and consent to the processing of my health data.
        </Label>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
        <Checkbox 
          id="newsletter" 
          checked={newsletterOptIn}
          onCheckedChange={(checked) => setNewsletterOptIn(checked as boolean)}
          data-testid="checkbox-newsletter"
        />
        <Label htmlFor="newsletter" className="text-sm cursor-pointer flex items-start gap-2">
          <Mail className="w-4 h-4 text-[#013DC4] flex-shrink-0 mt-0.5" />
          <span>I would like to receive the Loretta newsletter with health tips and updates. You can unsubscribe at any time.</span>
        </Label>
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleConsentDecline}
          className="flex-1"
          data-testid="button-decline-consent"
        >
          Decline
        </Button>
        <Button
          onClick={handleConsentAccept}
          disabled={!acknowledged}
          className="flex-1 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20"
          data-testid="button-accept-consent"
        >
          Accept & Continue
        </Button>
      </div>

      <Button
        variant="outline"
        onClick={handleSaveAndExit}
        disabled={saveQuestionnaireMutation.isPending}
        className="w-full mt-2 text-muted-foreground"
        data-testid="button-save-and-exit-consent"
      >
        {saveQuestionnaireMutation.isPending ? 'Saving...' : 'Save and Exit'}
      </Button>
    </motion.div>
  );

  const renderRegistration = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center shadow-lg">
          <User className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Create Your Profile</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tell us a bit about yourself</p>
        </div>
      </div>

      <form onSubmit={handleRegistrationSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="firstName"
                placeholder="First name"
                value={registration.firstName}
                onChange={(e) => setRegistration(prev => ({ ...prev, firstName: e.target.value }))}
                className="pl-10"
                required
                data-testid="input-first-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name <span className="text-destructive">*</span></Label>
            <Input
              id="lastName"
              placeholder="Last name"
              value={registration.lastName}
              onChange={(e) => setRegistration(prev => ({ ...prev, lastName: e.target.value }))}
              required
              data-testid="input-last-name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={registration.email}
              onChange={(e) => setRegistration(prev => ({ ...prev, email: e.target.value }))}
              className="pl-10"
              required
              data-testid="input-email"
            />
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
          <Checkbox
            id="contactConsent"
            checked={contactConsent}
            onCheckedChange={(checked) => setContactConsent(checked === true)}
            data-testid="checkbox-contact-consent"
          />
          <Label 
            htmlFor="contactConsent" 
            className="text-sm leading-relaxed cursor-pointer"
          >
            I consent to providing my name and email address. <span className="text-destructive">*</span>
          </Label>
        </div>

        <Card className="p-3 bg-[#013DC4]/5 border-[#013DC4]/20 rounded-2xl">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <Lock className="w-3 h-3 inline mr-1" />
            Your information is never shared without your consent.
          </p>
        </Card>

        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20"
          disabled={!registration.firstName || !registration.lastName || !registration.email || !contactConsent}
          data-testid="button-submit-registration"
        >
          Continue to Health Assessment
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleSaveAndExit}
          disabled={saveQuestionnaireMutation.isPending}
          className="w-full mt-2 text-muted-foreground"
          data-testid="button-save-and-exit-registration"
        >
          {saveQuestionnaireMutation.isPending ? 'Saving...' : 'Save and Exit'}
        </Button>
      </form>
    </motion.div>
  );

  const renderModuleSelection = () => {
    const modules = ['medical', 'lifestyle', 'oral', 'financial'];
    const totalOptionalQuestions = modules.reduce((sum, m) => sum + getModuleInfo(m).questionCount, 0);
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <div className="text-center space-y-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] flex items-center justify-center shadow-xl"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Quick Check Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400">You've answered the most important questions.</p>
        </div>


        <div className="space-y-3">
          <Button
            onClick={handleGetEarlyResults}
            className="w-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-bold py-6 text-lg rounded-2xl shadow-lg shadow-[#013DC4]/20"
            data-testid="button-get-early-results"
          >
            <Flame className="w-5 h-5 mr-2" />
            Get My Results Now
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or improve accuracy</span>
            </div>
          </div>
        </div>

        <Card className="p-4 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-2xl space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#013DC4]" />
            <p className="font-bold text-sm text-gray-900 dark:text-white">Want a more precise score?</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Answer {totalOptionalQuestions} more questions across these optional topics:
          </p>
          
          <div className="grid gap-2">
            {modules.map((module) => {
              const info = getModuleInfo(module);
              const ModuleIcon = info.icon;
              return (
                <div key={module} className="flex items-center gap-3 p-2 rounded-xl bg-white/50 dark:bg-gray-800/50">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#013DC4]/20 to-[#CDB6EF]/20 flex items-center justify-center flex-shrink-0">
                    <ModuleIcon className="w-4 h-4 text-[#013DC4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{info.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{info.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {info.questionCount}
                  </Badge>
                </div>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            onClick={handleContinueWithModules}
            className="w-full"
            data-testid="button-continue-with-modules"
          >
            Continue for Better Accuracy
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </motion.div>
    );
  };

  const renderQuestionnaire = () => {
    if (showModuleSelection) {
      return renderModuleSelection();
    }
    
    const question = questions[currentQuestion];
    const QuestionIcon = question.icon;
    const isFollowUp = question.followUpFor !== undefined;
    const isInCoreSection = currentQuestion < ONBOARDING_QUESTION_COUNT;
    
    return (
      <motion.div
        key={currentQuestion}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6 relative"
      >

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isFollowUp ? "default" : "secondary"} className="font-bold">
              {isFollowUp ? t('onboarding.questionnaire.followUp') : question.category}
            </Badge>
            {isInCoreSection && (
              <Badge variant="outline" className="text-xs border-[#013DC4]/50 text-[#013DC4]">
                {t('onboarding.questionnaire.core')}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground" data-testid="text-question-progress">
            {t('onboarding.questionnaire.progress', { current: currentQuestion + 1, total: questions.length })}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${isFollowUp ? 'bg-gradient-to-br from-[#CDB6EF] to-purple-400' : 'bg-gradient-to-br from-[#013DC4] to-[#0150FF]'}`}>
            <QuestionIcon className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{question.text}</h2>
        </div>

        {question.type === 'choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <motion.div
                key={option.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-4 px-4 hover:border-[#013DC4] hover:bg-[#013DC4]/5"
                  onClick={() => handleChoiceAnswer(option)}
                  data-testid={`option-${option.value}`}
                >
                  <span className="text-sm">{option.label}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {question.type === 'number' && (
          <div className="space-y-4">
            <div className="relative">
              <Input
                type="number"
                placeholder={question.placeholder}
                value={numberInput}
                onChange={(e) => {
                  setNumberInput(e.target.value);
                  setInputError('');
                }}
                min={question.min}
                max={question.max}
                className={`text-lg py-6 ${inputError ? 'border-destructive' : ''}`}
                data-testid="input-number"
              />
              {question.unit && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {question.unit}
                </span>
              )}
            </div>
            {inputError && (
              <p className="text-sm text-destructive flex items-center gap-1" data-testid="text-input-error">
                <AlertTriangle className="w-4 h-4" />
                {inputError}
              </p>
            )}
            <Button
              onClick={handleNumberSubmit}
              disabled={!numberInput}
              className="w-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20"
              data-testid="button-submit-number"
            >
              {t('onboarding.questionnaire.continue')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {question.type === 'time' && (
          <div className="space-y-4">
            <Input
              type="time"
              placeholder={question.placeholder}
              value={timeInput}
              onChange={(e) => {
                setTimeInput(e.target.value);
                setInputError('');
              }}
              className={`text-lg py-6 ${inputError ? 'border-destructive' : ''}`}
              data-testid="input-time"
            />
            {inputError && (
              <p className="text-sm text-destructive flex items-center gap-1" data-testid="text-input-error">
                <AlertTriangle className="w-4 h-4" />
                {inputError}
              </p>
            )}
            <Button
              onClick={handleTimeSubmit}
              disabled={!timeInput}
              className="w-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 font-bold rounded-2xl shadow-lg shadow-[#013DC4]/20"
              data-testid="button-submit-time"
            >
              {t('onboarding.questionnaire.continue')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        <div className="border-t pt-4 mt-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
            <Checkbox 
              id="skip-question" 
              checked={wantToSkip}
              onCheckedChange={(checked) => setWantToSkip(checked as boolean)}
              data-testid="checkbox-skip-question"
            />
            <Label htmlFor="skip-question" className="text-sm cursor-pointer text-muted-foreground">
              {t('onboarding.questionnaire.skipLabel')}
            </Label>
          </div>
          
          {wantToSkip && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              <Button
                variant="outline"
                onClick={handleSkipQuestion}
                className="w-full"
                data-testid="button-skip-question"
              >
                {t('onboarding.questionnaire.skip')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </div>

        {currentQuestion > 0 && (
          <Button
            variant="ghost"
            onClick={goToPreviousQuestion}
            className="w-full"
            data-testid="button-previous-question"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('onboarding.questionnaire.previous')}
          </Button>
        )}

        <Button
          variant="outline"
          onClick={handleSaveAndExit}
          disabled={saveQuestionnaireMutation.isPending}
          className="w-full mt-2 text-muted-foreground"
          data-testid="button-save-and-exit"
        >
          {saveQuestionnaireMutation.isPending ? t('common:common.saving') : t('common:common.saveAndExit')}
        </Button>
      </motion.div>
    );
  };


  const getRiskLevel = (score: number) => {
    if (score <= 20) return { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: '🟢' };
    if (score <= 40) return { label: 'Mild Risk', color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', icon: '🟡' };
    if (score <= 60) return { label: 'Moderate Risk', color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: '🟠' };
    return { label: 'High Risk', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: '🔴' };
  };

  const renderRiskScore = () => {
    if (isCalculatingScore) {
      return (
        <motion.div
          key="risk-calculating"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-xl shadow-[#013DC4]/20 mx-auto mb-6">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Calculating Your Health Score</h2>
          <p className="text-gray-500 dark:text-gray-400">Analyzing your answers with our health model...</p>
        </motion.div>
      );
    }

    if (scoreCalculationError || calculatedRiskScore === null) {
      return (
        <motion.div
          key="risk-error"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-xl shadow-[#013DC4]/20 mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Assessment Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your answers have been saved. Your health risk score will be available on your dashboard shortly.
          </p>
          <button
            onClick={handleRiskScoreContinue}
            className="w-full py-4 px-6 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/30 hover:shadow-xl hover:shadow-[#013DC4]/40 transition-all"
          >
            Continue to Dashboard
          </button>
        </motion.div>
      );
    }

    const riskLevel = getRiskLevel(calculatedRiskScore);

    return (
      <motion.div
        key="risk-result"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="text-center py-6"
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Health Risk Score</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Based on your answers, here's your personalized assessment</p>

        <div className="relative w-40 h-40 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-gray-200 dark:text-gray-700" />
            <circle
              cx="60" cy="60" r="52" fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${(calculatedRiskScore / 100) * 327} 327`}
              className={calculatedRiskScore <= 20 ? 'stroke-green-500' : calculatedRiskScore <= 40 ? 'stroke-yellow-500' : calculatedRiskScore <= 60 ? 'stroke-orange-500' : 'stroke-red-500'}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{calculatedRiskScore}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">out of 100</span>
          </div>
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${riskLevel.bg} ${riskLevel.border} border mb-4`}>
          <span>{riskLevel.icon}</span>
          <span className={`font-semibold ${riskLevel.color}`}>{riskLevel.label}</span>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
          {calculatedRiskScore <= 20
            ? "Great news! Your current health indicators suggest a low risk level. Keep up your healthy habits!"
            : calculatedRiskScore <= 40
            ? "Your health indicators are mostly positive. A few small changes could further reduce your risk."
            : calculatedRiskScore <= 60
            ? "Some of your health indicators suggest moderate risk. Regular check-ups and lifestyle adjustments can help."
            : "Your health indicators suggest elevated risk. We recommend consulting with a healthcare professional for personalized guidance."}
        </p>

        <button
          onClick={handleRiskScoreContinue}
          className="w-full py-4 px-6 bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white font-bold rounded-2xl shadow-lg shadow-[#013DC4]/30 hover:shadow-xl hover:shadow-[#013DC4]/40 transition-all"
        >
          Continue to Dashboard
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          This score is an estimate based on your responses and should not replace professional medical advice.
        </p>
      </motion.div>
    );
  };

  if (allLoading || !initialStepSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 safe-area-top safe-area-bottom">
        <div className="flex flex-col items-center gap-6">
          <img src={lorettaLogoHorizontal} alt="Loretta" className="h-10 sm:h-12 object-contain" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center shadow-xl shadow-[#013DC4]/20">
              <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 font-medium text-sm">Preparing your health journey...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] pt-8 px-4 pb-4 safe-area-top">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#CDB6EF]/30 to-transparent rounded-full blur-3xl" />
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3 relative z-10">
          <img src={lorettaLogoHorizontal} alt="Loretta" className="h-8 object-contain brightness-0 invert drop-shadow-lg" />
        </div>
      </div>
      
      <div className="max-w-lg mx-auto p-4">
        <div className="mb-6">
          <div className="h-3 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner backdrop-blur-xl">
            <div 
              className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg" 
              style={{ width: `${stepProgress[step]}%` }} 
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
            <span>Welcome</span>
            <span>Consent</span>
            <span>Profile</span>
            <span>Assessment</span>
            <span>Results</span>
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl shadow-[#013DC4]/10 p-6">
          <AnimatePresence mode="wait">
            {step === 'welcome' && renderWelcome()}
            {step === 'consent' && renderConsent()}
            {step === 'registration' && renderRegistration()}
            {step === 'questionnaire' && renderQuestionnaire()}
            {step === 'riskScore' && renderRiskScore()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
