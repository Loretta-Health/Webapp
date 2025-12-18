import { useState, useMemo, useEffect } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Zap, 
  Droplets, 
  Check, 
  Sparkles,
  Heart,
  Brain,
  Leaf,
  Clock,
  Target,
  ChevronRight,
  Dumbbell,
  Flame,
  Activity,
  Footprints,
  Moon,
  Wind,
  type LucideIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from '@/components/MascotCharacter';
import { useMissions } from '@/hooks/useMissions';
import { useQuery } from '@tanstack/react-query';
import { isLowMoodEmotion } from '../../../shared/emotions';
import { useWeatherAssessment } from '@/hooks/useWeatherAssessment';

interface MissionStep {
  id: number;
  completed: boolean;
  time?: string;
}

interface MissionData {
  id: number;
  title: string;
  frequency: string;
  description: string;
  xpReward: number;
  totalSteps: number;
  icon: LucideIcon;
  color: string;
  details: string;
  benefits: { icon: LucideIcon; text: string }[];
  initialSteps: MissionStep[];
  alternativeMissions: { id: number; title: string; xp: number; icon: string }[];
  communityTip: string;
  stepLabel: string;
  isWeatherDependent?: boolean;
  badWeatherAlternatives?: { id: number; title: string; xp: number; icon: string }[];
}

const colorClasses: Record<string, { card: string; iconBg: string; badge: string; stepComplete: string }> = {
  'chart-1': {
    card: 'bg-gradient-to-br from-chart-1/10 via-card to-card border-chart-1/20',
    iconBg: 'bg-gradient-to-br from-chart-1 to-chart-2 shadow-lg shadow-chart-1/30',
    badge: 'bg-chart-1/20 text-chart-1 border-chart-1/30',
    stepComplete: 'bg-gradient-to-br from-chart-1 to-chart-2 text-white shadow-lg shadow-chart-1/30'
  },
  'chart-2': {
    card: 'bg-gradient-to-br from-chart-2/10 via-card to-card border-chart-2/20',
    iconBg: 'bg-gradient-to-br from-chart-2 to-emerald-500 shadow-lg shadow-chart-2/30',
    badge: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
    stepComplete: 'bg-gradient-to-br from-chart-2 to-emerald-500 text-white shadow-lg shadow-chart-2/30'
  }
};

