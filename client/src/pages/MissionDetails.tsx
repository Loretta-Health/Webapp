import { useState, useMemo, useEffect } from 'react';
import { useLocation, Link, useSearch } from 'wouter';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { BackButton } from '@/components/BackButton';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
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
import { useMissions } from '@/hooks/useMissions';
import { useQuery } from '@tanstack/react-query';
import { isLowMoodEmotion } from '../../../shared/emotions';
import { useWeatherAssessment } from '@/hooks/useWeatherAssessment';
import { useWeatherSimulation } from '@/contexts/WeatherSimulationContext';

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

const colorClasses: Record<string, { card: string; iconBg: string; badge: string; stepComplete: string; button: string }> = {
  'chart-1': {
    card: '',
    iconBg: 'bg-gradient-to-br from-[#013DC4] to-[#0150FF] shadow-lg shadow-[#013DC4]/30',
    badge: 'bg-[#013DC4]/10 text-[#013DC4] border-[#013DC4]/20',
    stepComplete: 'bg-gradient-to-br from-[#013DC4] to-[#0150FF] text-white shadow-lg shadow-[#013DC4]/30',
    button: 'bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] hover:opacity-90'
  },
  'chart-2': {
    card: '',
    iconBg: 'bg-gradient-to-br from-[#CDB6EF] to-[#4B7BE5] shadow-lg shadow-[#CDB6EF]/30',
    badge: 'bg-[#CDB6EF]/20 text-[#4B7BE5] border-[#CDB6EF]/30',
    stepComplete: 'bg-gradient-to-br from-[#CDB6EF] to-[#4B7BE5] text-white shadow-lg shadow-[#CDB6EF]/30',
    button: 'bg-gradient-to-r from-[#CDB6EF] to-[#4B7BE5] hover:opacity-90'
  }
};

