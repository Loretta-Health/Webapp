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
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useAuth } from '@/hooks/use-auth';
import { 
  baseQuestions, 
  CORE_QUESTION_COUNT,
  type Question,
  type QuestionnaireAnswer
} from '@/lib/questionnaire';

interface QuestionnaireRecord {
  category: string;
  answers: Record<string, string>;
}
import lorettaLogo from '@assets/logos/loretta_logo.png';
import lorettaLogoHorizontal from '@assets/logos/loretta_logo_horizontal.png';
import mascotImage from '@assets/generated_images/transparent_heart_mascot_character.png';

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

export interface FeatureItem {
  ID: string;
  Value: string;
}

export function buildFeatureJson(answers: QuestionnaireAnswer[]): FeatureItem[] {
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
  return [...baseQuestions];
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
  const [riskScore, setRiskScore] = useState<{ 
    diabetes_probability: number; 
    risk_level: string;
    score: number;
    level: string;
    color: string;
  } | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [numberInput, setNumberInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [liveScore, setLiveScore] = useState<{
    probability: number;
    riskLevel: string;
    answeredCount: number;
    isLoading: boolean;
  } | null>(null);
  const [showModuleSelection, setShowModuleSelection] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const { user } = useAuth();
  const userId = user?.id;
  const { markQuestionnaireComplete, markConsentComplete, isQuestionnaireComplete, isConsentComplete, isOnboardingComplete, isLoading: progressLoading } = useOnboardingProgress();
  const [initialStepSet, setInitialStepSet] = useState(false);

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
    queryKey: ['/api/profile'],
    enabled: !!userId,
  });

  const { data: preferencesData, isLoading: prefsLoading } = useQuery<{ consentAccepted?: boolean } | null>({
    queryKey: ['/api/preferences'],
    enabled: !!userId,
  });
  const profileComplete = !!(profileData?.firstName && profileData?.lastName && profileData?.email) || !!(user?.firstName && user?.lastName && user?.email);
  
  // Get core question IDs for completion check (exclude follow-up questions)
  const coreQuestionIds = baseQuestions.filter(q => q.module === 'core' && !q.followUpFor).map(q => q.id);
  
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
    if (!allLoading && effectiveOnboardingComplete) {
      navigate('/my-dashboard');
    }
  }, [allLoading, effectiveOnboardingComplete, navigate]);

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
        await apiRequest('POST', '/api/questionnaires', {
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
          await apiRequest('POST', '/api/profile', {
            userId,
            ...profileUpdates,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
          console.log('[Onboarding] Synced to profile:', Object.keys(profileUpdates).join(', '));
        }
        
        // Recalculate risk score with updated data
        queryClient.invalidateQueries({ queryKey: ['/api/risk-scores/latest'] });
      } catch (error) {
        console.error('[Onboarding] Auto-save failed:', error);
      }
    }, 1000); // Debounce 1 second
    
    return () => clearTimeout(saveTimer);
  }, [answers, savedAnswersLoaded, userId, lastSavedCount]);
  
  const fetchLiveScore = async (currentAnswers: QuestionnaireAnswer[]) => {
    if (currentAnswers.length < 3) return;
    
    try {
      setLiveScore(prev => prev ? { ...prev, isLoading: true } : { probability: 0, riskLevel: 'Unknown', answeredCount: 0, isLoading: true });
      
      console.log('[LiveScore] Using client-side calculation (ML backend disabled)');
      
      const fallbackScore = calculateRiskScore(currentAnswers);
      const probability = (100 - fallbackScore.score) / 100;
      
      setLiveScore({
        probability: probability,
        riskLevel: fallbackScore.level,
        answeredCount: currentAnswers.length,
        isLoading: false,
      });
    } catch (error) {
      console.log('[LiveScore] Calculation error:', error);
      setLiveScore(prev => prev ? { ...prev, isLoading: false } : null);
    }
  };

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
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
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
      return apiRequest('POST', '/api/questionnaires', {
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

  const saveRiskScoreMutation = useMutation({
    mutationFn: async (scoreData: { overallScore: number; diabetesRisk: number; heartRisk: number; strokeRisk: number }) => {
      console.log('Saving risk score:', { userId, ...scoreData });
      return apiRequest('POST', '/api/risk-scores', {
        userId,
        ...scoreData,
      });
    },
    onSuccess: () => {
      console.log('Risk score saved successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/risk-scores'] });
    },
    onError: (error) => {
      console.error('Failed to save risk score:', error);
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
      queryClient.invalidateQueries({ queryKey: ['/api/gamification'] });
    },
    onError: (error) => {
      console.error('Failed to initialize gamification:', error);
    },
  });

  const initializeAchievementsMutation = useMutation({
    mutationFn: async () => {
      console.log('Initializing achievements:', { userId });
      const response = await fetch(`/api/achievements/${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to initialize achievements');
      }
      return response.json();
    },
    onSuccess: () => {
      console.log('Achievements initialized successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/achievements'] });
    },
    onError: (error) => {
      console.error('Failed to initialize achievements:', error);
    },
  });

  const initializeMissionsMutation = useMutation({
    mutationFn: async () => {
      console.log('Initializing missions:', { userId });
      const response = await fetch(`/api/missions/${userId}`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to initialize missions');
      }
      return response.json();
    },
    onSuccess: () => {
      console.log('Missions initialized successfully');
      queryClient.invalidateQueries({ queryKey: ['/api/missions'] });
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

  const stepProgress = {
    welcome: 0,
    consent: 15,
    registration: 20, // Kept for type compatibility but skipped in flow
    questionnaire: 20 + (currentQuestion / questions.length) * 70,
    riskScore: 100,
  };

  const handleConsentAccept = async () => {
    await savePreferencesMutation.mutateAsync({
      consentAccepted: true,
      newsletterSubscribed: newsletterOptIn,
    });
    await markConsentComplete();
    queryClient.invalidateQueries({ queryKey: ['/api/preferences'] });
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
    localStorage.setItem('loretta_user', JSON.stringify(registration));
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
    
    fetchLiveScore(updatedAnswers);

    const updatedQuestions = getQuestionsWithFollowUps(updatedAnswers);
    
    if (currentQuestion === CORE_QUESTION_COUNT - 1 && !showModuleSelection) {
      setShowModuleSelection(true);
      return;
    }
    
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
    
    fetchLiveScore(updatedAnswers);

    if (currentQuestion === CORE_QUESTION_COUNT - 1 && !showModuleSelection) {
      setShowModuleSelection(true);
      return;
    }

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
    
    fetchLiveScore(updatedAnswers);

    if (currentQuestion === CORE_QUESTION_COUNT - 1 && !showModuleSelection) {
      setShowModuleSelection(true);
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      finishQuestionnaire(updatedAnswers);
    }
  };
  
  const handleGetEarlyResults = async () => {
    setIsPredicting(true);
    localStorage.setItem('loretta_questionnaire', JSON.stringify(answers));
    saveQuestionnaireMutation.mutate(answers);
    
    try {
      // Calculate and save risk score
      const fallbackResponse = await apiRequest('POST', `/api/risk-scores/${userId}/calculate`, {});
      const fallbackData = await fallbackResponse.json();
      
      const diabetesProbability = (fallbackData.diabetesRisk || 0) / 100;
      const score = 100 - (fallbackData.overallScore || 50);
      let color = 'text-muted-foreground';
      let level = 'Unknown';
      
      if (score >= 80) { color = 'text-emerald-500'; level = 'Low'; }
      else if (score >= 60) { color = 'text-[#013DC4]'; level = 'Moderate'; }
      else if (score >= 40) { color = 'text-amber-500'; level = 'Elevated'; }
      else { color = 'text-destructive'; level = 'High'; }
      
      const fullScore = {
        diabetes_probability: diabetesProbability,
        risk_level: level,
        score,
        level,
        color,
      };
      
      setRiskScore(fullScore);
      localStorage.setItem('loretta_risk_score', JSON.stringify(fullScore));
      initializeGamificationMutation.mutate();
      initializeAchievementsMutation.mutate();
      initializeMissionsMutation.mutate();
      
      // Mark questionnaire as complete and navigate to risk score page
      await markQuestionnaireComplete();
      navigate('/risk-score');
    } catch (error) {
      console.error('[Prediction] Failed to calculate risk score:', error);
      // Fallback: still navigate even if calculation fails
      await markQuestionnaireComplete();
      navigate('/risk-score');
    } finally {
      setIsPredicting(false);
    }
  };
  
  const handleContinueWithModules = () => {
    setShowModuleSelection(false);
    setCurrentQuestion(CORE_QUESTION_COUNT);
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
    setIsPredicting(true);
    localStorage.setItem('loretta_questionnaire', JSON.stringify(finalAnswers));
    saveQuestionnaireMutation.mutate(finalAnswers);
    
    // ML backend disabled - using legacy calculation endpoint directly
    console.log('[Prediction] Using legacy calculation (ML backend disabled)');
    
    try {
      // Call the server-side calculation endpoint
      const fallbackResponse = await apiRequest('POST', `/api/risk-scores/${userId}/calculate`, {});
      const fallbackData = await fallbackResponse.json();
      
      const diabetesProbability = (fallbackData.diabetesRisk || 0) / 100;
      const score = 100 - (fallbackData.overallScore || 50);
      let color = 'text-muted-foreground';
      let level = 'Unknown';
      
      if (score >= 80) { color = 'text-emerald-500'; level = 'Low'; }
      else if (score >= 60) { color = 'text-[#013DC4]'; level = 'Moderate'; }
      else if (score >= 40) { color = 'text-amber-500'; level = 'Elevated'; }
      else { color = 'text-destructive'; level = 'High'; }
      
      const fullScore = {
        diabetes_probability: diabetesProbability,
        risk_level: level,
        score,
        level,
        color,
      };
      
      setRiskScore(fullScore);
      localStorage.setItem('loretta_risk_score', JSON.stringify(fullScore));
      initializeGamificationMutation.mutate();
      initializeAchievementsMutation.mutate();
      initializeMissionsMutation.mutate();
      setStep('riskScore');
    } catch (fallbackError) {
      // Server-side calculation failed - use client-side calculation as fallback
      console.log('[Fallback] Server calculation failed, using client-side calculation');
      const fallbackScore = calculateRiskScore(finalAnswers);
      const diabetesProbability = (100 - fallbackScore.score) / 100;
      const fullScore = {
        diabetes_probability: diabetesProbability,
        risk_level: fallbackScore.level,
        score: fallbackScore.score,
        level: fallbackScore.level,
        color: fallbackScore.color,
      };
      setRiskScore(fullScore);
      localStorage.setItem('loretta_risk_score', JSON.stringify(fullScore));
      
      saveRiskScoreMutation.mutate({
        overallScore: fallbackScore.score,
        diabetesRisk: 100 - fallbackScore.score,
        heartRisk: 0,
        strokeRisk: 0,
      });
      
      initializeGamificationMutation.mutate();
      initializeAchievementsMutation.mutate();
      initializeMissionsMutation.mutate();
      setStep('riskScore');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleComplete = async () => {
    const success = await markQuestionnaireComplete();
    if (success) {
      navigate('/my-dashboard');
    }
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

    if (currentQuestion === CORE_QUESTION_COUNT - 1 && !showModuleSelection) {
      setShowModuleSelection(true);
      return;
    }

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
      <motion.img
        src={mascotImage}
        alt="Loretta Mascot"
        className="w-24 h-24 mx-auto"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      
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
                    <h3 className="font-black text-foreground text-sm">LORETTA HEALTH UG — GDPR CONSENT & PRIVACY POLICY (EN)</h3>
                    <p className="text-[10px] mt-1">Last Updated: November 25, 2025 | Effective Date: November 25, 2025</p>
                  </div>
                  
                  <p>This Privacy and Consent Policy explains how Loretta Health UG (haftungsbeschränkt) ("Loretta", "we", "us") processes your personal and health data when you use the Loretta mobile application. Loretta provides wellbeing insights, behavioural support, and analysis of medical information. We do not provide diagnosis or medical treatment.</p>
                  
                  <p><strong>You choose what you share and may withdraw consent at any time.</strong></p>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">1. Controller</h4>
                    <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Germany<br/>Email: privacy@loretta.care</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">2. Categories of Data Processed</h4>
                    <p><strong>2.1 Account Data</strong><br/>Name, email, password (encrypted), age, gender identity, language, profile settings.</p>
                    <p><strong>2.2 Health and Wellbeing Data</strong><br/>Self reported symptoms, stress indicators, lifestyle information, and optional identity attributes (ethnicity, sexuality, disability). These fields are always voluntary.</p>
                    <p><strong>2.3 Wearable Data</strong><br/>With your consent, we may process data from Apple Health or Google Fit including: steps, activity, sleep, heart rate, HRV, blood oxygen, ECG (if available), cycle data, and other metrics supported by your device. You may disconnect wearables at any time.</p>
                    <p><strong>2.4 Uploaded Medical Documents</strong><br/>Medical documents are used to generate explanations and are deleted immediately after processing.</p>
                    <p><strong>2.5 Coarse Location</strong><br/>We process only approximate regional location to identify environmental and wellbeing factors. We do not collect precise GPS location.</p>
                    <p><strong>2.6 Technical and Device Data</strong><br/>Operating system, device type, crash logs, app usage logs, IP address (anonymised), and permission settings.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">3. Purposes of Processing</h4>
                    <p><strong>3.1 Service Delivery</strong><br/>To provide personalised insights, document explanations, behaviour support, and health-equity–aware features.</p>
                    <p><strong>3.2 Fairness and Safety</strong><br/>To ensure equitable model performance, reduce bias, and maintain accuracy across demographic groups. Only authorised data scientists and engineers may access limited datasets where necessary.</p>
                    <p><strong>3.3 Research and Development</strong><br/>Pseudonymised data may be used for statistical analysis and model improvement. You may opt out at any time.</p>
                    <p><strong>3.4 Security and Compliance</strong><br/>To monitor system integrity, detect misuse, ensure secure operation, and fulfil regulatory requirements.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">4. Legal Bases</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Explicit consent (Art. 6(1)(a), Art. 9(2)(a))</li>
                      <li>Performance of a contract (Art. 6(1)(b))</li>
                      <li>Legitimate interests for security and product improvement (Art. 6(1)(f))</li>
                      <li>Research/statistics under safeguards (Art. 9(2)(j))</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">5. Special Category and Identity Data</h4>
                    <p>Optional identity attributes are used only to improve fairness, accuracy, and representation. They are not used for advertising, exclusion, or automated decision-making with legal effect.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">6. Sharing of Data</h4>
                    <p>Data may be shared with:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Staleaway (EU-based hosting provider)</li>
                      <li>Google Workspace (email services)</li>
                      <li>Pseudonymised research environments (EU-based)</li>
                      <li>Individuals you choose to share data with</li>
                    </ul>
                    <p className="font-bold mt-2">We do not sell your data.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">7. International Transfers</h4>
                    <p>Data is hosted in the EU. If transfers occur, we apply SCCs and supplementary safeguards.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">8. Retention</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Account data: until deleted by the user</li>
                      <li>Wearable and behavioural data: only as long as necessary</li>
                      <li>Medical uploads: deleted immediately</li>
                      <li>Research data: pseudonymised and retained under governance rules</li>
                      <li>Logs: retained for security and stability</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">9. Security Measures</h4>
                    <p>Encryption, pseudonymisation, RBAC, monitoring, secure development environments, auditing, EU-based infrastructure.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">10. Access Restrictions</h4>
                    <p>Only authorised data scientists and engineers may access certain data when required for maintenance or fairness monitoring.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">11. Automated Decision-Making</h4>
                    <p>Loretta does not engage in automated decision-making producing legal or significant effects.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">12. User Rights</h4>
                    <p>You have the right to access, correct, delete, restrict, object, withdraw consent, and request portability. Contact: privacy@loretta.care</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">13. Children</h4>
                    <p>The service is not intended for users under 16.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">14. Updates</h4>
                    <p>We may update this Policy. Significant changes will be communicated.</p>
                  </div>
                </TabsContent>
                
                <TabsContent value="de" className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  <div className="text-center border-b border-border pb-3">
                    <h3 className="font-black text-foreground text-sm">LORETTA HEALTH UG — DATENSCHUTZ- UND EINWILLIGUNGSERKLÄRUNG (DE)</h3>
                    <p className="text-[10px] mt-1">Letzte Aktualisierung: November 25, 2025 | Gültig ab: November 25, 2025</p>
                  </div>
                  
                  <p>Diese Erklärung beschreibt, wie die Loretta Health UG (haftungsbeschränkt) („Loretta", „wir") personenbezogene und gesundheitsbezogene Daten verarbeitet. Loretta bietet personalisierte Einblicke, Wohlbefindensunterstützung und Erklärungen zu medizinischen Informationen. Wir stellen keine Diagnosen und führen keine medizinischen Behandlungen durch.</p>
                  
                  <p><strong>Sie entscheiden, welche Daten Sie teilen, und können Ihre Einwilligung jederzeit widerrufen.</strong></p>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">1. Verantwortlicher</h4>
                    <p>Loretta Health UG (haftungsbeschränkt)<br/>Cuvrystraße 53, 10997 Berlin, Deutschland<br/>E-Mail: privacy@loretta.care</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">2. Verarbeitete Datenkategorien</h4>
                    <p><strong>2.1 Kontodaten</strong><br/>Name, E-Mail, Passwort (verschlüsselt), Alter, Geschlechtsidentität, Spracheinstellungen, Profileinstellungen.</p>
                    <p><strong>2.2 Gesundheits- und Wellnessdaten</strong><br/>Selbst eingegebene Beschwerden, Stressindikatoren, Lebensstilinformatonen sowie freiwillige Identitätsmerkmale (ethnische Zugehörigkeit, sexuelle Orientierung, Behinderung).</p>
                    <p><strong>2.3 Wearable-Daten</strong><br/>Mit Ihrer Einwilligung verarbeiten wir Daten aus Apple Health oder Google Fit: Schritte, Aktivität, Schlaf, Herzfrequenz, HRV, Blutsauerstoff, EKG (falls verfügbar), Zyklusdaten und weitere Gerätemesswerte.</p>
                    <p><strong>2.4 Hochgeladene medizinische Dokumente</strong><br/>Dokumente werden analysiert und anschließend sofort gelöscht.</p>
                    <p><strong>2.5 Grober Standort</strong><br/>Wir verarbeiten nur ungefähre Region für kontextbezogene Hinweise. Keine genaue GPS-Erfassung.</p>
                    <p><strong>2.6 Technische Daten</strong><br/>Geräteinformationen, Absturzberichte, Logdaten, anonymisierte IP-Adresse und Berechtigungseinstellungen.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">3. Zwecke der Verarbeitung</h4>
                    <p><strong>3.1 Bereitstellung des Dienstes</strong><br/>Personalisierte Einblicke, Dokumentenerklärungen, Verhaltensunterstützung, chancengerechte Gesundheitsfunktionen.</p>
                    <p><strong>3.2 Fairness und Sicherheit</strong><br/>Sicherstellung gerechter Modellergebnisse, Vermeidung von Bias. Zugriff nur durch autorisierte Data Scientists und Entwickler.</p>
                    <p><strong>3.3 Forschung und Weiterentwicklung</strong><br/>Pseudonymisierte Daten für statistische Analyse und Modellverbesserung. Nutzer können widersprechen.</p>
                    <p><strong>3.4 Sicherheit und Compliance</strong><br/>Systemintegrität, Missbrauchsvermeidung, sicherer Betrieb, regulatorische Anforderungen.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">4. Rechtsgrundlagen</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ausdrückliche Einwilligung</li>
                      <li>Vertragserfüllung</li>
                      <li>Berechtigtes Interesse für Sicherheit und Verbesserung</li>
                      <li>Forschung/Statistik mit Schutzmaßnahmen</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">5. Besondere Kategorien und Identitätsdaten</h4>
                    <p>Optionale Identitätsmerkmale werden ausschließlich zur Fairnessverbesserung verwendet und niemals für Werbung, Ausschluss oder rechtlich relevante Entscheidungen genutzt.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">6. Weitergabe</h4>
                    <p>Datenweitergabe erfolgt nur an:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Staleaway (EU-Hosting)</li>
                      <li>Google Workspace (E-Mail)</li>
                      <li>Forschungspartner mit pseudonymisierten Daten</li>
                      <li>Personen, mit denen Sie selbst teilen</li>
                    </ul>
                    <p className="font-bold mt-2">Kein Datenverkauf.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">7. Internationale Übermittlungen</h4>
                    <p>Daten werden in der EU gespeichert; falls abweichend, werden Standardvertragsklauseln genutzt.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">8. Aufbewahrung</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Kontodaten: bis zur Löschung</li>
                      <li>Wearable- und Verhaltensdaten: nur solange erforderlich</li>
                      <li>Dokumente: sofort gelöscht</li>
                      <li>Forschungsdaten: pseudonymisiert nach Vorgaben</li>
                      <li>Logs: zur Sicherheit begrenzt aufbewahrt</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">9. Sicherheit</h4>
                    <p>Verschlüsselung, Pseudonymisierung, rollenbasierte Zugriffe, Überwachung, sichere Entwicklungsumgebungen, EU-Hosting.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">10. Zugriffsbeschränkungen</h4>
                    <p>Nur autorisierte Data Scientists und Entwickler bei Bedarf.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">11. Automatisierte Entscheidungen</h4>
                    <p>Keine automatisierten Entscheidungen mit rechtlicher Wirkung.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">12. Nutzerrechte</h4>
                    <p>Zugriff, Berichtigung, Löschung, Einschränkung, Widerspruch, Widerruf und Übertragbarkeit. Kontakt: privacy@loretta.care</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">13. Kinder</h4>
                    <p>Nicht für Nutzer unter 16 Jahren bestimmt.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-foreground">14. Änderungen</h4>
                    <p>Änderungen werden mitgeteilt.</p>
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
    const isInCoreSection = currentQuestion < CORE_QUESTION_COUNT;
    
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

  const renderRiskScore = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6"
    >
      {isPredicting ? (
        <div className="py-12">
          <div className="w-16 h-16 mx-auto border-4 border-[#013DC4] border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-muted-foreground">Analyzing your health data...</p>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] p-1 shadow-xl shadow-[#013DC4]/20"
          >
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center">
              <div className="text-center">
                <span className={`text-4xl font-black ${riskScore?.color}`} data-testid="text-risk-score">{riskScore?.score}</span>
                <p className="text-xs text-muted-foreground">Risk Score</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-2">
            <Badge 
              className={`${riskScore?.color === 'text-emerald-500' ? 'bg-emerald-500' : riskScore?.color === 'text-[#013DC4]' ? 'bg-[#013DC4]' : riskScore?.color === 'text-amber-500' ? 'bg-amber-500' : 'bg-destructive'} text-white font-bold text-lg px-4 py-1 rounded-xl`}
              data-testid="badge-risk-level"
            >
              {riskScore?.level} Risk
            </Badge>
            {riskScore?.diabetes_probability !== undefined && (
              <p className="text-sm text-muted-foreground">
                Diabetes Risk: {(riskScore.diabetes_probability * 100).toFixed(1)}%
              </p>
            )}
          </div>

          {skippedQuestions.length > 0 && (
            <Card className="p-4 bg-muted/30 border-muted">
              <p className="text-sm text-muted-foreground text-center" data-testid="text-skipped-count">
                You did not answer {skippedQuestions.length} {skippedQuestions.length === 1 ? 'question' : 'questions'}
              </p>
            </Card>
          )}

          <Card className="p-6 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-2xl shadow-lg">
            <div className="flex items-center gap-4">
              <img src={mascotImage} alt="Mascot" className="w-16 h-16 object-contain" />
              <div className="text-left">
                <p className="font-bold text-foreground mb-1">
                  {riskScore && riskScore.score >= 60 
                    ? "Great start! Let's keep improving together." 
                    : "We've identified areas where we can help you improve."}
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete daily quests and healthy habits to lower your risk score!
                </p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Card className="p-2 sm:p-3 text-center backdrop-blur-xl bg-[#013DC4]/10 border border-[#013DC4]/20 rounded-xl">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#013DC4] mx-auto mb-1" />
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Earn XP</p>
            </Card>
            <Card className="p-2 sm:p-3 text-center backdrop-blur-xl bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500 mx-auto mb-1" />
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Build Streaks</p>
            </Card>
            <Card className="p-2 sm:p-3 text-center backdrop-blur-xl bg-[#CDB6EF]/20 border border-[#CDB6EF]/30 rounded-xl">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#CDB6EF]" style={{ filter: 'brightness(0.7)' }} />
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Get Healthier</p>
            </Card>
          </div>

          <button
            onClick={handleComplete}
            className="w-full py-4 bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white font-black text-lg rounded-2xl shadow-lg shadow-[#013DC4]/20 transition-all flex items-center justify-center gap-2 min-h-[56px]"
            data-testid="button-go-to-dashboard"
          >
            Start Your Health Journey
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </motion.div>
  );

  if (allLoading || !initialStepSet) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#4B7BE5] p-4">
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
            <span>Complete</span>
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