const missionsDatabase: Record<string, MissionData> = {
  'jumping-jacks': {
    id: 1,
    title: 'Complete 10 jumping jacks',
    frequency: 'daily',
    description: 'Get your heart pumping with quick cardio exercise',
    xpReward: 50,
    totalSteps: 10,
    icon: Dumbbell,
    color: 'chart-2',
    details: 'Jumping jacks are a full-body cardiovascular exercise that increases your heart rate, improves circulation, and helps wake up your muscles. This simple yet effective exercise is perfect for quick energy boosts throughout the day.',
    benefits: [
      { icon: Flame, text: 'Burns calories quickly' },
      { icon: Heart, text: 'Strengthens heart health' },
      { icon: Activity, text: 'Improves coordination' },
      { icon: Zap, text: 'Boosts energy levels' },
    ],
    initialSteps: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 201, title: 'Gentle stretching for 2 mins', xp: 50, icon: '🌸' },
      { id: 202, title: 'Walk in place for 1 minute', xp: 45, icon: '🚶' },
    ],
    communityTip: 'Try doing your jumping jacks in sets of 10 with short breaks. This helps maintain form and prevents fatigue!',
    stepLabel: 'Rep'
  },
  'water-glasses': {
    id: 2,
    title: 'Drink 8 glasses of water',
    frequency: 'daily',
    description: 'Stay hydrated throughout the day',
    xpReward: 30,
    totalSteps: 8,
    icon: Droplets,
    color: 'chart-1',
    details: 'This mission helps you maintain proper hydration levels throughout the day. Drinking water is essential for maintaining bodily functions and overall health.',
    benefits: [
      { icon: Zap, text: 'Improves energy levels' },
      { icon: Brain, text: 'Supports brain function' },
      { icon: Heart, text: 'Maintains kidney function' },
      { icon: Leaf, text: 'Maintains skin health' },
    ],
    initialSteps: Array.from({ length: 8 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 101, title: 'Sip water slowly, 4 small sips', xp: 30, icon: '💧' },
      { id: 102, title: 'Drink warm herbal tea', xp: 30, icon: '🍵' },
    ],
    communityTip: 'Try keeping a water bottle at your desk as a visual reminder to stay hydrated throughout the day.',
    stepLabel: 'Glass'
  },
  'meditation': {
    id: 3,
    title: 'Meditate for 5 minutes',
    frequency: 'daily',
    description: 'Calm your mind and reduce stress',
    xpReward: 40,
    totalSteps: 5,
    icon: Brain,
    color: 'chart-2',
    details: 'Meditation helps reduce stress, improve focus, and promote overall mental well-being. Just 5 minutes a day can make a significant difference in your mental clarity and emotional balance.',
    benefits: [
      { icon: Brain, text: 'Reduces stress and anxiety' },
      { icon: Heart, text: 'Lowers blood pressure' },
      { icon: Zap, text: 'Improves focus and concentration' },
      { icon: Leaf, text: 'Promotes emotional well-being' },
    ],
    initialSteps: Array.from({ length: 5 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 301, title: 'Quiet rest for 3 minutes', xp: 40, icon: '😌' },
      { id: 302, title: 'Listen to calming music', xp: 40, icon: '🎵' },
    ],
    communityTip: 'Find a quiet spot, close your eyes, and focus on your breath. Even 5 minutes can transform your day!',
    stepLabel: 'Minute'
  },
  'walking': {
    id: 4,
    title: 'Take a 10-minute walk',
    frequency: 'daily',
    description: 'Get moving and enjoy some fresh air',
    xpReward: 45,
    totalSteps: 10,
    icon: Footprints,
    color: 'chart-1',
    details: 'Walking is one of the best forms of exercise for overall health. A 10-minute brisk walk can boost your mood, improve circulation, and help you reach your daily activity goals.',
    benefits: [
      { icon: Heart, text: 'Improves cardiovascular health' },
      { icon: Brain, text: 'Boosts mood and mental clarity' },
      { icon: Zap, text: 'Increases energy levels' },
      { icon: Wind, text: 'Fresh air and vitamin D' },
    ],
    initialSteps: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 401, title: 'Walk gently in place for 2 mins', xp: 45, icon: '🚶' },
      { id: 402, title: 'Look out the window for 5 mins', xp: 40, icon: '🪟' },
    ],
    communityTip: 'Try walking during phone calls or after meals. Every step counts toward your daily goal!',
    stepLabel: 'Minute',
    isWeatherDependent: true,
    badWeatherAlternatives: [
      { id: 4001, title: 'Walk around your home for 10 mins', xp: 45, icon: '🏠' },
      { id: 4002, title: 'March in place for 5 mins', xp: 40, icon: '🚶' },
      { id: 4003, title: 'Do indoor stretching routine', xp: 35, icon: '🧘' },
    ],
  },
  'deep-breathing': {
    id: 5,
    title: 'Practice deep breathing',
    frequency: 'daily',
    description: 'Take 10 slow, deep breaths to relax',
    xpReward: 25,
    totalSteps: 10,
    icon: Wind,
    color: 'chart-2',
    details: 'Deep breathing exercises activate your parasympathetic nervous system, helping to reduce stress and anxiety. Taking slow, deliberate breaths can lower blood pressure and improve focus.',
    benefits: [
      { icon: Brain, text: 'Reduces stress and anxiety' },
      { icon: Heart, text: 'Lowers blood pressure' },
      { icon: Zap, text: 'Increases mental clarity' },
      { icon: Leaf, text: 'Promotes relaxation' },
    ],
    initialSteps: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 501, title: 'Rest and take 3 slow breaths', xp: 25, icon: '🌬️' },
      { id: 502, title: 'Close your eyes for 1 minute', xp: 25, icon: '😌' },
    ],
    communityTip: 'Try the 4-7-8 technique: breathe in for 4 seconds, hold for 7, exhale for 8.',
    stepLabel: 'Breath'
  },
  '1': {
    id: 1,
    title: 'Drink a cup of water',
    frequency: 'daily',
    description: 'Stay hydrated by drinking at least one cup of water to start your day right.',
    xpReward: 30,
    totalSteps: 8,
    icon: Droplets,
    color: 'chart-1',
    details: 'This mission helps you maintain proper hydration levels throughout the day. Drinking water is essential for maintaining bodily functions and overall health.',
    benefits: [
      { icon: Zap, text: 'Improves energy levels' },
      { icon: Brain, text: 'Supports brain function' },
      { icon: Heart, text: 'Maintains kidney function' },
      { icon: Leaf, text: 'Maintains skin health' },
    ],
    initialSteps: [
      { id: 1, completed: true, time: '7:00 AM' },
      { id: 2, completed: true, time: '9:00 AM' },
      { id: 3, completed: true, time: '11:00 AM' },
      { id: 4, completed: true, time: '1:00 PM' },
      { id: 5, completed: true, time: '3:00 PM' },
      { id: 6, completed: false },
      { id: 7, completed: false },
      { id: 8, completed: false },
    ],
    alternativeMissions: [
      { id: 101, title: 'Sip water slowly, 4 small sips', xp: 30, icon: '💧' },
      { id: 102, title: 'Drink warm herbal tea', xp: 30, icon: '🍵' },
    ],
    communityTip: 'Try keeping a water bottle at your desk as a visual reminder to stay hydrated throughout the day.',
    stepLabel: 'Glass'
  },
  '2': {
    id: 2,
    title: 'Complete 10 jumping jacks',
    frequency: 'daily',
    description: 'Get your blood flowing and heart rate up by doing 10 jumping jacks.',
    xpReward: 50,
    totalSteps: 4,
    icon: Dumbbell,
    color: 'chart-2',
    details: 'Jumping jacks are a full-body cardiovascular exercise that increases your heart rate, improves circulation, and helps wake up your muscles. This simple yet effective exercise is perfect for quick energy boosts throughout the day.',
    benefits: [
      { icon: Flame, text: 'Burns calories quickly' },
      { icon: Heart, text: 'Strengthens heart health' },
      { icon: Activity, text: 'Improves coordination' },
      { icon: Zap, text: 'Boosts energy levels' },
    ],
    initialSteps: [
      { id: 1, completed: true, time: '8:00 AM' },
      { id: 2, completed: true, time: '12:00 PM' },
      { id: 3, completed: true, time: '4:00 PM' },
      { id: 4, completed: true, time: '7:00 PM' },
    ],
    alternativeMissions: [
      { id: 201, title: 'Gentle stretching for 2 mins', xp: 50, icon: '🌸' },
      { id: 202, title: 'Walk in place for 1 minute', xp: 45, icon: '🚶' },
    ],
    communityTip: 'Try doing your jumping jacks in sets of 10 with short breaks. This helps maintain form and prevents fatigue!',
    stepLabel: 'Set'
  },
  'activity-steps': {
    id: 3,
    title: '5 minute outdoor walk',
    frequency: '2 times daily',
    description: 'Increase your daily activity by taking a brisk 5 minute walk outside.',
    xpReward: 30,
    totalSteps: 2,
    icon: Footprints,
    color: 'chart-1',
    details: 'Walking is one of the best forms of exercise for overall health. A 5-minute brisk walk can boost your mood, improve circulation, and help you reach your daily step goals.',
    benefits: [
      { icon: Heart, text: 'Improves cardiovascular health' },
      { icon: Brain, text: 'Boosts mood and mental clarity' },
      { icon: Zap, text: 'Increases energy levels' },
      { icon: Wind, text: 'Fresh air and vitamin D' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
    ],
    alternativeMissions: [
      { id: 301, title: 'Walk gently in place for 2 mins', xp: 30, icon: '🚶' },
      { id: 302, title: 'Look out the window for 5 mins', xp: 25, icon: '🪟' },
    ],
    communityTip: 'Try walking during phone calls or after meals. Every step counts toward your daily goal!',
    stepLabel: 'Walk',
    isWeatherDependent: true,
    badWeatherAlternatives: [
      { id: 3001, title: 'Walk around your home for 5 mins', xp: 30, icon: '🏠' },
      { id: 3002, title: 'March in place for 3 mins', xp: 25, icon: '🚶' },
      { id: 3003, title: 'Do light indoor exercises', xp: 25, icon: '🏃' },
    ],
  },
  'activity-sleep': {
    id: 4,
    title: 'Wind down routine',
    frequency: 'Every night',
    description: 'Start a relaxing bedtime routine 30 minutes before sleep - no screens!',
    xpReward: 25,
    totalSteps: 1,
    icon: Moon,
    color: 'chart-2',
    details: 'A consistent wind-down routine signals to your body that it\'s time to sleep. Reducing screen time before bed helps maintain your natural circadian rhythm.',
    benefits: [
      { icon: Brain, text: 'Better sleep quality' },
      { icon: Heart, text: 'Reduced stress levels' },
      { icon: Zap, text: 'More energy tomorrow' },
      { icon: Leaf, text: 'Improved mental health' },
    ],
    initialSteps: [
      { id: 1, completed: false },
    ],
    alternativeMissions: [
      { id: 401, title: 'Rest with eyes closed for 5 mins', xp: 25, icon: '😌' },
      { id: 402, title: 'Listen to soft music', xp: 20, icon: '🎵' },
    ],
    communityTip: 'Try dimming the lights and reading a book instead of scrolling. Your body will thank you!',
    stepLabel: 'Night'
  },
  'activity-heartRate': {
    id: 5,
    title: 'Deep breathing exercise',
    frequency: '3 times daily',
    description: 'Practice 5 minutes of deep breathing to help lower your heart rate naturally.',
    xpReward: 20,
    totalSteps: 3,
    icon: Heart,
    color: 'chart-1',
    details: 'Deep breathing activates your parasympathetic nervous system, which helps reduce stress and lower your heart rate. Regular practice can improve your cardiovascular health.',
    benefits: [
      { icon: Heart, text: 'Lowers resting heart rate' },
      { icon: Brain, text: 'Reduces anxiety and stress' },
      { icon: Leaf, text: 'Improves oxygen flow' },
      { icon: Zap, text: 'Increases focus' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
    ],
    alternativeMissions: [
      { id: 501, title: 'Rest and take 3 slow breaths', xp: 20, icon: '🌬️' },
      { id: 502, title: 'Sit quietly for 2 minutes', xp: 15, icon: '😌' },
    ],
    communityTip: 'Try the 4-7-8 technique: breathe in for 4 seconds, hold for 7, exhale for 8.',
    stepLabel: 'Session'
  },
  'activity-calories': {
    id: 6,
    title: 'Active break',
    frequency: 'Every 2 hours',
    description: 'Take a 10-minute active break with stretching or light movement.',
    xpReward: 15,
    totalSteps: 4,
    icon: Flame,
    color: 'chart-2',
    details: 'Regular movement breaks help prevent the negative effects of prolonged sitting. Even short bursts of activity can boost your metabolism and improve focus.',
    benefits: [
      { icon: Flame, text: 'Burns extra calories' },
      { icon: Activity, text: 'Prevents muscle stiffness' },
      { icon: Brain, text: 'Improves concentration' },
      { icon: Heart, text: 'Better circulation' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
      { id: 4, completed: false },
    ],
    alternativeMissions: [
      { id: 601, title: 'Stand up and stretch gently', xp: 15, icon: '🌸' },
      { id: 602, title: 'Walk to the window and back', xp: 15, icon: '🚶' },
    ],
    communityTip: 'Set a timer every 2 hours to remind yourself to move. Your body and mind will perform better!',
    stepLabel: 'Break'
  },
  '101': {
    id: 101,
    title: 'Drink herbal tea',
    frequency: 'daily',
    description: 'Stay hydrated with calming herbal tea - a delicious alternative to plain water.',
    xpReward: 25,
    totalSteps: 6,
    icon: Droplets,
    color: 'chart-2',
    details: 'Herbal teas like chamomile, peppermint, or ginger provide hydration along with additional health benefits. They\'re caffeine-free and can help with relaxation, digestion, and overall wellness.',
    benefits: [
      { icon: Droplets, text: 'Hydrates your body' },
      { icon: Leaf, text: 'Natural antioxidants' },
      { icon: Brain, text: 'Promotes relaxation' },
      { icon: Heart, text: 'Supports digestion' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
      { id: 4, completed: false },
      { id: 5, completed: false },
      { id: 6, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Keep a variety of herbal teas at your desk. Peppermint is great for focus, chamomile for relaxation!',
    stepLabel: 'Cup'
  },
  '102': {
    id: 102,
    title: 'Eat water-rich fruits',
    frequency: 'daily',
    description: 'Get your hydration from delicious fruits like watermelon, oranges, and grapes.',
    xpReward: 20,
    totalSteps: 4,
    icon: Leaf,
    color: 'chart-1',
    details: 'Water-rich fruits like watermelon (92% water), strawberries, and oranges are excellent for hydration. They also provide vitamins, fiber, and natural sugars for energy.',
    benefits: [
      { icon: Droplets, text: 'Natural hydration' },
      { icon: Zap, text: 'Natural energy boost' },
      { icon: Leaf, text: 'Rich in vitamins' },
      { icon: Heart, text: 'Fiber for digestion' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
      { id: 4, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Keep pre-cut fruit in your fridge for easy snacking. Frozen grapes make a refreshing treat!',
    stepLabel: 'Serving'
  },
  '201': {
    id: 201,
    title: 'Do 20 squats',
    frequency: 'daily',
    description: 'Strengthen your legs and core with 20 squats throughout the day.',
    xpReward: 45,
    totalSteps: 4,
    icon: Dumbbell,
    color: 'chart-2',
    details: 'Squats are a compound exercise that work multiple muscle groups including quads, hamstrings, glutes, and core. They\'re excellent for building lower body strength and improving mobility.',
    benefits: [
      { icon: Dumbbell, text: 'Builds leg strength' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Activity, text: 'Improves mobility' },
      { icon: Heart, text: 'Boosts circulation' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
      { id: 4, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Do 5 squats every hour. By the end of the day, you\'ll have done 40+ without even trying!',
    stepLabel: 'Set of 5'
  },
  '202': {
    id: 202,
    title: 'Take a 5-min walk',
    frequency: 'daily',
    description: 'Get moving with short 5-minute walks throughout your day.',
    xpReward: 35,
    totalSteps: 4,
    icon: Footprints,
    color: 'chart-1',
    details: 'Short walking breaks are perfect for those who prefer low-impact exercise. Walking improves mood, boosts creativity, and helps maintain cardiovascular health without the intensity of jumping exercises.',
    benefits: [
      { icon: Footprints, text: 'Low-impact exercise' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Heart, text: 'Heart-healthy' },
      { icon: Wind, text: 'Fresh air boost' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
      { id: 4, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Walk during phone calls or after meals. It\'s an easy way to add more steps to your day!',
    stepLabel: 'Walk'
  },
  '301': {
    id: 301,
    title: 'March in place for 5 mins',
    frequency: '2 times daily',
    description: 'Get your steps in without leaving your spot - perfect for bad weather or small spaces.',
    xpReward: 25,
    totalSteps: 2,
    icon: Footprints,
    color: 'chart-1',
    details: 'Marching in place is a great indoor alternative to walking outside. It raises your heart rate, works your legs, and can be done anywhere - even while watching TV or waiting for coffee!',
    benefits: [
      { icon: Footprints, text: 'Indoor-friendly' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Activity, text: 'Improves coordination' },
      { icon: Zap, text: 'Boosts energy' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Add arm swings while marching to get an upper body workout too!',
    stepLabel: 'Session'
  },
  '302': {
    id: 302,
    title: 'Climb stairs for 3 mins',
    frequency: '2 times daily',
    description: 'Take the stairs! A quick stair climb is an excellent cardio workout.',
    xpReward: 30,
    totalSteps: 2,
    icon: Activity,
    color: 'chart-2',
    details: 'Stair climbing is one of the most effective exercises for cardiovascular health and lower body strength. Just 3 minutes of stair climbing can burn more calories than walking on flat ground.',
    benefits: [
      { icon: Flame, text: 'High calorie burn' },
      { icon: Heart, text: 'Cardio boost' },
      { icon: Dumbbell, text: 'Leg strength' },
      { icon: Activity, text: 'Builds endurance' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Skip the elevator and take the stairs. Your heart and legs will thank you!',
    stepLabel: 'Session'
  },
  '401': {
    id: 401,
    title: 'Read a book before bed',
    frequency: 'Every night',
    description: 'Wind down with 20 minutes of reading instead of screen time.',
    xpReward: 20,
    totalSteps: 1,
    icon: Moon,
    color: 'chart-2',
    details: 'Reading before bed is a proven way to reduce stress and prepare your mind for sleep. Unlike screens, books don\'t emit blue light that disrupts your circadian rhythm.',
    benefits: [
      { icon: Brain, text: 'Reduces stress' },
      { icon: Moon, text: 'Better sleep' },
      { icon: Leaf, text: 'No blue light' },
      { icon: Zap, text: 'Expands knowledge' },
    ],
    initialSteps: [
      { id: 1, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Keep a book on your nightstand so it\'s always ready. Fiction works great for relaxation!',
    stepLabel: 'Night'
  },
  '402': {
    id: 402,
    title: 'Practice meditation',
    frequency: 'Every night',
    description: 'Calm your mind with 10 minutes of guided meditation before sleep.',
    xpReward: 25,
    totalSteps: 1,
    icon: Moon,
    color: 'chart-2',
    details: 'Meditation before bed helps quiet the mind and release the day\'s tensions. Even just 10 minutes of mindfulness can significantly improve sleep quality and reduce anxiety.',
    benefits: [
      { icon: Brain, text: 'Calms the mind' },
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Moon, text: 'Deeper sleep' },
      { icon: Leaf, text: 'Reduces anxiety' },
    ],
    initialSteps: [
      { id: 1, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Try apps like Headspace or Calm for guided sleep meditations. Start with just 5 minutes!',
    stepLabel: 'Night'
  },
  '501': {
    id: 501,
    title: 'Try box breathing',
    frequency: '3 times daily',
    description: 'Use the box breathing technique to calm your nervous system.',
    xpReward: 20,
    totalSteps: 3,
    icon: Heart,
    color: 'chart-1',
    details: 'Box breathing is a powerful technique used by Navy SEALs: breathe in for 4 seconds, hold for 4, exhale for 4, hold for 4. It activates your parasympathetic nervous system for instant calm.',
    benefits: [
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Brain, text: 'Reduces anxiety' },
      { icon: Zap, text: 'Increases focus' },
      { icon: Leaf, text: 'Easy to learn' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Visualize tracing a square as you breathe: up (inhale), right (hold), down (exhale), left (hold).',
    stepLabel: 'Session'
  },
  '502': {
    id: 502,
    title: 'Do gentle stretching',
    frequency: '3 times daily',
    description: 'Relax your muscles and calm your mind with gentle stretching.',
    xpReward: 15,
    totalSteps: 3,
    icon: Activity,
    color: 'chart-2',
    details: 'Gentle stretching releases muscle tension and promotes relaxation. Focus on your neck, shoulders, and back - common areas where we hold stress.',
    benefits: [
      { icon: Activity, text: 'Releases tension' },
      { icon: Heart, text: 'Calms the body' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Leaf, text: 'Improves flexibility' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Hold each stretch for 20-30 seconds and breathe deeply. Never bounce!',
    stepLabel: 'Session'
  },
  '601': {
    id: 601,
    title: 'Do desk exercises',
    frequency: 'Every 2 hours',
    description: 'Stay active at your desk with simple exercises you can do in your chair.',
    xpReward: 15,
    totalSteps: 4,
    icon: Dumbbell,
    color: 'chart-2',
    details: 'Desk exercises like seated leg raises, chair squats, and desk push-ups help you stay active even during long work sessions. They prevent stiffness and boost circulation.',
    benefits: [
      { icon: Activity, text: 'Prevents stiffness' },
      { icon: Brain, text: 'Improves focus' },
      { icon: Flame, text: 'Burns calories' },
      { icon: Heart, text: 'Better circulation' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
      { id: 4, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Set a reminder every 2 hours. Even 2 minutes of desk exercises makes a difference!',
    stepLabel: 'Break'
  },
  '602': {
    id: 602,
    title: 'Take the stairs',
    frequency: 'Every 2 hours',
    description: 'Skip the elevator and take the stairs for a quick energy boost.',
    xpReward: 20,
    totalSteps: 4,
    icon: Activity,
    color: 'chart-1',
    details: 'Taking the stairs is an easy way to add more activity to your day. It\'s a natural HIIT workout that strengthens your legs and gets your heart pumping.',
    benefits: [
      { icon: Flame, text: 'High calorie burn' },
      { icon: Dumbbell, text: 'Leg strength' },
      { icon: Zap, text: 'Energy boost' },
      { icon: Heart, text: 'Cardio workout' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
      { id: 4, completed: false },
    ],
    alternativeMissions: [],
    communityTip: 'Challenge yourself: can you take the stairs every time today? Your body will adapt quickly!',
    stepLabel: 'Trip'
  }
};

export default function MissionDetails() {
  const { t } = useTranslation('pages');
  const { t: tDashboard } = useTranslation('dashboard');
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const urlMissionId = params.get('id');
  
  const { missions, activeMissions, inactiveMissions, updateMissionProgress, activateMission, deactivateMission } = useMissions();

  // Check if user has a low mood check-in today for alternative missions
  const { data: latestCheckin } = useQuery<{ emotion: string; checkedInAt: string } | null>({
    queryKey: ['/api/emotional-checkins/latest'],
  });
  
  const hasLowMoodToday = useMemo(() => {
    if (!latestCheckin) return false;
    const checkinDate = new Date(latestCheckin.checkedInAt).toDateString();
    const today = new Date().toDateString();
    return checkinDate === today && isLowMoodEmotion(latestCheckin.emotion);
  }, [latestCheckin]);

  // Check weather for bad weather alternatives
  const { isBadWeather, assessment: weatherAssessment } = useWeatherAssessment();

  // Get mission data - use default if no ID provided
  const missionData = urlMissionId ? (missionsDatabase[urlMissionId] || missionsDatabase['1']) : missionsDatabase['1'];
  
  const existingMission = missions.find(m => 
    m.missionKey === urlMissionId || m.href?.includes(`?id=${urlMissionId}`)
  );
  const initialProgress = existingMission?.progress || 0;
  
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [steps, setSteps] = useState<MissionStep[]>(() => {
    const stepsWithProgress = missionData.initialSteps.map((step, index) => ({
      ...step,
      completed: index < initialProgress,
      time: index < initialProgress ? step.time : undefined,
    }));
    return stepsWithProgress;
  });
  const [showCelebration, setShowCelebration] = useState(false);
  
  useEffect(() => {
    if (existingMission && urlMissionId) {
      const currentMissionData = missionsDatabase[urlMissionId] || missionsDatabase['1'];
      setSteps(currentMissionData.initialSteps.map((step, index) => ({
        ...step,
        completed: index < existingMission.progress,
        time: index < existingMission.progress ? step.time : undefined,
      })));
    }
  }, [existingMission?.progress, urlMissionId]);

  // If no specific mission ID, show all missions overview
  if (!urlMissionId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <header className="sticky top-0 z-40 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link href="/my-dashboard">
              <Button size="icon" variant="ghost" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-black text-foreground">{tDashboard('missions.allMissions')}</h1>
          </div>
        </header>
        
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Active Missions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary" />
              {tDashboard('missions.activeMissions')} ({activeMissions.length})
            </h2>
            {activeMissions.length === 0 ? (
              <Card className="p-6 text-center border-dashed">
                <p className="text-muted-foreground">{tDashboard('missions.noActive')}</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {activeMissions.map((mission) => (
                  <Card key={mission.id} className="p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-foreground">{mission.title}</h3>
                          <Badge variant="default" className="bg-primary/20 text-primary text-xs">
                            {tDashboard('missions.active')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{mission.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={(mission.progress / mission.maxProgress) * 100} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground">{mission.progress}/{mission.maxProgress}</span>
                          <span className="text-xs font-bold text-primary">+{mission.xpReward} XP</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/mission-details?id=${mission.missionKey}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deactivateMission(mission.id)}
                          className="text-muted-foreground"
                        >
                          {tDashboard('missions.deactivateMission')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Available Missions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-muted-foreground" />
              {tDashboard('missions.availableMissions')} ({inactiveMissions.length})
            </h2>
            {inactiveMissions.length > 0 && (
              <div className="space-y-3">
                {inactiveMissions.map((mission) => (
                  <Link key={mission.id} href={`/mission-details?id=${mission.missionKey}`}>
                    <Card className="p-4 opacity-60 hover:opacity-100 transition-all cursor-pointer hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground">{mission.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {tDashboard('missions.inactive')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{mission.description}</p>
                          <span className="text-xs font-bold text-primary mt-2 block">+{mission.xpReward} XP</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              activateMission(mission.id);
                            }}
                          >
                            {tDashboard('missions.activateMission')}
                          </Button>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }
  
  // These use the missionData already computed above
  const MissionIcon = missionData.icon;
  const colors = colorClasses[missionData.color] || colorClasses['chart-1'];
  const dbMissionId = existingMission?.id;
  
  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = (completedCount / missionData.totalSteps) * 100;
  const nextStep = steps.find(s => !s.completed);
  
  const handleLogCompletion = () => {
    console.log('[MissionDetails] handleLogCompletion called', { 
      nextStep: !!nextStep, 
      dbMissionId, 
      urlMissionId,
      missionsCount: missions.length,
      existingMission: existingMission ? { id: existingMission.id, href: existingMission.href } : null
    });
    
    if (nextStep && dbMissionId) {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      
      const newCompletedCount = completedCount + 1;
      console.log('[MissionDetails] Updating progress', { dbMissionId, newCompletedCount });
      
      setSteps(prev => prev.map(step => 
        step.id === nextStep.id 
          ? { ...step, completed: true, time: timeString }
          : step
      ));
      
      updateMissionProgress(dbMissionId, newCompletedCount);
      
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    } else {
      console.log('[MissionDetails] Cannot log - missing nextStep or dbMissionId');
    }
  };
  
  const isComplete = completedCount >= missionData.totalSteps;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-primary/20 backdrop-blur-sm rounded-full p-8">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-16 h-16 text-primary" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className="sticky top-0 z-40 bg-gradient-to-r from-card via-card to-primary/5 border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/my-dashboard">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-black text-foreground">{t('missionDetails.title')}</h1>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className={`p-6 ${colors.card}`}>
            <div className="flex items-start gap-4 mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${colors.iconBg}`}>
                <MissionIcon className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-foreground" data-testid="mission-title">
                    {missionData.title}
                  </h2>
                </div>
                <Badge className={colors.badge} data-testid="mission-frequency">
                  {missionData.frequency}
                </Badge>
                <p className="text-muted-foreground mt-2" data-testid="mission-description">
                  {missionData.description}
                </p>
              </div>
              
              <MascotCharacter 
                size="sm" 
                pose={isComplete ? 'celebrate' : 'encourage'}
                speech={isComplete ? "Amazing!" : "You can do it!"}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-muted-foreground uppercase">{t('missionDetails.progress')}</span>
                <span className="text-sm font-bold text-foreground" data-testid="mission-progress-text">
                  {completedCount} of {missionData.totalSteps} steps
                </span>
              </div>
              
              <div className="relative">
                <Progress value={progressPercent} className="h-4" data-testid="mission-progress-bar" />
                <div 
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                  style={{ left: `calc(${progressPercent}% - 12px)` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-primary flex items-center justify-center shadow-lg">
                    <MissionIcon className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                {steps.map((step, index) => (
                  <motion.div
                    key={step.id}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step.completed
                        ? colors.stepComplete
                        : 'bg-muted/50 text-muted-foreground border-2 border-dashed border-muted-foreground/30'
                    }`}
                    data-testid={`step-indicator-${index}`}
                  >
                    {step.completed ? <Check className="w-4 h-4" /> : index + 1}
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary fill-primary" />
                  <span className="font-black text-primary" data-testid="mission-xp">
                    +{missionData.xpReward} XP per step
                  </span>
                </div>
                
                <Button
                  size="lg"
                  className={`font-black ${isComplete ? '' : 'animate-pulse-glow'}`}
                  disabled={isComplete || !existingMission?.isActive}
                  onClick={handleLogCompletion}
                  data-testid="button-log-completion"
                >
                  {isComplete ? (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      {t('missionDetails.completed')}
                    </>
                  ) : (
                    <>
                      <MissionIcon className="w-5 h-5 mr-2" />
                      {t('missionDetails.logCompletion')}
                    </>
                  )}
                </Button>
              </div>
              
              {existingMission && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {existingMission.isActive ? tDashboard('missions.active') : tDashboard('missions.inactive')}
                    </span>
                  </div>
                  <Button
                    variant={existingMission.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => existingMission.isActive 
                      ? deactivateMission(existingMission.id) 
                      : activateMission(existingMission.id)
                    }
                  >
                    {existingMission.isActive 
                      ? tDashboard('missions.deactivateMission') 
                      : tDashboard('missions.activateMission')
                    }
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
        
        <Tabs defaultValue="main" className="w-full">
          <TabsList className={`grid w-full bg-muted/50 ${
            (hasLowMoodToday && missionData.alternativeMissions.length > 0) && 
            (isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length) 
              ? 'grid-cols-3' 
              : (hasLowMoodToday && missionData.alternativeMissions.length > 0) || 
                (isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length) 
                ? 'grid-cols-2' 
                : 'grid-cols-1'
          }`}>
            <TabsTrigger value="main" className="font-bold" data-testid="tab-main-mission">
              {t('missionDetails.tabs.mainMission')}
            </TabsTrigger>
            {hasLowMoodToday && missionData.alternativeMissions.length > 0 && (
              <TabsTrigger value="alternatives" className="font-bold" data-testid="tab-alternatives">
                {t('missionDetails.tabs.alternatives')}
              </TabsTrigger>
            )}
            {isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length && (
              <TabsTrigger value="weather" className="font-bold" data-testid="tab-weather-alternatives">
                {t('missionDetails.tabs.weatherAlternatives')}
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="main" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-5">
                <h3 className="text-lg font-black text-foreground mb-3">{t('missionDetails.missionDetails')}</h3>
                <p className="text-muted-foreground leading-relaxed" data-testid="mission-details-text">
                  {missionData.details}
                </p>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-5">
                <h3 className="text-lg font-black text-foreground mb-4">{t('missionDetails.benefits')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {missionData.benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-chart-2/10 to-transparent rounded-lg"
                      data-testid={`benefit-${index}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2/20 to-chart-2/10 flex items-center justify-center">
                        <benefit.icon className="w-5 h-5 text-chart-2" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-5">
                <h3 className="text-lg font-black text-foreground mb-4">{t('missionDetails.todaysLog')}</h3>
                <div className="space-y-2">
                  {steps.filter(s => s.completed).map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-lg ${missionData.color === 'chart-2' ? 'bg-chart-2/5' : 'bg-chart-1/5'}`}
                      data-testid={`log-entry-${index}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.stepComplete}`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-foreground">{missionData.stepLabel} #{step.id}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{step.time}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {steps.filter(s => !s.completed).length > 0 && (
                    <div className="flex items-center gap-3 p-3 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                        <Target className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground">
                        {t('missionDetails.stepsRemaining', { count: steps.filter(s => !s.completed).length })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-5 bg-gradient-to-r from-chart-2/10 to-primary/10 border-chart-2/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-chart-2 to-emerald-500 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground mb-1">{tDashboard('community.communityTip')}</h4>
                    <p className="text-sm text-muted-foreground" data-testid="community-tip">
                      {missionData.communityTip}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
          
          {hasLowMoodToday && missionData.alternativeMissions.length > 0 && (
            <TabsContent value="alternatives" className="mt-4 space-y-3">
              <Card className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground mb-1">{t('missionDetails.moodBanner.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('missionDetails.moodBanner.description')}
                    </p>
                  </div>
                </div>
              </Card>
              
              {missionData.alternativeMissions.map((alt, index) => (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/alternative-mission?id=${alt.id}&original=${urlMissionId}`}>
                    <Card 
                      className="p-4 hover-elevate cursor-pointer transition-all"
                      data-testid={`alternative-mission-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center text-2xl">
                          {alt.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{alt.title}</h4>
                          <div className="flex items-center gap-1 text-primary">
                            <Zap className="w-4 h-4 fill-primary" />
                            <span className="text-sm font-bold">+{alt.xp} XP</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
              
              <Card className="p-4 border-dashed border-2 border-muted-foreground/20">
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    {t('missionDetails.alternativesHint')}
                  </p>
                </div>
              </Card>
            </TabsContent>
          )}
          
          {isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length && (
            <TabsContent value="weather" className="mt-4 space-y-3">
              <Card className="p-4 bg-gradient-to-r from-blue-500/10 to-slate-500/10 border-blue-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-slate-500 flex items-center justify-center flex-shrink-0">
                    <Wind className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-foreground mb-1">{t('missionDetails.weatherBanner.title')}</h4>
                    <p className="text-sm text-muted-foreground">
                      {t('missionDetails.weatherBanner.description')}
                    </p>
                  </div>
                </div>
              </Card>
              
              {missionData.badWeatherAlternatives.map((alt, index) => (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/alternative-mission?id=${alt.id}&original=${urlMissionId}&type=weather`}>
                    <Card 
                      className="p-4 hover-elevate cursor-pointer transition-all"
                      data-testid={`weather-alternative-mission-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-slate-500/20 flex items-center justify-center text-2xl">
                          {alt.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{alt.title}</h4>
                          <div className="flex items-center gap-1 text-primary">
                            <Zap className="w-4 h-4 fill-primary" />
                            <span className="text-sm font-bold">+{alt.xp} XP</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              ))}
              
              <Card className="p-4 border-dashed border-2 border-muted-foreground/20">
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm">
                    {t('missionDetails.weatherAlternativesHint')}
                  </p>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