const missionsDatabase: Record<string, MissionData> = {
  'jumping-jacks': {
    id: 1,
    title: 'Complete 10 jumping jacks',
    frequency: 'daily',
    description: 'Get your heart pumping with quick cardio exercise',
    xpReward: 50,
    totalSteps: 3,
    icon: Dumbbell,
    color: 'chart-2',
    details: 'Jumping jacks are a full-body cardiovascular exercise that increases your heart rate, improves circulation, and helps wake up your muscles. Complete a set of 10 jumping jacks up to 3 times today for an energy boost.',
    benefits: [
      { icon: Flame, text: 'Burns calories quickly' },
      { icon: Heart, text: 'Strengthens heart health' },
      { icon: Activity, text: 'Improves coordination' },
      { icon: Zap, text: 'Boosts energy levels' },
    ],
    initialSteps: Array.from({ length: 3 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 201, title: 'Gentle stretching for 2 mins', xp: 50, icon: '🌸' },
      { id: 202, title: 'Walk in place for 1 minute', xp: 45, icon: '🚶' },
    ],
    communityTip: 'Do a quick set of 10 jumping jacks in the morning, after lunch, and in the evening for an energy boost!',
    stepLabel: 'Set'
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
    totalSteps: 1,
    icon: Brain,
    color: 'chart-2',
    details: 'Meditation helps reduce stress, improve focus, and promote overall mental well-being. Just 5 minutes a day can make a significant difference in your mental clarity and emotional balance.',
    benefits: [
      { icon: Brain, text: 'Reduces stress and anxiety' },
      { icon: Heart, text: 'Lowers blood pressure' },
      { icon: Zap, text: 'Improves focus and concentration' },
      { icon: Leaf, text: 'Promotes emotional well-being' },
    ],
    initialSteps: Array.from({ length: 1 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 301, title: 'Quiet rest for 3 minutes', xp: 40, icon: '😌' },
      { id: 302, title: 'Listen to calming music', xp: 40, icon: '🎵' },
    ],
    communityTip: 'Find a quiet spot, close your eyes, and focus on your breath. Even 5 minutes can transform your day!',
    stepLabel: 'Session'
  },
  'walking': {
    id: 4,
    title: 'Take a 10-minute walk',
    frequency: 'daily',
    description: 'Get moving and enjoy some fresh air',
    xpReward: 45,
    totalSteps: 2,
    icon: Footprints,
    color: 'chart-1',
    details: 'Walking is one of the best forms of exercise for overall health. A 10-minute brisk walk can boost your mood, improve circulation, and help you reach your daily activity goals. Complete 2 walks today.',
    benefits: [
      { icon: Heart, text: 'Improves cardiovascular health' },
      { icon: Brain, text: 'Boosts mood and mental clarity' },
      { icon: Zap, text: 'Increases energy levels' },
      { icon: Wind, text: 'Fresh air and vitamin D' },
    ],
    initialSteps: Array.from({ length: 2 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 401, title: 'Walk gently in place for 2 mins', xp: 45, icon: '🚶' },
      { id: 402, title: 'Look out the window for 5 mins', xp: 40, icon: '🪟' },
    ],
    communityTip: 'Try walking during phone calls or after meals. Every step counts toward your daily goal!',
    stepLabel: 'Walk',
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
    totalSteps: 3,
    icon: Wind,
    color: 'chart-2',
    details: 'Deep breathing exercises activate your parasympathetic nervous system, helping to reduce stress and anxiety. Complete a set of 10 slow breaths up to 3 times today.',
    benefits: [
      { icon: Brain, text: 'Reduces stress and anxiety' },
      { icon: Heart, text: 'Lowers blood pressure' },
      { icon: Zap, text: 'Increases mental clarity' },
      { icon: Leaf, text: 'Promotes relaxation' },
    ],
    initialSteps: Array.from({ length: 3 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [
      { id: 501, title: 'Rest and take 3 slow breaths', xp: 25, icon: '🌬️' },
      { id: 502, title: 'Close your eyes for 1 minute', xp: 20, icon: '😌' },
    ],
    communityTip: 'Try the 4-7-8 technique: breathe in for 4 seconds, hold for 7, exhale for 8.',
    stepLabel: 'Session'
  },
  '1': {
    id: 1,
    title: 'Drink 8 glasses of water',
    frequency: 'daily',
    description: 'Stay hydrated by drinking water throughout the day.',
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
    totalSteps: 3,
    icon: Dumbbell,
    color: 'chart-2',
    details: 'Jumping jacks are a full-body cardiovascular exercise that increases your heart rate, improves circulation, and helps wake up your muscles. Complete a set of 10 jumping jacks up to 3 times today.',
    benefits: [
      { icon: Flame, text: 'Burns calories quickly' },
      { icon: Heart, text: 'Strengthens heart health' },
      { icon: Activity, text: 'Improves coordination' },
      { icon: Zap, text: 'Boosts energy levels' },
    ],
    initialSteps: [
      { id: 1, completed: false },
      { id: 2, completed: false },
      { id: 3, completed: false },
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
    frequency: 'daily',
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
    frequency: 'daily',
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
    frequency: 'daily',
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
    frequency: 'daily',
    description: 'Take a 5-minute active break with stretching or light movement.',
    xpReward: 20,
    totalSteps: 2,
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
    ],
    alternativeMissions: [
      { id: 601, title: 'Stand up and stretch gently', xp: 20, icon: '🌸' },
      { id: 602, title: 'Walk to the window and back', xp: 15, icon: '🚶' },
    ],
    communityTip: 'Take one break mid-morning and another mid-afternoon. Your body and mind will perform better!',
    stepLabel: 'Break'
  },
  '101': {
    id: 101,
    title: 'Drink herbal tea',
    frequency: 'daily',
    description: 'Stay hydrated with calming herbal tea - a delicious alternative to plain water.',
    xpReward: 25,
    totalSteps: 2,
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
    totalSteps: 2,
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
    totalSteps: 2,
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
    ],
    alternativeMissions: [],
    communityTip: 'Do 10 squats in the morning and 10 in the afternoon. Simple and effective!',
    stepLabel: 'Set of 10'
  },
  '202': {
    id: 202,
    title: 'Take a 5-min walk',
    frequency: 'daily',
    description: 'Get moving with short 5-minute walks throughout your day.',
    xpReward: 35,
    totalSteps: 2,
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
    ],
    alternativeMissions: [],
    communityTip: 'Walk during phone calls or after meals. It\'s an easy way to add more steps to your day!',
    stepLabel: 'Walk'
  },
  '301': {
    id: 301,
    title: 'March in place for 5 mins',
    frequency: 'daily',
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
    frequency: 'daily',
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
    frequency: 'daily',
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
    frequency: 'daily',
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
    frequency: 'daily',
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
    frequency: 'daily',
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
    frequency: 'daily',
    description: 'Stay active at your desk with simple exercises you can do in your chair.',
    xpReward: 15,
    totalSteps: 2,
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
    ],
    alternativeMissions: [],
    communityTip: 'Take one break mid-morning and another mid-afternoon. Your body will thank you!',
    stepLabel: 'Break'
  },
  '602': {
    id: 602,
    title: 'Take the stairs',
    frequency: 'daily',
    description: 'Skip the elevator and take the stairs for a quick energy boost.',
    xpReward: 20,
    totalSteps: 2,
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
    ],
    alternativeMissions: [],
    communityTip: 'Challenge yourself: can you take the stairs every time today? Your body will adapt quickly!',
    stepLabel: 'Trip'
  },
  'gentle-stretching': {
    id: 700,
    title: 'Gentle Stretching',
    frequency: 'daily',
    description: 'Perform gentle stretches to relax your muscles',
    xpReward: 50,
    totalSteps: 2,
    icon: Activity,
    color: 'chart-2',
    details: 'Gentle stretching helps release muscle tension and improve flexibility. It\'s a perfect low-impact alternative when you need a break from more intense activities.',
    benefits: [
      { icon: Leaf, text: 'Relaxes muscles' },
      { icon: Heart, text: 'Improves circulation' },
      { icon: Brain, text: 'Reduces stress' },
      { icon: Zap, text: 'Increases flexibility' },
    ],
    initialSteps: Array.from({ length: 2 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [],
    communityTip: 'Hold each stretch for 15-30 seconds and breathe deeply.',
    stepLabel: 'Stretch'
  },
  'quiet-rest': {
    id: 701,
    title: 'Quiet Rest',
    frequency: 'daily',
    description: 'Take a peaceful moment to rest and recharge',
    xpReward: 40,
    totalSteps: 3,
    icon: Moon,
    color: 'chart-2',
    details: 'Sometimes your body needs quiet rest to recover. Taking a few minutes to simply be still can help reduce stress and restore energy.',
    benefits: [
      { icon: Brain, text: 'Mental clarity' },
      { icon: Heart, text: 'Lowers heart rate' },
      { icon: Leaf, text: 'Reduces anxiety' },
      { icon: Zap, text: 'Restores energy' },
    ],
    initialSteps: Array.from({ length: 3 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [],
    communityTip: 'Find a comfortable spot, close your eyes, and let go of any tension.',
    stepLabel: 'Minute'
  },
  'rest-breathe': {
    id: 702,
    title: 'Rest & Breathe',
    frequency: 'daily',
    description: 'Combine rest with breathing exercises',
    xpReward: 25,
    totalSteps: 3,
    icon: Wind,
    color: 'chart-1',
    details: 'Combining rest with deep breathing maximizes relaxation and stress relief. This gentle practice is perfect when you need to calm down quickly.',
    benefits: [
      { icon: Brain, text: 'Calms the mind' },
      { icon: Heart, text: 'Regulates breathing' },
      { icon: Leaf, text: 'Promotes peace' },
      { icon: Zap, text: 'Quick stress relief' },
    ],
    initialSteps: Array.from({ length: 3 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [],
    communityTip: 'Breathe in slowly for 4 counts, hold for 4, then exhale for 4.',
    stepLabel: 'Breath'
  },
  'short-walk': {
    id: 703,
    title: 'Short Walk',
    frequency: 'daily',
    description: 'Take a brief walk to get moving',
    xpReward: 45,
    totalSteps: 2,
    icon: Footprints,
    color: 'chart-1',
    details: 'A short walk is a great way to get your body moving without overexertion. Perfect when you want some activity but need to take it easy.',
    benefits: [
      { icon: Heart, text: 'Light cardio' },
      { icon: Brain, text: 'Clears your mind' },
      { icon: Zap, text: 'Gentle energy boost' },
      { icon: Wind, text: 'Fresh air' },
    ],
    initialSteps: Array.from({ length: 2 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [],
    communityTip: 'Even a 5-minute walk can make a difference in how you feel.',
    stepLabel: 'Walk',
    isWeatherDependent: true,
    badWeatherAlternatives: [
      { id: 7001, title: 'Walk around indoors', xp: 45, icon: '🏠' },
      { id: 7002, title: 'March in place', xp: 40, icon: '🚶' },
    ],
  },
  'sip-water': {
    id: 704,
    title: 'Sip Water Slowly',
    frequency: 'daily',
    description: 'Hydrate mindfully with slow sips of water',
    xpReward: 30,
    totalSteps: 2,
    icon: Droplets,
    color: 'chart-1',
    details: 'Mindful hydration helps you stay properly hydrated while being gentle on your stomach. Taking small, slow sips is often better than drinking large amounts quickly.',
    benefits: [
      { icon: Droplets, text: 'Gentle hydration' },
      { icon: Heart, text: 'Easy on stomach' },
      { icon: Brain, text: 'Mindful practice' },
      { icon: Leaf, text: 'Calming ritual' },
    ],
    initialSteps: Array.from({ length: 2 }, (_, i) => ({ id: i + 1, completed: false })),
    alternativeMissions: [],
    communityTip: 'Take small sips and focus on the sensation of the water.',
    stepLabel: 'Sip'
  }
};

export default function MissionDetails() {
  const { t } = useTranslation('pages');
  const { t: tDashboard } = useTranslation('dashboard');
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const urlMissionId = params.get('id');
  
  // Get global weather simulation state
  const { simulateBadWeather } = useWeatherSimulation();
  
  const { missions, activeMissions, inactiveMissions, updateMissionProgress, activateMission, deactivateMission } = useMissions();

  // Check if user has a low mood check-in today for alternative missions
  // Always refetch on mount to ensure fresh mood data
  const { data: latestCheckin, refetch: refetchMood } = useQuery<{ emotion: string; checkedInAt: string } | null>({
    queryKey: ['/api/emotional-checkins/latest'],
    staleTime: 0,
    refetchOnMount: 'always',
  });
  
  const hasLowMoodToday = useMemo(() => {
    if (!latestCheckin) return false;
    const checkinDate = new Date(latestCheckin.checkedInAt).toDateString();
    const today = new Date().toDateString();
    return checkinDate === today && isLowMoodEmotion(latestCheckin.emotion);
  }, [latestCheckin]);

  // Check weather for bad weather alternatives - always refetch on mount
  const { isBadWeather: actualBadWeather, assessment: weatherAssessment, refetch: refetchWeather } = useWeatherAssessment();
  
  // Ensure mood and weather are refreshed when entering mission details
  useEffect(() => {
    refetchMood();
    refetchWeather();
  }, [urlMissionId]);
  const isBadWeather = simulateBadWeather || actualBadWeather;

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
      <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/50 dark:border-white/10 shadow-lg shadow-[#013DC4]/5 safe-area-top">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
            <BackButton 
              href="/my-dashboard" 
              className="hover:bg-[#013DC4]/10"
              iconClassName="text-[#013DC4]"
              data-testid="button-back" 
            />
            <h1 className="text-xl font-black text-gray-900 dark:text-white">{tDashboard('missions.allMissions')}</h1>
          </div>
        </header>
        
        <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Active Missions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#013DC4]" />
              {tDashboard('missions.activeMissions')} ({activeMissions.length})
            </h2>
            {activeMissions.length === 0 ? (
              <GlassCard className="p-6 text-center border-dashed border-2 border-[#013DC4]/20">
                <p className="text-gray-500">{tDashboard('missions.noActive')}</p>
              </GlassCard>
            ) : (
              <div className="space-y-3">
                {activeMissions.map((mission) => (
                  <GlassCard key={mission.id} className="p-4 hover:shadow-xl transition-all" glow>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">{mission.title}</h3>
                          <Badge variant="default" className="bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white text-xs border-0">
                            {tDashboard('missions.active')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">{mission.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-2 flex-1 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner">
                            <div className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all" style={{ width: `${(mission.progress / mission.maxProgress) * 100}%` }} />
                          </div>
                          <span className="text-xs text-gray-500">{mission.progress}/{mission.maxProgress}</span>
                          <span className="text-xs font-bold text-[#013DC4]">+{mission.xpReward} XP</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Link href={`/mission-details?id=${mission.missionKey}`}>
                          <Button variant="ghost" size="sm" className="rounded-xl hover:bg-[#013DC4]/10">
                            <ChevronRight className="w-4 h-4 text-[#013DC4]" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deactivateMission(mission.id)}
                          className="text-gray-500 border-gray-200 dark:border-gray-700 rounded-xl"
                        >
                          {tDashboard('missions.deactivateMission')}
                        </Button>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}
          </div>

          {/* Available Missions */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-gray-400" />
              {tDashboard('missions.availableMissions')} ({inactiveMissions.length})
            </h2>
            {inactiveMissions.length > 0 && (
              <div className="space-y-3">
                {inactiveMissions.map((mission) => (
                  <Link key={mission.id} href={`/mission-details?id=${mission.missionKey}`}>
                    <GlassCard className="p-4 opacity-70 hover:opacity-100 transition-all cursor-pointer hover:shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 dark:text-white">{mission.title}</h3>
                            <Badge variant="secondary" className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {tDashboard('missions.inactive')}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{mission.description}</p>
                          <span className="text-xs font-bold text-[#013DC4] mt-2 block">+{mission.xpReward} XP</span>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button 
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              activateMission(mission.id);
                            }}
                            className="bg-gradient-to-r from-[#013DC4] to-[#0150FF] text-white rounded-xl"
                          >
                            {tDashboard('missions.activateMission')}
                          </Button>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </GlassCard>
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
    <div className="min-h-screen bg-gradient-to-br from-[#F0F4FF] via-[#E8EEFF] to-[#F5F0FF] dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-[#013DC4]/20 backdrop-blur-sm rounded-full p-8">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Sparkles className="w-16 h-16 text-[#013DC4]" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/50 dark:border-white/10 shadow-lg shadow-[#013DC4]/5 safe-area-top">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <BackButton 
            href="/my-dashboard" 
            className="hover:bg-[#013DC4]/10"
            iconClassName="text-[#013DC4]"
            data-testid="button-back" 
          />
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{t('missionDetails.title')}</h1>
        </div>
      </header>
      
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlassCard className="p-6" glow>
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${colors.iconBg}`}>
                  <MissionIcon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-1" data-testid="mission-title">
                    {missionData.title}
                  </h2>
                  <Badge className={colors.badge} data-testid="mission-frequency">
                    {missionData.frequency}
                  </Badge>
                  <p className="text-sm sm:text-base text-gray-500 mt-2" data-testid="mission-description">
                    {missionData.description}
                  </p>
                </div>
              </div>
              
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-500 uppercase">{t('missionDetails.progress')}</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white" data-testid="mission-progress-text">
                  {completedCount} of {missionData.totalSteps}
                </span>
              </div>
              
              <div className="relative">
                <div className="h-4 bg-white/50 dark:bg-gray-800/50 rounded-full overflow-hidden shadow-inner" data-testid="mission-progress-bar">
                  <div 
                    className="h-full bg-gradient-to-r from-[#013DC4] via-[#0150FF] to-[#CDB6EF] rounded-full transition-all shadow-lg" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
                <div 
                  className="absolute top-1/2 -translate-y-1/2 transition-all duration-500"
                  style={{ left: `calc(${progressPercent}% - 12px)` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white border-2 border-[#013DC4] flex items-center justify-center shadow-lg">
                    <Target className="w-3 h-3 text-[#013DC4]" />
                  </div>
                </div>
              </div>
              
              <div className="relative w-full h-8 sm:h-9">
                {steps.map((step, index) => {
                  const position = missionData.totalSteps === 1 
                    ? 50 
                    : ((index + 0.5) / missionData.totalSteps) * 100;
                  return (
                    <motion.div
                      key={step.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`absolute top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                        step.completed
                          ? colors.stepComplete
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-2 border-dashed border-[#013DC4]/20'
                      }`}
                      style={{ left: `calc(${position}% - 0.875rem)` }}
                      data-testid={`step-indicator-${index}`}
                    >
                      {step.completed ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : index + 1}
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#013DC4] fill-[#013DC4]" />
                  <span className="font-black text-[#013DC4] text-sm sm:text-base" data-testid="mission-xp">
                    +{missionData.xpReward} XP each
                  </span>
                </div>
                
                <Button
                  size="lg"
                  className={`w-full sm:w-auto font-black ${isComplete ? '' : 'animate-pulse-glow'}`}
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
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">
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
          </GlassCard>
        </motion.div>
        
        <Tabs defaultValue="main" className="w-full">
          <TabsList className={`grid w-full bg-gray-100 dark:bg-gray-800 ${
            ((hasLowMoodToday && missionData.alternativeMissions.length > 0) || 
             (isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length))
              ? 'grid-cols-2' 
              : 'grid-cols-1'
          }`}>
            <TabsTrigger value="main" className="font-bold" data-testid="tab-main-mission">
              {t('missionDetails.tabs.mainMission')}
            </TabsTrigger>
            {((hasLowMoodToday && missionData.alternativeMissions.length > 0) || 
              (isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length)) && (
              <TabsTrigger value="alternatives" className="font-bold" data-testid="tab-alternatives">
                {t('missionDetails.tabs.alternatives')}
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="main" className="mt-4 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <GlassCard className="p-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-3">{t('missionDetails.missionDetails')}</h3>
                <p className="text-gray-500 leading-relaxed" data-testid="mission-details-text">
                  {missionData.details}
                </p>
              </GlassCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard className="p-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">{t('missionDetails.benefits')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {missionData.benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-center gap-3 p-3 bg-gradient-to-r from-[#013DC4]/10 to-transparent rounded-xl"
                      data-testid={`benefit-${index}`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#013DC4]/20 to-[#013DC4]/10 flex items-center justify-center">
                        <benefit.icon className="w-5 h-5 text-[#013DC4]" />
                      </div>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard className="p-5">
                <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">{t('missionDetails.todaysLog')}</h3>
                <div className="space-y-2">
                  {steps.filter(s => s.completed).map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${missionData.color === 'chart-2' ? 'bg-[#CDB6EF]/10' : 'bg-[#013DC4]/5'}`}
                      data-testid={`log-entry-${index}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.stepComplete}`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 dark:text-white">{missionData.stepLabel} #{step.id}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{step.time}</span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {steps.filter(s => !s.completed).length > 0 && (
                    <div className="flex items-center gap-3 p-3 border-2 border-dashed border-[#013DC4]/20 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Target className="w-4 h-4 text-gray-500" />
                      </div>
                      <span className="text-gray-500">
                        {t('missionDetails.remaining', { count: steps.filter(s => !s.completed).length })}
                      </span>
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GlassCard className="p-5 bg-gradient-to-r from-[#013DC4]/10 to-[#CDB6EF]/10">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#013DC4] to-[#0150FF] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#013DC4]/30">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white mb-1">{tDashboard('community.communityTip')}</h4>
                    <p className="text-sm text-gray-500" data-testid="community-tip">
                      {missionData.communityTip}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </TabsContent>
          
          {((hasLowMoodToday && missionData.alternativeMissions.length > 0) || 
            (isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length)) && (
            <TabsContent value="alternatives" className="mt-4 space-y-3">
              {/* Mood banner - show when user has low mood today */}
              {hasLowMoodToday && missionData.alternativeMissions.length > 0 && (
                <GlassCard className="p-4 bg-gradient-to-r from-[#CDB6EF]/10 to-[#4B7BE5]/10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#CDB6EF] to-[#4B7BE5] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#CDB6EF]/30">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white mb-1">{t('missionDetails.moodBanner.title')}</h4>
                      <p className="text-sm text-gray-500">
                        {t('missionDetails.moodBanner.description')}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}
              
              {/* Weather banner - show when weather is bad for outdoor activities */}
              {isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.length && (
                <GlassCard className="p-4 bg-gradient-to-r from-[#0150FF]/10 to-[#4B7BE5]/10">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0150FF] to-[#4B7BE5] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#0150FF]/30">
                      <Wind className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 dark:text-white mb-1">{t('missionDetails.weatherBanner.title')}</h4>
                      <p className="text-sm text-gray-500">
                        {t('missionDetails.weatherBanner.description')}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              )}
              
              {/* Mood-based alternatives */}
              {hasLowMoodToday && missionData.alternativeMissions.map((alt, index) => (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={`/alternative-mission?id=${alt.id}&original=${urlMissionId}`}>
                    <GlassCard 
                      className="p-4 hover-elevate cursor-pointer transition-all"
                      data-testid={`alternative-mission-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#CDB6EF]/20 to-[#4B7BE5]/20 flex items-center justify-center text-2xl">
                          {alt.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">{alt.title}</h4>
                          <div className="flex items-center gap-1 text-[#013DC4]">
                            <Zap className="w-4 h-4 fill-[#013DC4]" />
                            <span className="text-sm font-bold">+{alt.xp} XP</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
              
              {/* Weather-based alternatives */}
              {isBadWeather && missionData.isWeatherDependent && missionData.badWeatherAlternatives?.map((alt, index) => (
                <motion.div
                  key={alt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (missionData.alternativeMissions.length + index) * 0.1 }}
                >
                  <Link href={`/alternative-mission?id=${alt.id}&original=${urlMissionId}&type=weather`}>
                    <GlassCard 
                      className="p-4 hover-elevate cursor-pointer transition-all"
                      data-testid={`weather-alternative-mission-${index}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0150FF]/20 to-[#4B7BE5]/20 flex items-center justify-center text-2xl">
                          {alt.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 dark:text-white">{alt.title}</h4>
                          <div className="flex items-center gap-1 text-[#013DC4]">
                            <Zap className="w-4 h-4 fill-[#013DC4]" />
                            <span className="text-sm font-bold">+{alt.xp} XP</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
              
              <GlassCard className="p-4 border-dashed border-2 border-[#013DC4]/20">
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">
                    {t('missionDetails.alternativesHint')}
                  </p>
                </div>
              </GlassCard>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
