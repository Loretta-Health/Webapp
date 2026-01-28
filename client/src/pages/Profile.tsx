import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient, authenticatedFetch } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
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
  ChevronDown,
  Utensils,
  Moon,
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
  CalendarDays,
  Camera,
  Upload,
  MessageSquare,
  Send
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { 
  baseQuestions, 
  getQuestionById, 
  formatAnswerDisplay,
  type Question 
} from '@/lib/questionnaire';

interface GamificationData {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lives: number;
  achievements: string[];
  lastCheckIn: string | null;
}

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
      sedentary_hours: 'How many hours per day do you sit or recline?',
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
      monthly_poverty_index: 'How often does your income cover all expenses?',
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
    feedback: {
      title: 'Send Feedback',
      button: 'Send Feedback',
      subject: 'Subject',
      subjectPlaceholder: 'What is this about?',
      message: 'Message',
      messagePlaceholder: 'Tell us your thoughts, suggestions, or report an issue...',
      category: 'Category',
      categories: {
        general: 'General Feedback',
        bug: 'Report a Bug',
        feature: 'Feature Request',
        mission: 'Mission Suggestion',
        other: 'Other',
      },
      send: 'Send Feedback',
      sending: 'Sending...',
      success: 'Feedback Sent',
      successDescription: 'Thank you for your feedback! We appreciate you taking the time to help us improve.',
      error: 'Failed to Send',
      errorDescription: 'Something went wrong. Please try again later.',
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
      sedentary_hours: 'Wie viele Stunden pro Tag sitzen oder liegen Sie?',
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
      monthly_poverty_index: 'Wie oft deckt Ihr Einkommen alle Ausgaben?',
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
    feedback: {
      title: 'Feedback senden',
      button: 'Feedback senden',
      subject: 'Betreff',
      subjectPlaceholder: 'Worum geht es?',
      message: 'Nachricht',
      messagePlaceholder: 'Teilen Sie uns Ihre Gedanken, Vorschläge oder ein Problem mit...',
      category: 'Kategorie',
      categories: {
        general: 'Allgemeines Feedback',
        bug: 'Fehler melden',
        feature: 'Funktionswunsch',
        mission: 'Missionsvorschlag',
        other: 'Sonstiges',
      },
      send: 'Feedback senden',
      sending: 'Wird gesendet...',
      success: 'Feedback gesendet',
      successDescription: 'Vielen Dank für Ihr Feedback! Wir schätzen es, dass Sie sich die Zeit nehmen, uns zu helfen.',
      error: 'Senden fehlgeschlagen',
      errorDescription: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es später erneut.',
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
    questionIds: baseQuestions.map(q => q.id),
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

const questionTypeMap: Record<string, string> = {
  sleep_quality: 'rating',
  stress_level: 'rating',
  stress_frequency: 'frequency',
  diet_sugar: 'frequency',
  diet_processed_foods: 'frequency',
  diet_snacking: 'frequency',
  sleep_disturbances: 'frequency',
  sleep_naps: 'frequency',
  stress_work: 'level',
  stress_relationships: 'level',
  stress_coping: 'level',
  sleep_consistency: 'level',
  diet_protein: 'level',
  sleep_duration: 'sleep_hours',
  diet_fruits_vegetables: 'servings',
  diet_water: 'glasses',
  diet_meals_per_day: 'meals',
  sleep_aids: 'yes_no',
  diet_restrictions: 'yes_no',
};

const optionSets: Record<string, Array<{ value: string; en: string; de: string; color: string }>> = {
  yes_no: [
    { value: 'yes', en: 'Yes', de: 'Ja', color: 'bg-chart-2' },
    { value: 'no', en: 'No', de: 'Nein', color: 'bg-destructive' },
  ],
  ethnicity: [
    { value: 'white', en: 'White', de: 'Weiß', color: 'bg-primary' },
    { value: 'black', en: 'Black/African American', de: 'Schwarz/Afroamerikanisch', color: 'bg-primary' },
    { value: 'hispanic', en: 'Hispanic/Latino', de: 'Hispanisch/Latino', color: 'bg-primary' },
    { value: 'asian', en: 'Asian', de: 'Asiatisch', color: 'bg-primary' },
    { value: 'other', en: 'Other/Multi-racial', de: 'Andere/Gemischt', color: 'bg-primary' },
  ],
  marital_status: [
    { value: 'married', en: 'Married', de: 'Verheiratet', color: 'bg-chart-2' },
    { value: 'single', en: 'Single', de: 'Ledig', color: 'bg-primary' },
    { value: 'divorced', en: 'Divorced', de: 'Geschieden', color: 'bg-chart-3' },
    { value: 'widowed', en: 'Widowed', de: 'Verwitwet', color: 'bg-chart-1' },
    { value: 'separated', en: 'Separated', de: 'Getrennt', color: 'bg-muted-foreground' },
  ],
  household_size: [
    { value: '1', en: '1 person', de: '1 Person', color: 'bg-chart-3' },
    { value: '2', en: '2 people', de: '2 Personen', color: 'bg-primary' },
    { value: '3', en: '3-4 people', de: '3-4 Personen', color: 'bg-chart-2' },
    { value: '5', en: '5+ people', de: '5+ Personen', color: 'bg-chart-1' },
  ],
  rating: [
    { value: 'excellent', en: 'Excellent', de: 'Ausgezeichnet', color: 'bg-chart-2' },
    { value: 'very_good', en: 'Very Good', de: 'Sehr Gut', color: 'bg-primary' },
    { value: 'good', en: 'Good', de: 'Gut', color: 'bg-chart-3' },
    { value: 'fair', en: 'Fair', de: 'Mäßig', color: 'bg-chart-1' },
    { value: 'poor', en: 'Poor', de: 'Schlecht', color: 'bg-destructive' },
  ],
  frequency: [
    { value: 'never', en: 'Never', de: 'Nie', color: 'bg-chart-2' },
    { value: 'rarely', en: 'Rarely', de: 'Selten', color: 'bg-primary' },
    { value: 'sometimes', en: 'Sometimes', de: 'Manchmal', color: 'bg-chart-3' },
    { value: 'often', en: 'Often', de: 'Oft', color: 'bg-chart-1' },
    { value: 'always', en: 'Always', de: 'Immer', color: 'bg-destructive' },
  ],
  level: [
    { value: 'very_low', en: 'Very Low', de: 'Sehr Niedrig', color: 'bg-chart-2' },
    { value: 'low', en: 'Low', de: 'Niedrig', color: 'bg-primary' },
    { value: 'moderate', en: 'Moderate', de: 'Mäßig', color: 'bg-chart-3' },
    { value: 'high', en: 'High', de: 'Hoch', color: 'bg-chart-1' },
    { value: 'very_high', en: 'Very High', de: 'Sehr Hoch', color: 'bg-destructive' },
  ],
  activity_hours: [
    { value: '0', en: '0 hours', de: '0 Stunden', color: 'bg-destructive' },
    { value: '1', en: '1-2 hours', de: '1-2 Stunden', color: 'bg-chart-1' },
    { value: '3', en: '3-4 hours', de: '3-4 Stunden', color: 'bg-chart-3' },
    { value: '5', en: '5-6 hours', de: '5-6 Stunden', color: 'bg-primary' },
    { value: '7', en: '7+ hours', de: '7+ Stunden', color: 'bg-chart-2' },
  ],
  sedentary: [
    { value: '60', en: '< 1 hour', de: '< 1 Stunde', color: 'bg-chart-2' },
    { value: '120', en: '1-2 hours', de: '1-2 Stunden', color: 'bg-primary' },
    { value: '240', en: '3-4 hours', de: '3-4 Stunden', color: 'bg-chart-3' },
    { value: '360', en: '5-6 hours', de: '5-6 Stunden', color: 'bg-chart-1' },
    { value: '480', en: '7+ hours', de: '7+ Stunden', color: 'bg-destructive' },
  ],
  sleep_hours: [
    { value: '4', en: '< 5 hours', de: '< 5 Stunden', color: 'bg-destructive' },
    { value: '5', en: '5-6 hours', de: '5-6 Stunden', color: 'bg-chart-1' },
    { value: '7', en: '7-8 hours', de: '7-8 Stunden', color: 'bg-chart-2' },
    { value: '9', en: '9-10 hours', de: '9-10 Stunden', color: 'bg-primary' },
    { value: '11', en: '10+ hours', de: '10+ Stunden', color: 'bg-chart-3' },
  ],
  wake_time: [
    { value: '5:00', en: '5:00 - 6:00', de: '5:00 - 6:00', color: 'bg-chart-2' },
    { value: '6:00', en: '6:00 - 7:00', de: '6:00 - 7:00', color: 'bg-primary' },
    { value: '7:00', en: '7:00 - 8:00', de: '7:00 - 8:00', color: 'bg-chart-3' },
    { value: '8:00', en: '8:00 - 9:00', de: '8:00 - 9:00', color: 'bg-chart-1' },
    { value: '9:00', en: '9:00+', de: '9:00+', color: 'bg-destructive' },
  ],
  sleep_time: [
    { value: '21:00', en: '9:00 - 10:00 PM', de: '21:00 - 22:00', color: 'bg-chart-2' },
    { value: '22:00', en: '10:00 - 11:00 PM', de: '22:00 - 23:00', color: 'bg-primary' },
    { value: '23:00', en: '11:00 PM - 12:00', de: '23:00 - 00:00', color: 'bg-chart-3' },
    { value: '00:00', en: '12:00 - 1:00 AM', de: '00:00 - 01:00', color: 'bg-chart-1' },
    { value: '01:00', en: '1:00 AM+', de: '01:00+', color: 'bg-destructive' },
  ],
  age: [
    { value: '18', en: '18-29', de: '18-29', color: 'bg-chart-2' },
    { value: '30', en: '30-39', de: '30-39', color: 'bg-primary' },
    { value: '40', en: '40-49', de: '40-49', color: 'bg-chart-3' },
    { value: '50', en: '50-59', de: '50-59', color: 'bg-chart-1' },
    { value: '60', en: '60-69', de: '60-69', color: 'bg-chart-4' },
    { value: '70', en: '70+', de: '70+', color: 'bg-destructive' },
  ],
  height: [
    { value: '150', en: '< 150 cm', de: '< 150 cm', color: 'bg-chart-3' },
    { value: '160', en: '150-165 cm', de: '150-165 cm', color: 'bg-primary' },
    { value: '170', en: '166-175 cm', de: '166-175 cm', color: 'bg-chart-2' },
    { value: '180', en: '176-185 cm', de: '176-185 cm', color: 'bg-chart-3' },
    { value: '190', en: '186+ cm', de: '186+ cm', color: 'bg-chart-1' },
  ],
  weight: [
    { value: '50', en: '< 50 kg', de: '< 50 kg', color: 'bg-chart-1' },
    { value: '60', en: '50-70 kg', de: '50-70 kg', color: 'bg-chart-2' },
    { value: '80', en: '71-90 kg', de: '71-90 kg', color: 'bg-primary' },
    { value: '100', en: '91-110 kg', de: '91-110 kg', color: 'bg-chart-3' },
    { value: '120', en: '110+ kg', de: '110+ kg', color: 'bg-chart-1' },
  ],
  servings: [
    { value: '0', en: '0 servings', de: '0 Portionen', color: 'bg-destructive' },
    { value: '1', en: '1-2 servings', de: '1-2 Portionen', color: 'bg-chart-1' },
    { value: '3', en: '3-4 servings', de: '3-4 Portionen', color: 'bg-chart-3' },
    { value: '5', en: '5+ servings', de: '5+ Portionen', color: 'bg-chart-2' },
  ],
  glasses: [
    { value: '2', en: '1-2 glasses', de: '1-2 Gläser', color: 'bg-destructive' },
    { value: '4', en: '3-4 glasses', de: '3-4 Gläser', color: 'bg-chart-1' },
    { value: '6', en: '5-6 glasses', de: '5-6 Gläser', color: 'bg-chart-3' },
    { value: '8', en: '7-8 glasses', de: '7-8 Gläser', color: 'bg-primary' },
    { value: '10', en: '8+ glasses', de: '8+ Gläser', color: 'bg-chart-2' },
  ],
  meals: [
    { value: '1', en: '1 meal', de: '1 Mahlzeit', color: 'bg-chart-1' },
    { value: '2', en: '2 meals', de: '2 Mahlzeiten', color: 'bg-chart-3' },
    { value: '3', en: '3 meals', de: '3 Mahlzeiten', color: 'bg-chart-2' },
    { value: '4', en: '4 meals', de: '4 Mahlzeiten', color: 'bg-primary' },
    { value: '5', en: '5+ meals', de: '5+ Mahlzeiten', color: 'bg-chart-1' },
  ],
  rooms: [
    { value: '1', en: '1-2 rooms', de: '1-2 Zimmer', color: 'bg-chart-3' },
    { value: '3', en: '3-4 rooms', de: '3-4 Zimmer', color: 'bg-primary' },
    { value: '5', en: '5-6 rooms', de: '5-6 Zimmer', color: 'bg-chart-2' },
    { value: '7', en: '7+ rooms', de: '7+ Zimmer', color: 'bg-chart-1' },
  ],
  job: [
    { value: 'sedentary', en: 'Sedentary/Desk', de: 'Sitzend/Büro', color: 'bg-chart-1' },
    { value: 'light', en: 'Light Activity', de: 'Leichte Aktivität', color: 'bg-chart-3' },
    { value: 'moderate', en: 'Moderate Activity', de: 'Mäßige Aktivität', color: 'bg-primary' },
    { value: 'heavy', en: 'Heavy Labor', de: 'Schwere Arbeit', color: 'bg-chart-2' },
    { value: 'not_working', en: 'Not Working', de: 'Nicht Arbeitend', color: 'bg-muted-foreground' },
  ],
  education: [
    { value: 'less_than_high_school', en: 'Less than High School', de: 'Weniger als Gymnasium', color: 'bg-chart-1' },
    { value: 'high_school', en: 'High School', de: 'Gymnasium', color: 'bg-chart-3' },
    { value: 'some_college', en: 'Some College', de: 'Einige Hochschule', color: 'bg-primary' },
    { value: 'college', en: 'College Degree', de: 'Hochschulabschluss', color: 'bg-chart-2' },
    { value: 'graduate', en: 'Graduate Degree', de: 'Aufbaustudium', color: 'bg-chart-2' },
  ],
  income: [
    { value: 'low', en: 'Low Income', de: 'Niedriges Einkommen', color: 'bg-chart-1' },
    { value: 'lower_middle', en: 'Lower Middle', de: 'Untere Mittelschicht', color: 'bg-chart-3' },
    { value: 'middle', en: 'Middle Income', de: 'Mittleres Einkommen', color: 'bg-primary' },
    { value: 'upper_middle', en: 'Upper Middle', de: 'Obere Mittelschicht', color: 'bg-chart-2' },
    { value: 'high', en: 'High Income', de: 'Hohes Einkommen', color: 'bg-chart-2' },
  ],
  income_coverage: [
    { value: 'never', en: 'Never', de: 'Nie', color: 'bg-destructive' },
    { value: 'rarely', en: 'Rarely', de: 'Selten', color: 'bg-chart-1' },
    { value: 'sometimes', en: 'Sometimes', de: 'Manchmal', color: 'bg-chart-3' },
    { value: 'usually', en: 'Usually', de: 'Meistens', color: 'bg-primary' },
    { value: 'always', en: 'Always', de: 'Immer', color: 'bg-chart-2' },
  ],
};

const ratingOptions = optionSets.rating;
const frequencyOptions = optionSets.frequency;
const levelOptions = optionSets.level;

const ratingQuestions = new Set(['general_health', 'hearing_health', 'dental_health']);
const frequencyQuestions = new Set(['sleep_trouble', 'alcohol_frequency', 'video_consult']);
const levelQuestions = new Set(['stress_level', 'energy_level']);

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
  profilePhoto: string;
}

const emptyProfile: ProfileData = {
  firstName: '',
  lastName: '',
  age: 0,
  height: 0,
  weight: 0,
  bloodType: '',
  allergies: '',
  ethnicity: '',
  socioeconomicStatus: '',
  educationLevel: '',
  employmentStatus: '',
  housingStatus: '',
  profilePhoto: '',
};

interface BackendProfile {
  firstName: string | null;
  lastName: string | null;
  age: string | null;
  height: string | null;
  weight: string | null;
  bloodType: string | null;
  allergies: string | null;
  ethnicity: string | null;
  socioeconomicStatus: string | null;
  educationLevel: string | null;
  employmentStatus: string | null;
  housingStatus: string | null;
  profilePhoto: string | null;
}

type Language = 'en' | 'de';

export default function Profile() {
  const { t, i18n } = useTranslation('profile');
  useSwipeBack({ backPath: '/my-dashboard' });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('loretta_language');
    return saved === 'de' ? 'de' : 'en';
  });
  const localT = translations[language];
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBasicInfoEditOpen, setIsBasicInfoEditOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfile);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [editForm, setEditForm] = useState<ProfileData>(emptyProfile);
  const [basicInfoForm, setBasicInfoForm] = useState({
    age: 0,
    height: 0,
    weight: 0,
    bloodType: '',
    allergies: '',
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    medications: true,
    missions: true,
    clinicalData: false,
  });
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    subject: '',
    message: '',
    category: 'general',
  });
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('loretta_questionnaire_answers');
    return saved ? JSON.parse(saved) : {};
  });
  const [pendingSaves, setPendingSaves] = useState<Record<string, boolean>>({});
  const [lorettaConsent, setLorettaConsent] = useState<boolean>(true);
  const recalculateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const userId = user?.id;

  interface LorettaMembership {
    id: string;
    teamId: string;
    userId: string;
    role: string;
    consentGiven: boolean;
  }

  const { data: lorettaMembership } = useQuery<LorettaMembership | null>({
    queryKey: ['/api/teams/loretta-community/membership', userId],
    queryFn: async () => {
      const res = await authenticatedFetch('/api/teams/loretta-community/membership');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (lorettaMembership) {
      setLorettaConsent(lorettaMembership.consentGiven);
    }
  }, [lorettaMembership]);

  // Sync local language state with i18n when it changes externally
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      if (lng === 'en' || lng === 'de') {
        setLanguage(lng);
      }
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const updateLorettaConsentMutation = useMutation({
    mutationFn: async (consent: boolean) => {
      const res = await authenticatedFetch(`/api/teams/loretta-community/members/${userId}/consent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent }),
      });
      if (!res.ok) throw new Error('Failed to update consent');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teams/loretta-community/membership', userId] });
    },
  });

  const handleLorettaConsentChange = (checked: boolean) => {
    setLorettaConsent(checked);
    updateLorettaConsentMutation.mutate(checked);
  };

  const { data: backendProfile, isLoading: isProfileLoading } = useQuery<BackendProfile | null>({
    queryKey: ['/api/profile'],
    enabled: !!userId,
  });

  const { data: backendAnswers } = useQuery<Array<{ category: string; answers: Record<string, string> }>>({
    queryKey: ['/api/questionnaires'],
    enabled: !!userId,
  });

  useEffect(() => {
    if ((backendProfile || backendAnswers) && !profileLoaded) {
      // Get questionnaire answers for pre-filling if profile data is missing
      const mergedAnswers: Record<string, string> = {};
      if (backendAnswers && backendAnswers.length > 0) {
        backendAnswers.forEach((item) => {
          Object.assign(mergedAnswers, item.answers);
        });
      }
      
      // Map questionnaire fields to profile fields
      const getQuestionnaireValue = (questionId: string): string | number | undefined => {
        const value = mergedAnswers[questionId];
        return value || undefined;
      };
      
      const loadedProfile: ProfileData = {
        firstName: backendProfile?.firstName || user?.firstName || '',
        lastName: backendProfile?.lastName || user?.lastName || '',
        // Pre-fill from questionnaire if profile is missing but questionnaire has data
        age: backendProfile?.age ? parseInt(backendProfile.age) : 
             (getQuestionnaireValue('age') ? parseInt(String(getQuestionnaireValue('age'))) : 0),
        height: backendProfile?.height ? parseInt(backendProfile.height) : 
                (getQuestionnaireValue('height') ? parseInt(String(getQuestionnaireValue('height'))) : 0),
        weight: backendProfile?.weight ? parseInt(backendProfile.weight) : 
                (getQuestionnaireValue('weight_current') ? parseInt(String(getQuestionnaireValue('weight_current'))) : 0),
        bloodType: backendProfile?.bloodType || '',
        allergies: backendProfile?.allergies || '',
        ethnicity: backendProfile?.ethnicity || 
                   (getQuestionnaireValue('ethnicity') ? String(getQuestionnaireValue('ethnicity')) : ''),
        socioeconomicStatus: backendProfile?.socioeconomicStatus || '',
        educationLevel: backendProfile?.educationLevel || '',
        employmentStatus: backendProfile?.employmentStatus || '',
        housingStatus: backendProfile?.housingStatus || '',
        profilePhoto: backendProfile?.profilePhoto || '',
      };
      
      setProfileData(loadedProfile);
      setEditForm(loadedProfile);
      setProfileLoaded(true);
      
      if (mergedAnswers.age || mergedAnswers.height || mergedAnswers.weight_current || mergedAnswers.ethnicity) {
        console.log('[Profile] Pre-filled from questionnaire data');
      }
    } else if (backendProfile === null && !backendAnswers && !profileLoaded && user) {
      const loadedProfile: ProfileData = {
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        age: 0,
        height: 0,
        weight: 0,
        bloodType: '',
        allergies: '',
        ethnicity: '',
        socioeconomicStatus: '',
        educationLevel: '',
        employmentStatus: '',
        housingStatus: '',
        profilePhoto: '',
      };
      setProfileData(loadedProfile);
      setEditForm(loadedProfile);
      setProfileLoaded(true);
    }
  }, [backendProfile, backendAnswers, profileLoaded, user]);

  const { data: gamificationData } = useQuery<GamificationData>({
    queryKey: ['/api/gamification'],
    enabled: !!userId,
  });

  useEffect(() => {
    if (backendAnswers && backendAnswers.length > 0) {
      const mergedAnswers: Record<string, string> = {};
      backendAnswers.forEach((item) => {
        Object.assign(mergedAnswers, item.answers);
      });
      // Backend is the source of truth - update state and sync to localStorage
      setQuestionnaireAnswers(mergedAnswers);
      localStorage.setItem('loretta_questionnaire_answers', JSON.stringify(mergedAnswers));
      console.log('[Profile] Loaded questionnaire answers from backend:', Object.keys(mergedAnswers).length, 'answers');
    }
  }, [backendAnswers]);

  const recalculateRiskScoreMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/risk-scores/calculate', {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk-scores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk-scores/latest'] });
      toast({
        title: t('riskScoreUpdated') || 'Risk score updated',
        description: t('riskScoreRecalculated') || 'Your health risk score has been recalculated based on your updated answers.',
      });
    },
    onError: (error) => {
      console.error('Failed to recalculate risk score:', error);
      toast({
        title: t('error') || 'Error',
        description: t('riskScoreUpdateFailed') || 'Failed to update your risk score. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const triggerDebouncedRecalculation = useCallback(() => {
    if (recalculateTimeoutRef.current) {
      clearTimeout(recalculateTimeoutRef.current);
    }
    recalculateTimeoutRef.current = setTimeout(() => {
      if (!recalculateRiskScoreMutation.isPending) {
        recalculateRiskScoreMutation.mutate();
      }
    }, 1500);
  }, [recalculateRiskScoreMutation]);

  const saveAnswersMutation = useMutation({
    mutationFn: async ({ category, answers }: { category: string; answers: Record<string, string> }) => {
      return apiRequest('POST', '/api/questionnaires', {
        userId,
        category,
        answers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questionnaires'] });
      triggerDebouncedRecalculation();
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

  const handleAnswerChange = useCallback((questionId: string, value: string) => {
    setQuestionnaireAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const validateAndSaveAnswer = useCallback((questionId: string, value: string) => {
    const sharedQuestion = getQuestionById(questionId);
    
    if (sharedQuestion?.type === 'number' && value !== '') {
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        toast({
          title: language === 'en' ? 'Invalid value' : 'Ungültiger Wert',
          description: language === 'en' 
            ? 'Please enter a valid number' 
            : 'Bitte geben Sie eine gültige Zahl ein',
          variant: 'destructive',
        });
        const revertedAnswers = { ...questionnaireAnswers };
        delete revertedAnswers[questionId];
        setQuestionnaireAnswers(revertedAnswers);
        return;
      }
      
      if (sharedQuestion.min !== undefined && numValue < sharedQuestion.min) {
        toast({
          title: language === 'en' ? 'Invalid value' : 'Ungültiger Wert',
          description: language === 'en' 
            ? `Value must be at least ${sharedQuestion.min}` 
            : `Wert muss mindestens ${sharedQuestion.min} sein`,
          variant: 'destructive',
        });
        const revertedAnswers = { ...questionnaireAnswers };
        delete revertedAnswers[questionId];
        setQuestionnaireAnswers(revertedAnswers);
        return;
      }
      if (sharedQuestion.max !== undefined && numValue > sharedQuestion.max) {
        toast({
          title: language === 'en' ? 'Invalid value' : 'Ungültiger Wert',
          description: language === 'en' 
            ? `Value must be at most ${sharedQuestion.max}` 
            : `Wert darf höchstens ${sharedQuestion.max} sein`,
          variant: 'destructive',
        });
        const revertedAnswers = { ...questionnaireAnswers };
        delete revertedAnswers[questionId];
        setQuestionnaireAnswers(revertedAnswers);
        return;
      }
    }
    
    const newAnswers = { ...questionnaireAnswers, [questionId]: value };
    localStorage.setItem('loretta_questionnaire_answers', JSON.stringify(newAnswers));

    const category = getCategoryForQuestion(questionId);
    setPendingSaves((prev) => ({ ...prev, [category]: true }));
    
    saveAnswersMutation.mutate(
      { category: 'health_risk_assessment', answers: newAnswers },
      {
        onSettled: () => {
          setPendingSaves((prev) => ({ ...prev, [category]: false }));
        },
      }
    );
  }, [questionnaireAnswers, saveAnswersMutation, language, toast]);

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
    i18n.changeLanguage(newLang);
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
        profilePhoto: data.profilePhoto,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
    },
  });

  const handleSave = async () => {
    // Only save name and profile photo - health data is managed via questionnaires
    const updatedProfile = {
      ...profileData,
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      profilePhoto: editForm.profilePhoto,
    };
    
    setProfileData(updatedProfile);
    localStorage.setItem('loretta_profile', JSON.stringify(updatedProfile));
    saveProfileMutation.mutate(updatedProfile);
    
    setIsEditOpen(false);
    toast({
      title: localT.editModal.saved,
      description: localT.editModal.savedDescription,
    });
  };

  const openBasicInfoEdit = () => {
    setBasicInfoForm({
      age: profileData.age,
      height: profileData.height,
      weight: profileData.weight,
      bloodType: profileData.bloodType,
      allergies: profileData.allergies,
    });
    setIsBasicInfoEditOpen(true);
  };

  const handleBasicInfoSave = async () => {
    const validationErrors: string[] = [];
    
    if (basicInfoForm.age && (basicInfoForm.age < 18 || basicInfoForm.age > 120)) {
      validationErrors.push(language === 'en' ? 'Age must be between 18 and 120' : 'Alter muss zwischen 18 und 120 liegen');
    }
    if (basicInfoForm.height && (basicInfoForm.height < 50 || basicInfoForm.height > 275)) {
      validationErrors.push(language === 'en' ? 'Height must be between 50 and 275 cm' : 'Größe muss zwischen 50 und 275 cm liegen');
    }
    if (basicInfoForm.weight && (basicInfoForm.weight < 20 || basicInfoForm.weight > 500)) {
      validationErrors.push(language === 'en' ? 'Weight must be between 20 and 500 kg' : 'Gewicht muss zwischen 20 und 500 kg liegen');
    }
    
    if (validationErrors.length > 0) {
      toast({
        title: language === 'en' ? 'Invalid values' : 'Ungültige Werte',
        description: validationErrors.join('. '),
        variant: 'destructive',
      });
      return;
    }
    
    // Update profile data
    const updatedProfile = {
      ...profileData,
      age: basicInfoForm.age,
      height: basicInfoForm.height,
      weight: basicInfoForm.weight,
      bloodType: basicInfoForm.bloodType,
      allergies: basicInfoForm.allergies,
    };
    
    setProfileData(updatedProfile);
    localStorage.setItem('loretta_profile', JSON.stringify(updatedProfile));
    saveProfileMutation.mutate(updatedProfile);
    
    // Two-way sync: Update questionnaire answers
    const questionnaireUpdates: Record<string, string> = {};
    if (basicInfoForm.age > 0) questionnaireUpdates['age'] = String(basicInfoForm.age);
    if (basicInfoForm.height > 0) questionnaireUpdates['height'] = String(basicInfoForm.height);
    if (basicInfoForm.weight > 0) questionnaireUpdates['weight_current'] = String(basicInfoForm.weight);
    
    if (Object.keys(questionnaireUpdates).length > 0) {
      const existingAnswers = questionnaireAnswers || {};
      const mergedAnswers = { ...existingAnswers, ...questionnaireUpdates };
      
      try {
        await apiRequest('POST', '/api/questionnaires', {
          userId,
          category: 'health_risk_assessment',
          answers: mergedAnswers,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/questionnaires'] });
        console.log('[Profile] Synced basic info to questionnaire:', Object.keys(questionnaireUpdates).join(', '));
        
        // Recalculate risk score with updated data
        recalculateRiskScoreMutation.mutate();
      } catch (error) {
        console.error('[Profile] Failed to sync to questionnaire:', error);
      }
    }
    
    setIsBasicInfoEditOpen(false);
    toast({
      title: language === 'en' ? 'Basic information updated' : 'Grundinformationen aktualisiert',
      description: language === 'en' ? 'Your health information has been saved.' : 'Ihre Gesundheitsinformationen wurden gespeichert.',
    });
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: language === 'en' ? 'File too large' : 'Datei zu groß',
        description: language === 'en' ? 'Please select an image under 5MB' : 'Bitte wählen Sie ein Bild unter 5MB',
        variant: 'destructive',
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: language === 'en' ? 'Invalid file type' : 'Ungültiger Dateityp',
        description: language === 'en' ? 'Please select an image file' : 'Bitte wählen Sie eine Bilddatei',
        variant: 'destructive',
      });
      return;
    }

    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 128;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setEditForm({ ...editForm, profilePhoto: compressedBase64 });
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const getDisplayValue = (key: string, value: string) => {
    const displayMaps: Record<string, Record<string, { en: string; de: string }>> = {
      ethnicity: {
        'white-european': { en: 'White / European', de: 'Weiß / Europäisch' },
        'black-african': { en: 'Black / African', de: 'Schwarz / Afrikanisch' },
        'afro-caribbean': { en: 'Afro-Caribbean', de: 'Afro-Karibisch' },
        'hispanic-latino': { en: 'Hispanic / Latino', de: 'Hispanisch / Lateinamerikanisch' },
        'east-asian': { en: 'East Asian', de: 'Ostasiatisch' },
        'south-asian': { en: 'South Asian', de: 'Südasiatisch' },
        'southeast-asian': { en: 'Southeast Asian', de: 'Südostasiatisch' },
        'middle-eastern': { en: 'Middle Eastern / North African', de: 'Nahöstlich / Nordafrikanisch' },
        'native-american': { en: 'Native American / Indigenous', de: 'Indigene Bevölkerung Amerikas' },
        'pacific-islander': { en: 'Pacific Islander', de: 'Pazifikinsulaner' },
        'mixed-multiracial': { en: 'Mixed / Multiracial', de: 'Gemischt / Multiethnisch' },
        'prefer-not-to-say': { en: 'Prefer not to say', de: 'Möchte ich nicht angeben' },
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
    { icon: User, label: localT.basicInfo.age, value: `${profileData.age} ${language === 'en' ? 'years' : 'Jahre'}`, iconColor: 'text-primary', bgColor: 'bg-primary/10' },
    { icon: Ruler, label: localT.basicInfo.height, value: `${profileData.height} cm`, iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    { icon: Scale, label: localT.basicInfo.weight, value: `${profileData.weight} kg`, iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    { icon: Droplets, label: localT.basicInfo.bloodType, value: profileData.bloodType, iconColor: 'text-destructive', bgColor: 'bg-destructive/10' },
    { icon: AlertCircle, label: localT.basicInfo.allergies, value: profileData.allergies || localT.basicInfo.none, iconColor: 'text-chart-1', bgColor: 'bg-chart-1/10' },
  ];

  const getSocialFactors = () => [
    { label: localT.socialFactors.ethnicity, value: getDisplayValue('ethnicity', profileData.ethnicity) },
    { label: localT.socialFactors.socioeconomicStatus, value: getDisplayValue('socioeconomicStatus', profileData.socioeconomicStatus) },
    { label: localT.socialFactors.educationLevel, value: getDisplayValue('educationLevel', profileData.educationLevel) },
    { label: localT.socialFactors.employmentStatus, value: getDisplayValue('employmentStatus', profileData.employmentStatus) },
    { label: localT.socialFactors.housingStatus, value: getDisplayValue('housingStatus', profileData.housingStatus) },
  ];

  const getQuestionnaires = () => [
    { 
      key: 'onboarding',
      title: localT.questionnaires.onboarding, 
      icon: questionCategories.onboarding.icon,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
      questions: questionCategories.onboarding.questionIds.map(id => {
        const sharedQuestion = getQuestionById(id);
        return {
          id,
          text: sharedQuestion?.text || localT.questionTexts[id as keyof typeof localT.questionTexts] || id
        };
      })
    },
  ];

  const getDietSummary = (): string => {
    const fruits = questionnaireAnswers['diet_fruits_vegetables'];
    const protein = questionnaireAnswers['diet_protein'];
    const sugar = questionnaireAnswers['diet_sugar'];
    const water = questionnaireAnswers['diet_water'];
    const processed = questionnaireAnswers['diet_processed_foods'];
    
    if (!fruits && !protein && !sugar && !water && !processed) {
      return language === 'en' ? 'No data yet' : 'Noch keine Daten';
    }
    
    const parts: string[] = [];
    
    if (fruits) {
      if (fruits === '5+' || fruits === '4-5') {
        parts.push(language === 'en' ? 'Good fruit/veg intake' : 'Gute Obst/Gemüse-Aufnahme');
      } else if (fruits === '0-1') {
        parts.push(language === 'en' ? 'Low fruit/veg' : 'Wenig Obst/Gemüse');
      }
    }
    
    if (protein) {
      if (protein === 'high' || protein === 'adequate') {
        parts.push(language === 'en' ? 'Adequate protein' : 'Ausreichend Protein');
      } else if (protein === 'low') {
        parts.push(language === 'en' ? 'Low protein' : 'Wenig Protein');
      }
    }
    
    if (sugar) {
      if (sugar === 'rarely' || sugar === 'never') {
        parts.push(language === 'en' ? 'Low sugar' : 'Wenig Zucker');
      } else if (sugar === 'daily' || sugar === 'often') {
        parts.push(language === 'en' ? 'High sugar' : 'Viel Zucker');
      }
    }
    
    return parts.length > 0 ? parts.join(', ') : (language === 'en' ? 'Balanced diet' : 'Ausgewogene Ernährung');
  };

  const getSleepSummary = (): string => {
    const quality = questionnaireAnswers['sleep_quality'];
    const duration = questionnaireAnswers['sleep_duration'];
    const consistency = questionnaireAnswers['sleep_consistency'];
    const disturbances = questionnaireAnswers['sleep_disturbances'];
    
    if (!quality && !duration && !consistency && !disturbances) {
      return language === 'en' ? 'No data yet' : 'Noch keine Daten';
    }
    
    const parts: string[] = [];
    
    if (duration) {
      const hours = parseFloat(duration);
      if (!isNaN(hours)) {
        if (hours >= 7 && hours <= 9) {
          parts.push(language === 'en' ? `${hours}h avg (good)` : `${hours}h Durchschnitt (gut)`);
        } else if (hours < 6) {
          parts.push(language === 'en' ? `${hours}h avg (low)` : `${hours}h Durchschnitt (niedrig)`);
        } else {
          parts.push(language === 'en' ? `${hours}h avg` : `${hours}h Durchschnitt`);
        }
      }
    }
    
    if (quality) {
      if (quality === 'excellent' || quality === 'good') {
        parts.push(language === 'en' ? 'Good quality' : 'Gute Qualität');
      } else if (quality === 'poor' || quality === 'very_poor') {
        parts.push(language === 'en' ? 'Poor quality' : 'Schlechte Qualität');
      }
    }
    
    if (disturbances) {
      if (disturbances === 'often' || disturbances === 'always') {
        parts.push(language === 'en' ? 'Frequent disturbances' : 'Häufige Störungen');
      }
    }
    
    return parts.length > 0 ? parts.join(', ') : (language === 'en' ? 'Sleep patterns recorded' : 'Schlafmuster erfasst');
  };

  const getStressSummary = (): string => {
    const level = questionnaireAnswers['stress_level'];
    const frequency = questionnaireAnswers['stress_frequency'];
    const coping = questionnaireAnswers['stress_coping'];
    const work = questionnaireAnswers['stress_work'];
    
    if (!level && !frequency && !coping && !work) {
      return language === 'en' ? 'No data yet' : 'Noch keine Daten';
    }
    
    const parts: string[] = [];
    
    if (level) {
      if (level === 'low' || level === 'very_low') {
        parts.push(language === 'en' ? 'Low stress' : 'Niedriger Stress');
      } else if (level === 'high' || level === 'very_high') {
        parts.push(language === 'en' ? 'High stress' : 'Hoher Stress');
      } else {
        parts.push(language === 'en' ? 'Moderate stress' : 'Mäßiger Stress');
      }
    }
    
    if (coping) {
      if (coping === 'well' || coping === 'very_well') {
        parts.push(language === 'en' ? 'Coping well' : 'Gute Bewältigung');
      } else if (coping === 'poorly' || coping === 'very_poorly') {
        parts.push(language === 'en' ? 'Needs support' : 'Braucht Unterstützung');
      }
    }
    
    if (work && (work === 'high' || work === 'very_high')) {
      parts.push(language === 'en' ? 'Work-related' : 'Arbeitsbedingt');
    }
    
    return parts.length > 0 ? parts.join(', ') : (language === 'en' ? 'Stress data recorded' : 'Stressdaten erfasst');
  };

  const getBehaviors = () => [
    { icon: Utensils, label: localT.behaviors.diet, value: getDietSummary(), iconColor: 'text-chart-3', bgColor: 'bg-chart-3/10' },
    { icon: Moon, label: localT.questionnaires.sleep, value: getSleepSummary(), iconColor: 'text-chart-2', bgColor: 'bg-chart-2/10' },
    { icon: Brain, label: localT.questionnaires.stress, value: getStressSummary(), iconColor: 'text-destructive', bgColor: 'bg-destructive/10' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-primary/10 text-primary border-primary/20';
      case 'caution': return 'bg-chart-3/10 text-chart-3 border-chart-3/20';
      case 'warning': return 'bg-destructive/10 text-destructive border-destructive/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const isProfileEmpty = !profileData.firstName && !profileData.lastName;

  if (isProfileLoading || !profileLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground">{language === 'en' ? 'Loading profile...' : 'Profil wird geladen...'}</p>
        </div>
      </div>
    );
  }

  if (isProfileEmpty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
        <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-6 pb-20 safe-area-top">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <BackButton 
                href="/my-dashboard" 
                className="text-white" 
                iconClassName="text-white"
                data-testid="button-back-dashboard" 
              />
              <div className="text-center">
                <h1 className="text-xl font-black text-white">{localT.profile}</h1>
                <p className="text-white/70 text-sm">{language === 'en' ? 'Health Profile' : 'Gesundheitsprofil'}</p>
              </div>
              <div className="flex items-center gap-1 [&_button]:text-white [&_button]:hover:bg-white/20">
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-16">
          <Card className="p-8 mb-6 border-0 shadow-xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-chart-2/20 flex items-center justify-center mx-auto mb-6">
                <User className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-black text-foreground mb-3">
                {t('emptyProfile.completeProfile')}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {t('emptyProfile.notFilledIn')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={openEditModal}
                  className="bg-gradient-to-r from-primary to-chart-2 text-white font-bold px-8"
                  data-testid="button-fill-profile"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t('emptyProfile.fillInProfile')}
                </Button>
                <Link href="/onboarding">
                  <Button 
                    variant="outline"
                    className="border-primary/30 hover:bg-primary/10"
                    data-testid="button-complete-onboarding"
                  >
                    <ClipboardList className="w-4 h-4 mr-2" />
                    {t('emptyProfile.completeOnboarding')}
                  </Button>
                </Link>
              </div>
            </motion.div>
          </Card>

          <Card className="p-6 border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-chart-2/5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-2">
                  {t('emptyProfile.whyComplete')}
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-chart-2" />
                    {t('emptyProfile.benefit1')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-chart-2" />
                    {t('emptyProfile.benefit2')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-chart-2" />
                    {t('emptyProfile.benefit3')}
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-chart-2" />
                    {t('emptyProfile.benefit4')}
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                <Edit className="w-5 h-5 text-[#013DC4]" />
                {localT.editModal.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-muted-foreground uppercase">{localT.editModal.name}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{localT.editModal.firstName}</Label>
                    <Input
                      id="firstName"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      placeholder={language === 'en' ? 'Enter first name' : 'Vorname eingeben'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{localT.editModal.lastName}</Label>
                    <Input
                      id="lastName"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      placeholder={language === 'en' ? 'Enter last name' : 'Nachname eingeben'}
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'en' 
                  ? 'To update your health information (age, height, weight, etc.), use the Edit button in the Basic Information tab.'
                  : 'Um Ihre Gesundheitsinformationen (Alter, Größe, Gewicht usw.) zu aktualisieren, verwenden Sie die Bearbeiten-Schaltfläche im Tab Grundinformationen.'}
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                {localT.editModal.cancel}
              </Button>
              <Button onClick={handleSave} className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold shadow-lg shadow-[#013DC4]/20">
                <Save className="w-4 h-4 mr-2" />
                {localT.editModal.save}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const handleFeedbackSubmit = async () => {
    if (!feedbackForm.subject.trim() || !feedbackForm.message.trim()) {
      toast({
        title: localT.feedback.error,
        description: language === 'en' ? 'Please fill in all required fields.' : 'Bitte füllen Sie alle Pflichtfelder aus.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const response = await apiRequest('POST', '/api/feedback', {
        subject: feedbackForm.subject.trim(),
        message: feedbackForm.message.trim(),
        category: feedbackForm.category,
      });

      if (response.ok) {
        toast({
          title: localT.feedback.success,
          description: localT.feedback.successDescription,
        });
        setIsFeedbackOpen(false);
        setFeedbackForm({ subject: '', message: '', category: 'general' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send feedback');
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      toast({
        title: localT.feedback.error,
        description: localT.feedback.errorDescription,
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 pb-6 safe-area-bottom">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] pt-14 pb-20 px-4 safe-area-top">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="w-[100px] flex justify-start">
              <BackButton 
                href="/my-dashboard" 
                className="text-white rounded-2xl min-w-[44px]" 
                iconClassName="text-white"
                data-testid="button-back-dashboard" 
              />
            </div>
            <div className="text-center flex-1">
              <h1 className="text-xl sm:text-2xl font-black text-white">{localT.profile}</h1>
              <p className="text-white/70 text-sm">{language === 'en' ? 'Health Profile' : 'Gesundheitsprofil'}</p>
            </div>
            <div className="w-[100px] flex items-center justify-end gap-1">
              <LanguageSwitcher className="text-white hover:bg-white/20 rounded-2xl min-w-[44px] min-h-[44px]" />
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-white/20 rounded-2xl min-w-[44px] min-h-[44px] active:scale-95 transition-transform"
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
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl overflow-hidden bg-gradient-to-br from-[#013DC4] via-[#0150FF] to-[#CDB6EF] shadow-2xl shadow-[#013DC4]/30 flex items-center justify-center">
                {profileData.profilePhoto ? (
                  <img 
                    src={profileData.profilePhoto} 
                    alt={`${profileData.firstName} ${profileData.lastName}`} 
                    className="w-full h-full object-cover"
                    data-testid="img-profile-avatar"
                  />
                ) : (
                  <User className="w-12 h-12 text-white" data-testid="img-profile-avatar" />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-[#CDB6EF] to-purple-400 rounded-xl flex items-center justify-center border-2 border-white shadow-lg">
                <Heart className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white" data-testid="text-profile-name">{profileData.firstName} {profileData.lastName}</h2>
              <button 
                onClick={openEditModal}
                className="text-[#013DC4] text-sm flex items-center gap-1.5 justify-center hover:underline font-semibold mx-auto sm:mx-0 min-h-[44px] px-3 rounded-xl hover:bg-[#013DC4]/10 active:scale-95 transition-all"
                data-testid="button-edit-profile"
              >
                <Edit className="w-4 h-4" />
                {localT.editProfile}
              </button>
              <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                <span className="px-3 py-1 bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] text-white text-xs font-bold rounded-full shadow-lg">{localT.level} {gamificationData?.level || 1}</span>
                <span className="px-3 py-1 bg-gradient-to-r from-orange-400 to-red-400 text-white text-xs font-bold rounded-full shadow-lg">{gamificationData?.currentStreak || 0} {localT.dayStreak}</span>
              </div>
            </div>
            <Link href="/calendar">
              <Button size="icon" variant="outline" className="rounded-2xl border-[#013DC4]/30 hover:bg-[#013DC4]/10 bg-white/50 min-w-[44px] min-h-[44px] active:scale-95 transition-transform" data-testid="button-calendar">
                <CalendarDays className="w-5 h-5 text-[#013DC4]" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:grid-cols-4 sm:w-full backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-2xl p-2.5 gap-2 h-auto" data-testid="profile-tabs">
              <TabsTrigger value="basic" className="whitespace-nowrap text-xs sm:text-sm rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#013DC4] data-[state=active]:to-[#0150FF] data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg font-semibold h-[44px] px-4 transition-all active:scale-95" data-testid="tab-basic">{localT.tabs.basic}</TabsTrigger>
              <TabsTrigger value="social" className="whitespace-nowrap text-xs sm:text-sm rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#013DC4] data-[state=active]:to-[#0150FF] data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg font-semibold h-[44px] px-4 transition-all active:scale-95" data-testid="tab-social">{localT.tabs.social}</TabsTrigger>
              <TabsTrigger value="questionnaires" className="whitespace-nowrap text-xs sm:text-sm rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#013DC4] data-[state=active]:to-[#0150FF] data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg font-semibold h-[44px] px-4 transition-all active:scale-95" data-testid="tab-questionnaires">{localT.tabs.questionnaires}</TabsTrigger>
              <TabsTrigger value="behaviors" className="whitespace-nowrap text-xs sm:text-sm rounded-xl bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-white/10 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#013DC4] data-[state=active]:to-[#0150FF] data-[state=active]:text-white data-[state=active]:border-transparent data-[state=active]:shadow-lg font-semibold h-[44px] px-4 transition-all active:scale-95" data-testid="tab-behaviors">{localT.tabs.behaviors}</TabsTrigger>
            </TabsList>
          </div>

          {/* Basic Information */}
          <TabsContent value="basic">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center text-white shadow-lg">
                    <User className="w-5 h-5" />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{localT.basicInfo.title}</h3>
                </div>
                <Button
                  variant="outline"
                  onClick={openBasicInfoEdit}
                  className="rounded-xl border-[#013DC4]/30 hover:bg-[#013DC4]/10 min-h-[44px] px-4 active:scale-95 transition-transform"
                  data-testid="button-edit-basic-info"
                >
                  <Edit className="w-4 h-4 mr-1.5" />
                  {language === 'en' ? 'Edit' : 'Bearbeiten'}
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {getBasicInfo().map((info, index) => (
                  <motion.div
                    key={info.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all"
                    data-testid={`info-card-${index}`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#013DC4]/10 to-[#CDB6EF]/10 flex items-center justify-center">
                      <info.icon className="w-5 h-5 text-[#013DC4]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">{info.label}</p>
                      <p className="font-bold text-gray-900 dark:text-white">{info.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Social Settings */}
          <TabsContent value="social">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#CDB6EF] to-purple-400 flex items-center justify-center text-white shadow-lg">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  {language === 'en' ? 'Community Settings' : 'Community-Einstellungen'}
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 min-h-[60px] rounded-2xl bg-gradient-to-br from-[#CDB6EF]/10 to-[#D2EDFF]/10">
                  <div className="space-y-1 flex-1 pr-4">
                    <p className="font-bold text-gray-900 dark:text-white">
                      {language === 'en' ? 'Loretta Community Leaderboard' : 'Loretta Community Rangliste'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {language === 'en' 
                        ? 'Show your XP, level, and streak on the community leaderboard so others can see your progress'
                        : 'Zeige dein XP, Level und deine Serie auf der Community-Rangliste, damit andere deinen Fortschritt sehen können'}
                    </p>
                  </div>
                  <Switch
                    checked={lorettaConsent}
                    onCheckedChange={handleLorettaConsentChange}
                    disabled={updateLorettaConsentMutation.isPending}
                    data-testid="switch-loretta-leaderboard"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Questionnaires */}
          <TabsContent value="questionnaires">
            {/* Social Factors Section */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl p-5 sm:p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{localT.socialFactors.title}</h3>
              </div>
              <div className="space-y-2">
                {getSocialFactors().map((factor, index) => (
                  <motion.div
                    key={factor.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all"
                    data-testid={`social-factor-${index}`}
                  >
                    <p className="text-gray-500 font-medium">{factor.label}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-right">{factor.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Health Questionnaires */}
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center text-white shadow-lg">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{localT.questionnaires.title}</h3>
              </div>
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
                      className="rounded-2xl bg-white/50 dark:bg-gray-800/50 overflow-hidden border border-white/50 dark:border-white/10"
                      data-testid={`questionnaire-${category.key}`}
                    >
                      <Collapsible
                        open={expandedCategories[category.key]}
                        onOpenChange={() => toggleCategory(category.key)}
                      >
                        <CollapsibleTrigger className="w-full p-4 min-h-[56px] flex items-center justify-between hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors active:bg-white/70 dark:active:bg-gray-800/70">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center shadow-lg flex-shrink-0">
                              <category.icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-gray-900 dark:text-white">{category.title}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm text-gray-500">
                                  {answeredCount}/{totalCount} {localT.questionnaires.questions}
                                </p>
                                {isComplete && (
                                  <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-green-400 to-emerald-400 text-white rounded-full shadow-sm">
                                    <Check className="w-3 h-3 inline mr-1" />
                                    {language === 'en' ? 'Complete' : 'Fertig'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="w-16 h-2 bg-white/50 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner hidden sm:block">
                              <div 
                                className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg"
                                style={{ width: `${(answeredCount / totalCount) * 100}%` }}
                              />
                            </div>
                            <div className={`w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center transition-transform ${expandedCategories[category.key] ? 'rotate-180' : ''}`}>
                              <ChevronDown className="w-5 h-5 text-gray-500" />
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-3">
                            {category.questions.map((question, qIndex) => {
                              const isAnswered = !!questionnaireAnswers[question.id];
                              const sharedQuestion = getQuestionById(question.id);
                              const displayAnswer = isAnswered ? formatAnswerDisplay(question.id, questionnaireAnswers[question.id], language) : '';
                              
                              return (
                                <Collapsible
                                  key={question.id}
                                  defaultOpen={!isAnswered}
                                  className={`rounded-lg border transition-colors ${
                                    isAnswered 
                                      ? 'bg-chart-2/5 border-chart-2/30' 
                                      : 'bg-background/50 border-border'
                                  }`}
                                  data-testid={`question-${category.key}-${qIndex}`}
                                >
                                  <CollapsibleTrigger className="w-full p-4 min-h-[52px] flex items-center justify-between hover:bg-white/30 dark:hover:bg-gray-800/30 transition-colors rounded-lg active:bg-white/50 dark:active:bg-gray-800/50">
                                    <div className="flex items-start gap-3 flex-1 text-left pr-2">
                                      <span className={`text-xs font-bold min-w-6 pt-0.5 ${
                                        isAnswered ? category.iconColor : 'text-muted-foreground'
                                      }`}>
                                        {qIndex + 1}.
                                      </span>
                                      <div className="flex-1">
                                        <p className="text-sm text-foreground font-medium">{question.text}</p>
                                        {isAnswered && (
                                          <p className="text-xs text-chart-2 font-semibold mt-1 flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            {displayAnswer}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform flex-shrink-0 ${isAnswered ? 'bg-chart-2/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                      <ChevronDown className={`w-4 h-4 ${isAnswered ? 'text-chart-2' : 'text-gray-500'}`} />
                                    </div>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="px-4 pb-4 ml-9">
                                      {(() => {
                                        if (sharedQuestion?.type === 'number') {
                                          return (
                                            <div className="flex items-center gap-2">
                                              <Input
                                                type="number"
                                                placeholder={sharedQuestion.placeholder || (language === 'en' ? 'Enter value' : 'Wert eingeben')}
                                                value={questionnaireAnswers[question.id] || ''}
                                                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                                onBlur={(e) => validateAndSaveAnswer(question.id, e.target.value)}
                                                className="w-32"
                                                data-testid={`input-${question.id}`}
                                              />
                                              {sharedQuestion.unit && (
                                                <span className="text-sm text-muted-foreground">{sharedQuestion.unit}</span>
                                              )}
                                            </div>
                                          );
                                        }
                                        
                                        if (sharedQuestion?.type === 'time') {
                                          return (
                                            <Input
                                              type="time"
                                              placeholder={sharedQuestion.placeholder || ''}
                                              value={questionnaireAnswers[question.id] || ''}
                                              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                                              className="w-32"
                                              data-testid={`input-${question.id}`}
                                            />
                                          );
                                        }
                                        
                                        const getOptionsForQuestion = () => {
                                          if (sharedQuestion?.options && sharedQuestion.options.length > 0) {
                                            return sharedQuestion.options.map(opt => ({
                                              value: opt.value,
                                              en: opt.label,
                                              de: opt.label,
                                              color: 'bg-primary'
                                            }));
                                          }
                                          const questionType = questionTypeMap[question.id];
                                          if (questionType && optionSets[questionType]) {
                                            return optionSets[questionType];
                                          }
                                          return [
                                            { value: 'yes', en: 'Yes', de: 'Ja', color: 'bg-chart-2' },
                                            { value: 'no', en: 'No', de: 'Nein', color: 'bg-destructive' },
                                          ];
                                        };
                                        const options = getOptionsForQuestion();
                                        
                                        return (
                                          <RadioGroup
                                            value={questionnaireAnswers[question.id] || ''}
                                            onValueChange={(value) => handleAnswerChange(question.id, value)}
                                            className="flex flex-wrap gap-2"
                                          >
                                            {options.map((option) => (
                                              <div key={option.value} className="flex items-center">
                                                <RadioGroupItem 
                                                  value={option.value} 
                                                  id={`${question.id}-${option.value}`}
                                                  className="peer sr-only"
                                                />
                                                <Label
                                                  htmlFor={`${question.id}-${option.value}`}
                                                  className={`px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors border ${
                                                    questionnaireAnswers[question.id] === option.value
                                                      ? `${option.color} text-white border-transparent`
                                                      : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                                  }`}
                                                  data-testid={`answer-${question.id}-${option.value}`}
                                                >
                                                  {language === 'en' ? option.en : option.de}
                                                </Label>
                                              </div>
                                            ))}
                                          </RadioGroup>
                                        );
                                      })()}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              );
                            })}
                            
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                              <Button
                                onClick={() => {
                                  saveAnswersMutation.mutate({
                                    category: 'health_risk_assessment',
                                    answers: questionnaireAnswers
                                  });
                                  toast({
                                    title: language === 'en' ? 'Saved!' : 'Gespeichert!',
                                    description: language === 'en' 
                                      ? `${category.title} questionnaire has been submitted successfully.`
                                      : `${category.title} Fragebogen wurde erfolgreich eingereicht.`,
                                  });
                                }}
                                className="w-full bg-gradient-to-r from-[#013DC4] to-[#0150FF] hover:opacity-90 text-white rounded-2xl font-bold py-3 shadow-lg"
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
            </div>
          </TabsContent>

          {/* Behaviors */}
          <TabsContent value="behaviors">
            <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">{localT.behaviors.title}</h3>
              </div>
              <div className="space-y-3">
                {getBehaviors().map((behavior, index) => (
                  <motion.div
                    key={behavior.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg transition-all"
                    data-testid={`behavior-${index}`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#013DC4]/10 to-[#CDB6EF]/10 flex items-center justify-center">
                      <behavior.icon className="w-6 h-6 text-[#013DC4]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{behavior.label}</p>
                      <p className="text-sm text-gray-500">{behavior.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Feedback Section */}
        <div className="mt-6 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border border-white/50 dark:border-white/10 rounded-3xl shadow-xl p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center text-white shadow-lg">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  {localT.feedback.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {language === 'en' ? 'Help us improve Loretta' : 'Helfen Sie uns, Loretta zu verbessern'}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsFeedbackOpen(true)}
              className="bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold shadow-lg min-h-[44px] active:scale-95 transition-transform"
              data-testid="button-open-feedback"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {localT.feedback.button}
            </Button>
          </div>
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="max-w-md mx-4 max-h-[85vh] bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-gray-900 dark:text-white">
              <MessageSquare className="w-5 h-5 text-[#013DC4]" />
              {localT.feedback.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-category">{localT.feedback.category}</Label>
              <Select
                value={feedbackForm.category}
                onValueChange={(value) => setFeedbackForm({ ...feedbackForm, category: value })}
              >
                <SelectTrigger id="feedback-category" data-testid="select-feedback-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{localT.feedback.categories.general}</SelectItem>
                  <SelectItem value="bug">{localT.feedback.categories.bug}</SelectItem>
                  <SelectItem value="feature">{localT.feedback.categories.feature}</SelectItem>
                  <SelectItem value="other">{localT.feedback.categories.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-subject">{localT.feedback.subject}</Label>
              <Input
                id="feedback-subject"
                value={feedbackForm.subject}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, subject: e.target.value })}
                placeholder={localT.feedback.subjectPlaceholder}
                maxLength={200}
                data-testid="input-feedback-subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-message">{localT.feedback.message}</Label>
              <textarea
                id="feedback-message"
                value={feedbackForm.message}
                onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                placeholder={localT.feedback.messagePlaceholder}
                maxLength={5000}
                rows={5}
                className="w-full px-3 py-2 rounded-2xl border border-white/50 dark:border-white/10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[#013DC4] resize-none text-gray-900 dark:text-white placeholder:text-gray-400"
                data-testid="textarea-feedback-message"
              />
              <p className="text-xs text-gray-400 text-right">
                {feedbackForm.message.length}/5000
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsFeedbackOpen(false)} className="min-h-[44px] active:scale-95 transition-transform">
              {localT.editModal.cancel}
            </Button>
            <Button 
              onClick={handleFeedbackSubmit} 
              className="bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold min-h-[44px] active:scale-95 transition-transform"
              disabled={isSubmittingFeedback || !feedbackForm.subject.trim() || !feedbackForm.message.trim()}
              data-testid="button-submit-feedback"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmittingFeedback ? localT.feedback.sending : localT.feedback.send}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">
              {language === 'en' ? 'Share with Family & Friends' : 'Mit Familie & Freunden teilen'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <p className="text-gray-500">
              {language === 'en' ? 'Choose what information to share:' : 'Wählen Sie, welche Informationen geteilt werden sollen:'}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 min-h-[60px] rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10">
                <div className="space-y-1 flex-1 pr-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {language === 'en' ? 'Medications' : 'Medikamente'}
                  </p>
                  <p className="text-sm text-gray-500">
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
              
              <div className="flex items-center justify-between p-4 min-h-[60px] rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10">
                <div className="space-y-1 flex-1 pr-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {language === 'en' ? 'Missions' : 'Missionen'}
                  </p>
                  <p className="text-sm text-gray-500">
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
              
              <div className="flex items-center justify-between p-4 min-h-[60px] rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-white/50 dark:border-white/10">
                <div className="space-y-1 flex-1 pr-4">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {language === 'en' ? 'Clinical Data' : 'Klinische Daten'}
                  </p>
                  <p className="text-sm text-gray-500">
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
              className="w-full min-h-[48px] bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold shadow-lg shadow-[#013DC4]/20 active:scale-[0.98] transition-transform"
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white">{localT.editModal.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Photo Upload Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white">{language === 'en' ? 'Profile Photo' : 'Profilfoto'}</h4>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-[#013DC4]/30 bg-gradient-to-br from-[#013DC4]/10 to-[#CDB6EF]/10 flex items-center justify-center">
                  {editForm.profilePhoto ? (
                    <img 
                      src={editForm.profilePhoto} 
                      alt="Profile preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    data-testid="input-photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full cursor-pointer"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {language === 'en' ? 'Upload Photo' : 'Foto hochladen'}
                    </Button>
                  </label>
                  {editForm.profilePhoto && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="text-destructive hover:text-destructive w-full min-h-[44px]"
                      onClick={() => setEditForm({ ...editForm, profilePhoto: '' })}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {language === 'en' ? 'Remove Photo' : 'Foto entfernen'}
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Images are automatically resized and compressed' : 'Bilder werden automatisch verkleinert und komprimiert'}
              </p>
            </div>

            <Separator />

            {/* Name Section */}
            <div className="space-y-4">
              <h4 className="font-bold text-gray-900 dark:text-white">{localT.editModal.name}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{localT.editModal.firstName}</Label>
                  <Input
                    id="firstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">{localT.editModal.lastName}</Label>
                  <Input
                    id="lastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              {language === 'en' 
                ? 'To update your health information (age, height, weight, etc.), use the Edit button in the Basic Information tab.'
                : 'Um Ihre Gesundheitsinformationen (Alter, Größe, Gewicht usw.) zu aktualisieren, verwenden Sie die Bearbeiten-Schaltfläche im Tab Grundinformationen.'}
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsEditOpen(false)} className="min-h-[44px] active:scale-95 transition-transform" data-testid="button-cancel-edit">
              {localT.editModal.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold shadow-lg shadow-[#013DC4]/20 min-h-[44px] active:scale-95 transition-transform" data-testid="button-save-profile">
              <Save className="w-4 h-4 mr-2" />
              {localT.editModal.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Basic Info Edit Modal */}
      <Dialog open={isBasicInfoEditOpen} onOpenChange={setIsBasicInfoEditOpen}>
        <DialogContent className="max-w-md bg-gradient-to-br from-white/95 via-white/90 to-[#CDB6EF]/20 dark:from-gray-900/95 dark:via-gray-900/90 dark:to-[#013DC4]/20 backdrop-blur-xl border-white/50 dark:border-white/10 rounded-3xl shadow-2xl shadow-[#013DC4]/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2 text-gray-900 dark:text-white">
              <Edit className="w-5 h-5 text-[#013DC4]" />
              {language === 'en' ? 'Edit Basic Information' : 'Grundinformationen bearbeiten'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basic-age">{localT.editModal.age} (18-120)</Label>
                <Input
                  id="basic-age"
                  type="number"
                  value={basicInfoForm.age || ''}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, age: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-basic-age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic-height">{localT.editModal.height} (50-275 cm)</Label>
                <Input
                  id="basic-height"
                  type="number"
                  value={basicInfoForm.height || ''}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, height: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-basic-height"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="basic-weight">{localT.editModal.weight} (20-500 kg)</Label>
                <Input
                  id="basic-weight"
                  type="number"
                  value={basicInfoForm.weight || ''}
                  onChange={(e) => setBasicInfoForm({ ...basicInfoForm, weight: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-basic-weight"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic-bloodType">{localT.editModal.bloodType}</Label>
                <Select
                  value={basicInfoForm.bloodType}
                  onValueChange={(value) => setBasicInfoForm({ ...basicInfoForm, bloodType: value })}
                >
                  <SelectTrigger id="basic-bloodType" data-testid="select-basic-blood-type">
                    <SelectValue placeholder={language === 'en' ? 'Select' : 'Wählen'} />
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
              <Label htmlFor="basic-allergies">{localT.editModal.allergies}</Label>
              <Input
                id="basic-allergies"
                value={basicInfoForm.allergies}
                onChange={(e) => setBasicInfoForm({ ...basicInfoForm, allergies: e.target.value })}
                placeholder={language === 'en' ? 'None' : 'Keine'}
                data-testid="input-basic-allergies"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setIsBasicInfoEditOpen(false)} className="min-h-[44px] active:scale-95 transition-transform">
              {localT.editModal.cancel}
            </Button>
            <Button onClick={handleBasicInfoSave} className="bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] hover:opacity-90 text-white rounded-2xl font-bold min-h-[44px] active:scale-95 transition-transform">
              <Save className="w-4 h-4 mr-2" />
              {localT.editModal.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
