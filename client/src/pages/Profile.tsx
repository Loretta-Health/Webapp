import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { getUserId } from '@/lib/userId';
import { Check } from 'lucide-react';
import { 
  User, 
  Edit, 
  Heart, 
  Ruler, 
  Scale, 
  Droplets, 
  AlertCircle,
  Home,
  Users,
  ClipboardList,
  Activity,
  ChevronRight,
  ChevronDown,
  Cigarette,
  Wine,
  Utensils,
  Moon,
  Footprints,
  Brain,
  Globe,
  GraduationCap,
  Briefcase,
  Wallet,
  X,
  Save,
  Stethoscope,
  Pill,
  Clock,
  DollarSign,
  Share2,
  CalendarDays
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import marcPhoto from '@assets/image_1764091454235.png';

type Language = 'en' | 'de';

const translations = {
  en: {
    back: 'Back',
    profile: 'Profile',
    healthChampion: 'Health Champion',
    level: 'Level',
    dayStreak: 'Day Streak',
    editProfile: 'Edit Profile',
    tabs: {
      basic: 'Basic',
      social: 'Social',
      questionnaires: 'Questionnaires',
      behaviors: 'Behaviors',
      activity: 'Activity',
    },
    basicInfo: {
      title: 'Basic Information',
      age: 'Age',
      ageValue: '47 years',
      height: 'Height',
      weight: 'Weight',
      bloodType: 'Blood Type',
      allergies: 'Allergies',
      none: 'None',
    },
    socialFactors: {
      title: 'Social Factors',
      ethnicity: 'Ethnicity',
      ethnicityValue: 'Afro-Caribbean',
      socioeconomicStatus: 'Socioeconomic Status',
      socioeconomicValue: 'Lower-middle income',
      educationLevel: 'Education Level',
      educationValue: 'Some college',
      employmentStatus: 'Employment Status',
      employmentValue: 'Employed full-time',
      housingStatus: 'Housing Status',
      housingValue: 'Own home',
    },
    questionnaires: {
      title: 'Questionnaires',
      onboarding: 'Onboarding',
      diet: 'Diet',
      sleep: 'Sleep',
      stress: 'Stress',
      questions: 'questions',
    },
    questionTexts: {
      high_blood_pressure: 'Have you ever been told you have high blood pressure?',
      blood_test_3_years: 'Have you had your blood tested in the last 3 years?',
      prediabetes: 'Have you ever been told you have prediabetes?',
      diabetes: 'Have you ever been told you have diabetes?',
      high_cholesterol: 'Have you been told you have high cholesterol?',
      arthritis: 'Has a doctor ever said you have arthritis?',
      prescription_medicine: 'Have you taken any prescription medicine in the past month?',
      daily_aspirin: 'Have you been advised to take daily aspirin?',
      general_health: 'How would you rate your general health?',
      dental_health: 'How would you rate your dental/gum health?',
      hearing_health: 'How would you rate your hearing health?',
      unsteadiness: 'Have you had issues with unsteadiness or balance?',
      mouth_eating_problems: 'Could you not eat because of mouth or teeth problems?',
      mouth_feel_bad: 'How often do you feel bad because of your mouth condition?',
      video_consult: 'Did you have a video consult with a doctor?',
      moderate_activity: 'How many hours per week do you do moderate physical activity?',
      vigorous_activity: 'How many hours per week do you do vigorous physical activity?',
      sedentary_minutes: 'How many minutes per day are you sedentary?',
      job_type: 'What type of work did you do last week?',
      weekday_sleep: 'How many hours do you typically sleep on weekdays?',
      weekend_sleep: 'How many hours do you typically sleep on weekends?',
      wake_time_weekday: 'What time do you usually wake up on weekdays?',
      sleep_time_weekday: 'What time do you usually go to sleep on weekdays?',
      wake_time_weekend: 'What time do you usually wake up on weekends?',
      sleep_time_weekend: 'What time do you usually go to sleep on weekends?',
      alcohol_frequency: 'How often did you drink alcohol in the past 12 months?',
      age: 'What is your age?',
      height: 'What is your current height?',
      weight_current: 'What is your current weight?',
      weight_year_ago: 'What was your weight 1 year ago?',
      education: 'What is your highest level of education?',
      income_poverty_ratio: 'How would you describe your household income?',
      poverty_index: 'How often does your income cover all expenses?',
      household_rooms: 'How many rooms are in your household?',
      diet_fruits_vegetables: 'How many servings of fruits and vegetables do you eat daily?',
      diet_protein: 'How would you describe your protein intake?',
      diet_sugar: 'How often do you consume sugary foods or drinks?',
      diet_water: 'How many glasses of water do you drink daily?',
      diet_processed_foods: 'How often do you eat processed or fast food?',
      diet_meals_per_day: 'How many meals do you typically eat per day?',
      diet_snacking: 'How often do you snack between meals?',
      diet_restrictions: 'Do you follow any dietary restrictions?',
      sleep_quality: 'How would you rate your overall sleep quality?',
      sleep_duration: 'How many hours of sleep do you get on average?',
      sleep_consistency: 'How consistent is your sleep schedule?',
      sleep_disturbances: 'How often do you experience sleep disturbances?',
      sleep_aids: 'Do you use any sleep aids or medications?',
      sleep_naps: 'How often do you take naps during the day?',
      stress_level: 'How would you rate your current stress level?',
      stress_frequency: 'How often do you feel stressed?',
      stress_coping: 'How well do you cope with stress?',
      stress_work: 'How much does work contribute to your stress?',
      stress_relationships: 'How much do relationships contribute to your stress?',
    },
    behaviors: {
      title: 'Behaviors',
      diet: 'Diet',
      dietValue: 'Low protein, minimal vegetables, high sugar',
      smoking: 'Smoking',
      smokingValue: '10 cigarettes/day',
      alcohol: 'Alcohol',
      alcoholValue: '1 drink/day',
    },
    activity: {
      title: 'Your Activity',
      weeklyAverage: 'Weekly Average',
      steps: 'steps',
      goal: 'Goal',
    },
    editModal: {
      title: 'Edit Profile',
      name: 'Name',
      firstName: 'First Name',
      lastName: 'Last Name',
      basicInfo: 'Basic Information',
      age: 'Age',
      height: 'Height (cm)',
      weight: 'Weight (kg)',
      bloodType: 'Blood Type',
      allergies: 'Allergies',
      socialInfo: 'Social Information',
      ethnicity: 'Ethnicity',
      socioeconomicStatus: 'Socioeconomic Status',
      educationLevel: 'Education Level',
      employmentStatus: 'Employment Status',
      housingStatus: 'Housing Status',
      cancel: 'Cancel',
      save: 'Save Changes',
      saved: 'Profile Updated',
      savedDescription: 'Your profile has been updated successfully.',
    },
  },
  de: {
    back: 'Zurück',
    profile: 'Profil',
    healthChampion: 'Gesundheits-Champion',
    level: 'Stufe',
    dayStreak: 'Tage Serie',
    editProfile: 'Profil bearbeiten',
    tabs: {
      basic: 'Basis',
      social: 'Sozial',
      questionnaires: 'Fragebögen',
      behaviors: 'Verhalten',
      activity: 'Aktivität',
    },
    basicInfo: {
      title: 'Grundinformationen',
      age: 'Alter',
      ageValue: '47 Jahre',
      height: 'Größe',
      weight: 'Gewicht',
      bloodType: 'Blutgruppe',
      allergies: 'Allergien',
      none: 'Keine',
    },
    socialFactors: {
      title: 'Soziale Faktoren',
      ethnicity: 'Ethnizität',
      ethnicityValue: 'Afro-Karibisch',
      socioeconomicStatus: 'Sozioökonomischer Status',
      socioeconomicValue: 'Untere Mittelschicht',
      educationLevel: 'Bildungsniveau',
      educationValue: 'Einige Hochschulsemester',
      employmentStatus: 'Beschäftigungsstatus',
      employmentValue: 'Vollzeit beschäftigt',
      housingStatus: 'Wohnsituation',
      housingValue: 'Eigenheim',
    },
    questionnaires: {
      title: 'Fragebögen',
      onboarding: 'Onboarding',
      diet: 'Ernährung',
      sleep: 'Schlaf',
      stress: 'Stress',
      questions: 'Fragen',
    },
    questionTexts: {
      high_blood_pressure: 'Wurde Ihnen jemals gesagt, dass Sie hohen Blutdruck haben?',
      blood_test_3_years: 'Wurde Ihr Blut in den letzten 3 Jahren getestet?',
      prediabetes: 'Wurde Ihnen jemals gesagt, dass Sie Prädiabetes haben?',
      diabetes: 'Wurde Ihnen jemals gesagt, dass Sie Diabetes haben?',
      high_cholesterol: 'Wurde Ihnen gesagt, dass Sie hohen Cholesterinspiegel haben?',
      arthritis: 'Hat ein Arzt jemals gesagt, dass Sie Arthritis haben?',
      prescription_medicine: 'Haben Sie im letzten Monat verschreibungspflichtige Medikamente eingenommen?',
      daily_aspirin: 'Wurde Ihnen geraten, täglich Aspirin zu nehmen?',
      general_health: 'Wie würden Sie Ihre allgemeine Gesundheit bewerten?',
      dental_health: 'Wie würden Sie Ihre Zahn-/Zahnfleischgesundheit bewerten?',
      hearing_health: 'Wie würden Sie Ihre Hörgesundheit bewerten?',
      unsteadiness: 'Hatten Sie Probleme mit Unsicherheit oder Gleichgewicht?',
      mouth_eating_problems: 'Konnten Sie wegen Mund- oder Zahnproblemen nicht essen?',
      mouth_feel_bad: 'Wie oft fühlen Sie sich wegen Ihres Mundzustands schlecht?',
      video_consult: 'Hatten Sie eine Videokonsultation mit einem Arzt?',
      moderate_activity: 'Wie viele Stunden pro Woche machen Sie mäßige körperliche Aktivität?',
      vigorous_activity: 'Wie viele Stunden pro Woche machen Sie intensive körperliche Aktivität?',
      sedentary_minutes: 'Wie viele Minuten pro Tag sind Sie sesshaft?',
      job_type: 'Welche Art von Arbeit haben Sie letzte Woche gemacht?',
      weekday_sleep: 'Wie viele Stunden schlafen Sie normalerweise an Wochentagen?',
      weekend_sleep: 'Wie viele Stunden schlafen Sie normalerweise am Wochenende?',
      wake_time_weekday: 'Wann stehen Sie normalerweise an Wochentagen auf?',
      sleep_time_weekday: 'Wann gehen Sie normalerweise an Wochentagen schlafen?',
      wake_time_weekend: 'Wann stehen Sie normalerweise am Wochenende auf?',
      sleep_time_weekend: 'Wann gehen Sie normalerweise am Wochenende schlafen?',
      alcohol_frequency: 'Wie oft haben Sie in den letzten 12 Monaten Alkohol getrunken?',
      age: 'Wie alt sind Sie?',
      height: 'Wie groß sind Sie?',
      weight_current: 'Wie viel wiegen Sie aktuell?',
      weight_year_ago: 'Wie viel wogen Sie vor einem Jahr?',
      education: 'Was ist Ihr höchster Bildungsabschluss?',
      income_poverty_ratio: 'Wie würden Sie Ihr Haushaltseinkommen beschreiben?',
      poverty_index: 'Wie oft deckt Ihr Einkommen alle Ausgaben?',
      household_rooms: 'Wie viele Zimmer hat Ihr Haushalt?',
      diet_fruits_vegetables: 'Wie viele Portionen Obst und Gemüse essen Sie täglich?',
      diet_protein: 'Wie würden Sie Ihre Proteinaufnahme beschreiben?',
      diet_sugar: 'Wie oft konsumieren Sie zuckerhaltige Speisen oder Getränke?',
      diet_water: 'Wie viele Gläser Wasser trinken Sie täglich?',
      diet_processed_foods: 'Wie oft essen Sie verarbeitete Lebensmittel oder Fast Food?',
      diet_meals_per_day: 'Wie viele Mahlzeiten essen Sie typischerweise pro Tag?',
      diet_snacking: 'Wie oft naschen Sie zwischen den Mahlzeiten?',
      diet_restrictions: 'Befolgen Sie irgendwelche Ernährungseinschränkungen?',
      sleep_quality: 'Wie würden Sie Ihre allgemeine Schlafqualität bewerten?',
      sleep_duration: 'Wie viele Stunden Schlaf bekommen Sie durchschnittlich?',
      sleep_consistency: 'Wie konsistent ist Ihr Schlafrhythmus?',
      sleep_disturbances: 'Wie oft erleben Sie Schlafstörungen?',
      sleep_aids: 'Verwenden Sie Schlafmittel oder Medikamente?',
      sleep_naps: 'Wie oft machen Sie tagsüber ein Nickerchen?',
      stress_level: 'Wie würden Sie Ihr aktuelles Stressniveau bewerten?',
      stress_frequency: 'Wie oft fühlen Sie sich gestresst?',
      stress_coping: 'Wie gut bewältigen Sie Stress?',
      stress_work: 'Wie viel trägt die Arbeit zu Ihrem Stress bei?',
      stress_relationships: 'Wie viel tragen Beziehungen zu Ihrem Stress bei?',
    },
    behaviors: {
      title: 'Verhaltensweisen',
      diet: 'Ernährung',
      dietValue: 'Wenig Protein, wenig Gemüse, viel Zucker',
      smoking: 'Rauchen',
      smokingValue: '10 Zigaretten/Tag',
      alcohol: 'Alkohol',
      alcoholValue: '1 Getränk/Tag',
    },
    activity: {
      title: 'Deine Aktivität',
      weeklyAverage: 'Wochendurchschnitt',
      steps: 'Schritte',
      goal: 'Ziel',
    },
    editModal: {
      title: 'Profil bearbeiten',
      name: 'Name',
      firstName: 'Vorname',
      lastName: 'Nachname',
      basicInfo: 'Grundinformationen',
      age: 'Alter',
      height: 'Größe (cm)',
      weight: 'Gewicht (kg)',
      bloodType: 'Blutgruppe',
      allergies: 'Allergien',
      socialInfo: 'Soziale Informationen',
      ethnicity: 'Ethnizität',
      socioeconomicStatus: 'Sozioökonomischer Status',
      educationLevel: 'Bildungsniveau',
      employmentStatus: 'Beschäftigungsstatus',
      housingStatus: 'Wohnsituation',
      cancel: 'Abbrechen',
      save: 'Änderungen speichern',
      saved: 'Profil aktualisiert',
      savedDescription: 'Ihr Profil wurde erfolgreich aktualisiert.',
    },
  },
};

const basicInfo = [
  { icon: User, label: 'Age', value: '47 years', iconColor: 'text-primary', bgColor: 'bg-primary/10' },
  { icon: Ruler, label: 'Height', value: '175 cm', iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
  { icon: Scale, label: 'Weight', value: '82 kg', iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
  { icon: Droplets, label: 'Blood Type', value: 'O+', iconColor: 'text-destructive', bgColor: 'bg-destructive/10' },
  { icon: AlertCircle, label: 'Allergies', value: 'None', iconColor: 'text-chart-1', bgColor: 'bg-chart-1/10' },
];

const socialFactors = [
  { icon: Home, label: 'Housing', value: 'Stable housing', status: 'good' },
  { icon: Users, label: 'Support Network', value: 'Family nearby', status: 'good' },
  { icon: Utensils, label: 'Food Security', value: 'Adequate access', status: 'good' },
];

const questionCategories = {
  onboarding: {
    icon: ClipboardList,
    questionIds: [
      'high_blood_pressure',
      'blood_test_3_years',
      'prediabetes',
      'diabetes',
      'high_cholesterol',
      'arthritis',
      'prescription_medicine',
      'daily_aspirin',
      'general_health',
      'dental_health',
      'hearing_health',
      'unsteadiness',
      'mouth_eating_problems',
      'mouth_feel_bad',
      'video_consult',
      'moderate_activity',
      'vigorous_activity',
      'sedentary_minutes',
      'job_type',
      'weekday_sleep',
      'weekend_sleep',
      'wake_time_weekday',
      'sleep_time_weekday',
      'wake_time_weekend',
      'sleep_time_weekend',
      'alcohol_frequency',
      'age',
      'height',
      'weight_current',
      'weight_year_ago',
      'education',
      'income_poverty_ratio',
      'poverty_index',
      'household_rooms',
    ],
  },
  diet: {
    icon: Utensils,
    questionIds: [
      'diet_fruits_vegetables',
      'diet_protein',
      'diet_sugar',
      'diet_water',
      'diet_processed_foods',
      'diet_meals_per_day',
      'diet_snacking',
      'diet_restrictions',
    ],
  },
  sleep: {
    icon: Moon,
    questionIds: [
      'sleep_quality',
      'sleep_duration',
      'sleep_consistency',
      'sleep_disturbances',
      'sleep_aids',
      'sleep_naps',
    ],
  },
  stress: {
    icon: Brain,
    questionIds: [
      'stress_level',
      'stress_frequency',
      'stress_coping',
      'stress_work',
      'stress_relationships',
    ],
  },
};

const behaviors = [
  { icon: Cigarette, label: 'Smoking', value: 'Former smoker', status: 'caution', detail: 'Quit 2 years ago' },
  { icon: Wine, label: 'Alcohol', value: 'Occasional', status: 'good', detail: '2-3 drinks per week' },
  { icon: Utensils, label: 'Diet', value: 'Balanced', status: 'good', detail: 'Mediterranean style' },
  { icon: Moon, label: 'Sleep', value: '6.5 hours avg', status: 'caution', detail: 'Below recommended' },
  { icon: Activity, label: 'Exercise', value: 'Moderate', status: 'good', detail: '3x per week' },
];

const activityData = [
  { day: 'Mon', steps: 8500 },
  { day: 'Tue', steps: 6200 },
  { day: 'Wed', steps: 9100 },
  { day: 'Thu', steps: 7800 },
  { day: 'Fri', steps: 5400 },
  { day: 'Sat', steps: 11200 },
  { day: 'Sun', steps: 4300 },
];

interface ProfileData {
  firstName: string;
  lastName: string;
  age: number;
  height: number;
  weight: number;
  bloodType: string;
  allergies: string;
  ethnicity: string;
  socioeconomicStatus: string;
  educationLevel: string;
  employmentStatus: string;
  housingStatus: string;
}

const defaultProfile: ProfileData = {
  firstName: 'Marc',
  lastName: 'Lewis',
  age: 47,
  height: 175,
  weight: 82,
  bloodType: 'O+',
  allergies: '',
  ethnicity: 'afro-caribbean',
  socioeconomicStatus: 'lower-middle',
  educationLevel: 'some-college',
  employmentStatus: 'full-time',
  housingStatus: 'own',
};

export default function Profile() {
  const [activeTab, setActiveTab] = useState('basic');
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('loretta_language');
    return (saved === 'de' ? 'de' : 'en') as Language;
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    const saved = localStorage.getItem('loretta_profile');
    return saved ? JSON.parse(saved) : defaultProfile;
  });
  const [editForm, setEditForm] = useState<ProfileData>(profileData);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    medications: true,
    missions: true,
    clinicalData: false,
  });
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('loretta_questionnaire_answers');
    return saved ? JSON.parse(saved) : {};
  });
  const [pendingSaves, setPendingSaves] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const userId = getUserId();

  const { data: backendAnswers } = useQuery<Array<{ category: string; answers: Record<string, string> }>>({
    queryKey: ['/api/questionnaires', userId],
    enabled: !!userId,
  });

  useEffect(() => {
    if (backendAnswers && backendAnswers.length > 0) {
      const mergedAnswers: Record<string, string> = {};
      backendAnswers.forEach((item) => {
        Object.assign(mergedAnswers, item.answers);
      });
      const localAnswers = localStorage.getItem('loretta_questionnaire_answers');
      const localParsed = localAnswers ? JSON.parse(localAnswers) : {};
      const combined = { ...mergedAnswers, ...localParsed };
      setQuestionnaireAnswers(combined);
    }
  }, [backendAnswers]);

  const saveAnswersMutation = useMutation({
    mutationFn: async ({ category, answers }: { category: string; answers: Record<string, string> }) => {
      return apiRequest('POST', '/api/questionnaires', {
        userId,
        category,
        answers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questionnaires', userId] });
    },
  });

  const getCategoryForQuestion = (questionId: string): string => {
    for (const [category, data] of Object.entries(questionCategories)) {
      if (data.questionIds.includes(questionId)) {
        return category;
      }
    }
    return 'onboarding';
  };

  const t = translations[language];

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    const newAnswers = { ...questionnaireAnswers, [questionId]: value };
    setQuestionnaireAnswers(newAnswers);
    localStorage.setItem('loretta_questionnaire_answers', JSON.stringify(newAnswers));

    const category = getCategoryForQuestion(questionId);
    const categoryQuestionIds = questionCategories[category as keyof typeof questionCategories].questionIds;
    const categoryAnswers: Record<string, string> = {};
    categoryQuestionIds.forEach((id) => {
      if (newAnswers[id]) {
        categoryAnswers[id] = newAnswers[id];
      }
    });

    setPendingSaves((prev) => ({ ...prev, [category]: true }));
    
    saveAnswersMutation.mutate(
      { category, answers: categoryAnswers },
      {
        onSettled: () => {
          setPendingSaves((prev) => ({ ...prev, [category]: false }));
        },
      }
    );
  }, [questionnaireAnswers, saveAnswersMutation]);

  const getAnsweredCount = (questionIds: string[]) => {
    return questionIds.filter(id => questionnaireAnswers[id]).length;
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'de' : 'en';
    setLanguage(newLang);
    localStorage.setItem('loretta_language', newLang);
  };

  const openEditModal = () => {
    setEditForm(profileData);
    setIsEditOpen(true);
  };

  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileData) => {
      return apiRequest('POST', '/api/profile', {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        age: String(data.age),
        height: String(data.height),
        weight: String(data.weight),
        bloodType: data.bloodType,
        allergies: data.allergies,
        ethnicity: data.ethnicity,
        socioeconomicStatus: data.socioeconomicStatus,
        educationLevel: data.educationLevel,
        employmentStatus: data.employmentStatus,
        housingStatus: data.housingStatus,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile', userId] });
    },
  });

  const handleSave = () => {
    setProfileData(editForm);
    localStorage.setItem('loretta_profile', JSON.stringify(editForm));
    saveProfileMutation.mutate(editForm);
    setIsEditOpen(false);
    toast({
      title: t.editModal.saved,
      description: t.editModal.savedDescription,
    });
  };

  const getDisplayValue = (key: string, value: string) => {
    const displayMaps: Record<string, Record<string, { en: string; de: string }>> = {
      ethnicity: {
        'afro-caribbean': { en: 'Afro-Caribbean', de: 'Afro-Karibisch' },
        'caucasian': { en: 'Caucasian', de: 'Kaukasisch' },
        'asian': { en: 'Asian', de: 'Asiatisch' },
        'hispanic': { en: 'Hispanic', de: 'Hispanisch' },
        'mixed': { en: 'Mixed', de: 'Gemischt' },
        'other': { en: 'Other', de: 'Andere' },
      },
      socioeconomicStatus: {
        'lower': { en: 'Lower income', de: 'Niedriges Einkommen' },
        'lower-middle': { en: 'Lower-middle income', de: 'Untere Mittelschicht' },
        'middle': { en: 'Middle income', de: 'Mittleres Einkommen' },
        'upper-middle': { en: 'Upper-middle income', de: 'Obere Mittelschicht' },
        'upper': { en: 'Upper income', de: 'Hohes Einkommen' },
      },
      educationLevel: {
        'no-formal': { en: 'No formal education', de: 'Keine formale Bildung' },
        'high-school': { en: 'High school', de: 'Gymnasium' },
        'some-college': { en: 'Some college', de: 'Einige Hochschulsemester' },
        'bachelors': { en: "Bachelor's degree", de: 'Bachelorabschluss' },
        'masters': { en: "Master's degree", de: 'Masterabschluss' },
        'doctorate': { en: 'Doctorate', de: 'Promotion' },
      },
      employmentStatus: {
        'full-time': { en: 'Employed full-time', de: 'Vollzeit beschäftigt' },
        'part-time': { en: 'Employed part-time', de: 'Teilzeit beschäftigt' },
        'self-employed': { en: 'Self-employed', de: 'Selbstständig' },
        'unemployed': { en: 'Unemployed', de: 'Arbeitslos' },
        'retired': { en: 'Retired', de: 'Im Ruhestand' },
        'student': { en: 'Student', de: 'Student' },
      },
      housingStatus: {
        'own': { en: 'Own home', de: 'Eigenheim' },
        'rent': { en: 'Renting', de: 'Miete' },
        'family': { en: 'Living with family', de: 'Bei Familie wohnend' },
        'temporary': { en: 'Temporary housing', de: 'Vorübergehende Unterkunft' },
      },
    };
    return displayMaps[key]?.[value]?.[language] || value;
  };

  const getBasicInfo = () => [
    { icon: User, label: t.basicInfo.age, value: `${profileData.age} ${language === 'en' ? 'years' : 'Jahre'}`, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Ruler, label: t.basicInfo.height, value: `${profileData.height} cm`, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    { icon: Scale, label: t.basicInfo.weight, value: `${profileData.weight} kg`, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    { icon: Droplets, label: t.basicInfo.bloodType, value: profileData.bloodType, iconColor: 'text-destructive', bgColor: 'bg-destructive/10' },
    { icon: AlertCircle, label: t.basicInfo.allergies, value: profileData.allergies || t.basicInfo.none, iconColor: 'text-chart-1', bgColor: 'bg-chart-1/10' },
  ];

  const getSocialFactors = () => [
    { label: t.socialFactors.ethnicity, value: getDisplayValue('ethnicity', profileData.ethnicity) },
    { label: t.socialFactors.socioeconomicStatus, value: getDisplayValue('socioeconomicStatus', profileData.socioeconomicStatus) },
    { label: t.socialFactors.educationLevel, value: getDisplayValue('educationLevel', profileData.educationLevel) },
    { label: t.socialFactors.employmentStatus, value: getDisplayValue('employmentStatus', profileData.employmentStatus) },
    { label: t.socialFactors.housingStatus, value: getDisplayValue('housingStatus', profileData.housingStatus) },
  ];

  const getQuestionnaires = () => [
    { 
      key: 'onboarding',
      title: t.questionnaires.onboarding, 
      icon: questionCategories.onboarding.icon,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      questions: questionCategories.onboarding.questionIds.map(id => ({
        id,
        text: t.questionTexts[id as keyof typeof t.questionTexts] || id
      }))
    },
    { 
      key: 'diet',
      title: t.questionnaires.diet, 
      icon: questionCategories.diet.icon,
      iconColor: 'text-chart-3',
      bgColor: 'bg-chart-3/10',
      questions: questionCategories.diet.questionIds.map(id => ({
        id,
        text: t.questionTexts[id as keyof typeof t.questionTexts] || id
      }))
    },
    { 
      key: 'sleep',
      title: t.questionnaires.sleep, 
      icon: questionCategories.sleep.icon,
      iconColor: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
      questions: questionCategories.sleep.questionIds.map(id => ({
        id,
        text: t.questionTexts[id as keyof typeof t.questionTexts] || id
      }))
    },
    { 
      key: 'stress',
      title: t.questionnaires.stress, 
      icon: questionCategories.stress.icon,
      iconColor: 'text-destructive',
      bgColor: 'bg-destructive/10',
      questions: questionCategories.stress.questionIds.map(id => ({
        id,
        text: t.questionTexts[id as keyof typeof t.questionTexts] || id
      }))
    },
  ];

  const getBehaviors = () => [
    { icon: Utensils, label: t.behaviors.diet, value: t.behaviors.dietValue, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    { icon: Cigarette, label: t.behaviors.smoking, value: t.behaviors.smokingValue, iconColor: 'text-destructive', bgColor: 'bg-destructive/10' },
    { icon: Wine, label: t.behaviors.alcohol, value: t.behaviors.alcoholValue, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-primary/10 text-primary border-primary/20';
      case 'caution': return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'warning': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/my-dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                {t.back}
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-black text-white">{t.profile}</h1>
              <p className="text-white/70 text-sm">{language === 'en' ? 'Health Profile' : 'Gesundheitsprofil'}</p>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm"
                className="text-white hover:bg-white/20 gap-2"
                onClick={toggleLanguage}
                data-testid="button-language-toggle"
              >
                <Globe className="w-4 h-4" />
                {language === 'en' ? 'DE' : 'EN'}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsShareOpen(true)}
                data-testid="button-share-profile"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Card - Overlapping Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-16">
        <Card className="p-6 mb-6 border-0 shadow-xl">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary shadow-lg">
                <img 
                  src={marcPhoto} 
                  alt="Marc Lewis" 
                  className="w-full h-full object-cover"
                  data-testid="img-profile-avatar"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-black text-foreground" data-testid="text-profile-name">{profileData.firstName} {profileData.lastName}</h2>
              <button 
                onClick={openEditModal}
                className="text-primary text-sm flex items-center gap-1 justify-center sm:justify-start hover:underline"
                data-testid="button-edit-profile"
              >
                <Edit className="w-3 h-3" />
                {t.editProfile}
              </button>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <Badge className="bg-gradient-to-r from-primary to-chart-2 text-white border-0">{t.level} 14</Badge>
                <Badge variant="outline">59 {t.dayStreak}</Badge>
              </div>
            </div>
            <Link href="/calendar">
              <Button size="icon" variant="outline" className="rounded-xl border-primary/30 hover:bg-primary/10" data-testid="button-calendar">
                <CalendarDays className="w-5 h-5 text-primary" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full" data-testid="profile-tabs">
            <TabsTrigger value="basic" data-testid="tab-basic">{t.tabs.basic}</TabsTrigger>
            <TabsTrigger value="social" data-testid="tab-social">{t.tabs.social}</TabsTrigger>
            <TabsTrigger value="questionnaires" data-testid="tab-questionnaires">{t.tabs.questionnaires}</TabsTrigger>
            <TabsTrigger value="behaviors" data-testid="tab-behaviors">{t.tabs.behaviors}</TabsTrigger>
            <TabsTrigger value="activity" data-testid="tab-activity">{t.tabs.activity}</TabsTrigger>
          </TabsList>

          {/* Basic Information */}
          <TabsContent value="basic">
            <Card className="p-6">
              <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                {t.basicInfo.title}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getBasicInfo().map((info, index) => (
                  <motion.div
                    key={info.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-muted/50 to-muted/30 hover-elevate"
                    data-testid={`info-card-${index}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${info.bgColor} flex items-center justify-center`}>
                      <info.icon className={`w-5 h-5 ${info.iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{info.label}</p>
                      <p className="font-bold text-foreground">{info.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Social Factors */}
          <TabsContent value="social">
            <Card className="p-6">
              <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t.socialFactors.title}
              </h3>
              <div className="divide-y divide-border">
                {getSocialFactors().map((factor, index) => (
                  <motion.div
                    key={factor.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between py-3"
                    data-testid={`social-factor-${index}`}
                  >
                    <p className="text-muted-foreground">{factor.label}</p>
                    <p className="font-medium text-foreground text-right">{factor.value}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Questionnaires */}
          <TabsContent value="questionnaires">
            <Card className="p-6">
              <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {t.questionnaires.title}
              </h3>
              <div className="space-y-3">
                {getQuestionnaires().map((category, index) => {
                  const answeredCount = getAnsweredCount(category.questions.map(q => q.id));
                  const totalCount = category.questions.length;
                  const isComplete = answeredCount === totalCount;
                  
                  return (
                    <motion.div
                      key={category.key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-lg bg-muted/30 overflow-hidden"
                      data-testid={`questionnaire-${category.key}`}
                    >
                      <Collapsible
                        open={expandedCategories[category.key]}
                        onOpenChange={() => toggleCategory(category.key)}
                      >
                        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${category.bgColor} flex items-center justify-center`}>
                              <category.icon className={`w-5 h-5 ${category.iconColor}`} />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-foreground">{category.title}</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                  {answeredCount}/{totalCount} {t.questionnaires.questions}
                                </p>
                                {isComplete && (
                                  <Badge variant="secondary" className="text-xs bg-chart-2/20 text-chart-2">
                                    <Check className="w-3 h-3 mr-1" />
                                    {language === 'en' ? 'Complete' : 'Fertig'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${category.bgColor.replace('/10', '')} transition-all`}
                                style={{ width: `${(answeredCount / totalCount) * 100}%` }}
                              />
                            </div>
                            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedCategories[category.key] ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-4">
                            {category.questions.map((question, qIndex) => (
                              <div
                                key={question.id}
                                className={`p-4 rounded-lg border transition-colors ${
                                  questionnaireAnswers[question.id] 
                                    ? 'bg-chart-2/5 border-chart-2/30' 
                                    : 'bg-background/50 border-transparent'
                                }`}
                                data-testid={`question-${category.key}-${qIndex}`}
                              >
                                <div className="flex items-start gap-3 mb-3">
                                  <span className={`text-xs font-bold min-w-6 ${
                                    questionnaireAnswers[question.id] ? category.iconColor : 'text-muted-foreground'
                                  }`}>
                                    {qIndex + 1}.
                                  </span>
                                  <p className="text-sm text-foreground font-medium">{question.text}</p>
                                </div>
                                <div className="ml-9">
                                  <RadioGroup
                                    value={questionnaireAnswers[question.id] || ''}
                                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                                    className="flex flex-wrap gap-2"
                                  >
                                    <div className="flex items-center">
                                      <RadioGroupItem 
                                        value="yes" 
                                        id={`${question.id}-yes`}
                                        className="peer sr-only"
                                      />
                                      <Label
                                        htmlFor={`${question.id}-yes`}
                                        className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors border ${
                                          questionnaireAnswers[question.id] === 'yes'
                                            ? 'bg-chart-2 text-white border-chart-2'
                                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                        }`}
                                        data-testid={`answer-${question.id}-yes`}
                                      >
                                        {language === 'en' ? 'Yes' : 'Ja'}
                                      </Label>
                                    </div>
                                    <div className="flex items-center">
                                      <RadioGroupItem 
                                        value="no" 
                                        id={`${question.id}-no`}
                                        className="peer sr-only"
                                      />
                                      <Label
                                        htmlFor={`${question.id}-no`}
                                        className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors border ${
                                          questionnaireAnswers[question.id] === 'no'
                                            ? 'bg-destructive text-white border-destructive'
                                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                        }`}
                                        data-testid={`answer-${question.id}-no`}
                                      >
                                        {language === 'en' ? 'No' : 'Nein'}
                                      </Label>
                                    </div>
                                    <div className="flex items-center">
                                      <RadioGroupItem 
                                        value="sometimes" 
                                        id={`${question.id}-sometimes`}
                                        className="peer sr-only"
                                      />
                                      <Label
                                        htmlFor={`${question.id}-sometimes`}
                                        className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors border ${
                                          questionnaireAnswers[question.id] === 'sometimes'
                                            ? 'bg-chart-3 text-white border-chart-3'
                                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                        }`}
                                        data-testid={`answer-${question.id}-sometimes`}
                                      >
                                        {language === 'en' ? 'Sometimes' : 'Manchmal'}
                                      </Label>
                                    </div>
                                    <div className="flex items-center">
                                      <RadioGroupItem 
                                        value="skipped" 
                                        id={`${question.id}-skipped`}
                                        className="peer sr-only"
                                      />
                                      <Label
                                        htmlFor={`${question.id}-skipped`}
                                        className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors border flex items-center gap-1 ${
                                          questionnaireAnswers[question.id] === 'skipped'
                                            ? 'bg-muted text-foreground border-muted-foreground/30'
                                            : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                        }`}
                                        data-testid={`answer-${question.id}-skip`}
                                      >
                                        <Check className="w-3 h-3" />
                                        {language === 'en' ? 'Skip' : 'Überspringen'}
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </div>
                              </div>
                            ))}
                            
                            <div className="pt-4 border-t border-border">
                              <Button
                                onClick={() => {
                                  const categoryAnswers: Record<string, string> = {};
                                  category.questions.forEach(q => {
                                    if (questionnaireAnswers[q.id]) {
                                      categoryAnswers[q.id] = questionnaireAnswers[q.id];
                                    }
                                  });
                                  saveAnswersMutation.mutate({
                                    category: category.key,
                                    answers: categoryAnswers
                                  });
                                  toast({
                                    title: language === 'en' ? 'Saved!' : 'Gespeichert!',
                                    description: language === 'en' 
                                      ? `${category.title} questionnaire has been submitted successfully.`
                                      : `${category.title} Fragebogen wurde erfolgreich eingereicht.`,
                                  });
                                }}
                                className="w-full bg-primary hover:bg-primary/90"
                                disabled={saveAnswersMutation.isPending}
                                data-testid={`submit-${category.key}`}
                              >
                                <Save className="w-4 h-4 mr-2" />
                                {saveAnswersMutation.isPending 
                                  ? (language === 'en' ? 'Saving...' : 'Speichern...') 
                                  : (language === 'en' ? 'Submit' : 'Einreichen')}
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          {/* Behaviors */}
          <TabsContent value="behaviors">
            <Card className="p-6">
              <h3 className="text-lg font-black text-foreground mb-4">
                {t.behaviors.title}
              </h3>
              <div className="space-y-3">
                {getBehaviors().map((behavior, index) => (
                  <motion.div
                    key={behavior.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-lg bg-muted/30"
                    data-testid={`behavior-${index}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${behavior.bgColor}`}>
                      <behavior.icon className={`w-6 h-6 ${behavior.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{behavior.label}</p>
                      <p className="text-sm text-muted-foreground">{behavior.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Activity */}
          <TabsContent value="activity">
            <Card className="p-6">
              <h3 className="text-lg font-black text-foreground mb-4 flex items-center gap-2">
                <Footprints className="w-5 h-5 text-primary" />
                {t.activity.title}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-primary/10 to-chart-2/10">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.activity.weeklyAverage}</p>
                    <p className="text-2xl font-black text-foreground">7.500 {t.activity.steps}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t.activity.goal}</p>
                    <p className="text-2xl font-black text-primary">10.000 {t.activity.steps}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {activityData.map((day, index) => {
                    const percentage = Math.min((day.steps / 10000) * 100, 100);
                    return (
                      <motion.div
                        key={day.day}
                        initial={{ opacity: 0, scaleY: 0 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex flex-col items-center"
                        data-testid={`activity-day-${day.day.toLowerCase()}`}
                      >
                        <div className="w-full h-24 bg-muted/30 rounded-lg relative overflow-hidden">
                          <div 
                            className="absolute bottom-0 w-full bg-gradient-to-t from-primary to-chart-2 rounded-lg transition-all"
                            style={{ height: `${percentage}%` }}
                          />
                        </div>
                        <p className="text-xs font-bold mt-2 text-muted-foreground">{day.day}</p>
                        <p className="text-xs text-foreground">{(day.steps / 1000).toFixed(1)}k</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {language === 'en' ? 'Share with Family & Friends' : 'Mit Familie & Freunden teilen'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              {language === 'en' ? 'Choose what information to share:' : 'Wählen Sie, welche Informationen geteilt werden sollen:'}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    {language === 'en' ? 'Medications' : 'Medikamente'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Share your medication schedule and adherence' 
                      : 'Teilen Sie Ihren Medikamentenplan und die Einhaltung'}
                  </p>
                </div>
                <Switch
                  checked={shareOptions.medications}
                  onCheckedChange={(checked) => 
                    setShareOptions(prev => ({ ...prev, medications: checked }))
                  }
                  data-testid="switch-share-medications"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    {language === 'en' ? 'Missions' : 'Missionen'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Share your health goals and mission progress' 
                      : 'Teilen Sie Ihre Gesundheitsziele und Missionsfortschritte'}
                  </p>
                </div>
                <Switch
                  checked={shareOptions.missions}
                  onCheckedChange={(checked) => 
                    setShareOptions(prev => ({ ...prev, missions: checked }))
                  }
                  data-testid="switch-share-missions"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold text-foreground">
                    {language === 'en' ? 'Clinical Data' : 'Klinische Daten'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Share lab results and health measurements' 
                      : 'Teilen Sie Laborergebnisse und Gesundheitsmessungen'}
                  </p>
                </div>
                <Switch
                  checked={shareOptions.clinicalData}
                  onCheckedChange={(checked) => 
                    setShareOptions(prev => ({ ...prev, clinicalData: checked }))
                  }
                  data-testid="switch-share-clinical"
                />
              </div>
            </div>
            
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              onClick={async () => {
                const shareData = Object.entries(shareOptions)
                  .filter(([_, enabled]) => enabled)
                  .map(([key]) => key)
                  .join(',');
                const shareUrl = `${window.location.origin}/shared-profile/${userId}?data=${shareData}`;
                
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: language === 'en' ? 'Link copied!' : 'Link kopiert!',
                    description: language === 'en' 
                      ? 'Share link has been copied to clipboard' 
                      : 'Der Freigabelink wurde in die Zwischenablage kopiert',
                  });
                  setIsShareOpen(false);
                } catch (err) {
                  toast({
                    title: language === 'en' ? 'Copy failed' : 'Kopieren fehlgeschlagen',
                    description: language === 'en' 
                      ? 'Could not copy link to clipboard' 
                      : 'Link konnte nicht kopiert werden',
                    variant: 'destructive',
                  });
                }
              }}
              data-testid="button-copy-share-link"
            >
              <Copy className="w-4 h-4 mr-2" />
              {language === 'en' ? 'Copy Share Link' : 'Freigabelink kopieren'}
            </Button>
            
            <p className="text-center text-sm text-muted-foreground">
              {language === 'en' ? 'Link expires in 7 days' : 'Link läuft in 7 Tagen ab'}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{t.editModal.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Name Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">{t.editModal.name}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.editModal.firstName}</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.editModal.lastName}</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            </div>

            {/* Basic Info Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">{t.editModal.basicInfo}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">{t.editModal.age}</Label>
                  <Input
                    id="age"
                    type="number"
                    value={editForm.age}
                    onChange={(e) => setEditForm({ ...editForm, age: parseInt(e.target.value) || 0 })}
                    data-testid="input-age"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">{t.editModal.height}</Label>
                  <Input
                    id="height"
                    type="number"
                    value={editForm.height}
                    onChange={(e) => setEditForm({ ...editForm, height: parseInt(e.target.value) || 0 })}
                    data-testid="input-height"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">{t.editModal.weight}</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={editForm.weight}
                    onChange={(e) => setEditForm({ ...editForm, weight: parseInt(e.target.value) || 0 })}
                    data-testid="input-weight"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bloodType">{t.editModal.bloodType}</Label>
                  <Select 
                    value={editForm.bloodType} 
                    onValueChange={(value) => setEditForm({ ...editForm, bloodType: value })}
                  >
                    <SelectTrigger data-testid="select-blood-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="allergies">{t.editModal.allergies}</Label>
                <Input
                  id="allergies"
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  placeholder={language === 'en' ? 'None' : 'Keine'}
                  data-testid="input-allergies"
                />
              </div>
            </div>

            {/* Social Info Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-foreground">{t.editModal.socialInfo}</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ethnicity">{t.editModal.ethnicity}</Label>
                  <Select 
                    value={editForm.ethnicity} 
                    onValueChange={(value) => setEditForm({ ...editForm, ethnicity: value })}
                  >
                    <SelectTrigger data-testid="select-ethnicity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="afro-caribbean">{language === 'en' ? 'Afro-Caribbean' : 'Afro-Karibisch'}</SelectItem>
                      <SelectItem value="caucasian">{language === 'en' ? 'Caucasian' : 'Kaukasisch'}</SelectItem>
                      <SelectItem value="asian">{language === 'en' ? 'Asian' : 'Asiatisch'}</SelectItem>
                      <SelectItem value="hispanic">{language === 'en' ? 'Hispanic' : 'Hispanisch'}</SelectItem>
                      <SelectItem value="mixed">{language === 'en' ? 'Mixed' : 'Gemischt'}</SelectItem>
                      <SelectItem value="other">{language === 'en' ? 'Other' : 'Andere'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="socioeconomicStatus">{t.editModal.socioeconomicStatus}</Label>
                  <Select 
                    value={editForm.socioeconomicStatus} 
                    onValueChange={(value) => setEditForm({ ...editForm, socioeconomicStatus: value })}
                  >
                    <SelectTrigger data-testid="select-socioeconomic">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lower">{language === 'en' ? 'Lower income' : 'Niedriges Einkommen'}</SelectItem>
                      <SelectItem value="lower-middle">{language === 'en' ? 'Lower-middle income' : 'Untere Mittelschicht'}</SelectItem>
                      <SelectItem value="middle">{language === 'en' ? 'Middle income' : 'Mittleres Einkommen'}</SelectItem>
                      <SelectItem value="upper-middle">{language === 'en' ? 'Upper-middle income' : 'Obere Mittelschicht'}</SelectItem>
                      <SelectItem value="upper">{language === 'en' ? 'Upper income' : 'Hohes Einkommen'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="educationLevel">{t.editModal.educationLevel}</Label>
                  <Select 
                    value={editForm.educationLevel} 
                    onValueChange={(value) => setEditForm({ ...editForm, educationLevel: value })}
                  >
                    <SelectTrigger data-testid="select-education">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-formal">{language === 'en' ? 'No formal education' : 'Keine formale Bildung'}</SelectItem>
                      <SelectItem value="high-school">{language === 'en' ? 'High school' : 'Gymnasium'}</SelectItem>
                      <SelectItem value="some-college">{language === 'en' ? 'Some college' : 'Einige Hochschulsemester'}</SelectItem>
                      <SelectItem value="bachelors">{language === 'en' ? "Bachelor's degree" : 'Bachelorabschluss'}</SelectItem>
                      <SelectItem value="masters">{language === 'en' ? "Master's degree" : 'Masterabschluss'}</SelectItem>
                      <SelectItem value="doctorate">{language === 'en' ? 'Doctorate' : 'Promotion'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employmentStatus">{t.editModal.employmentStatus}</Label>
                  <Select 
                    value={editForm.employmentStatus} 
                    onValueChange={(value) => setEditForm({ ...editForm, employmentStatus: value })}
                  >
                    <SelectTrigger data-testid="select-employment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">{language === 'en' ? 'Employed full-time' : 'Vollzeit beschäftigt'}</SelectItem>
                      <SelectItem value="part-time">{language === 'en' ? 'Employed part-time' : 'Teilzeit beschäftigt'}</SelectItem>
                      <SelectItem value="self-employed">{language === 'en' ? 'Self-employed' : 'Selbstständig'}</SelectItem>
                      <SelectItem value="unemployed">{language === 'en' ? 'Unemployed' : 'Arbeitslos'}</SelectItem>
                      <SelectItem value="retired">{language === 'en' ? 'Retired' : 'Im Ruhestand'}</SelectItem>
                      <SelectItem value="student">{language === 'en' ? 'Student' : 'Student'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="housingStatus">{t.editModal.housingStatus}</Label>
                  <Select 
                    value={editForm.housingStatus} 
                    onValueChange={(value) => setEditForm({ ...editForm, housingStatus: value })}
                  >
                    <SelectTrigger data-testid="select-housing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="own">{language === 'en' ? 'Own home' : 'Eigenheim'}</SelectItem>
                      <SelectItem value="rent">{language === 'en' ? 'Renting' : 'Miete'}</SelectItem>
                      <SelectItem value="family">{language === 'en' ? 'Living with family' : 'Bei Familie wohnend'}</SelectItem>
                      <SelectItem value="temporary">{language === 'en' ? 'Temporary housing' : 'Vorübergehende Unterkunft'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel-edit">
              {t.editModal.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-chart-2" data-testid="button-save-profile">
              <Save className="w-4 h-4 mr-2" />
              {t.editModal.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
