/**
 * Emotional State Bank
 * Central source of truth for all recognized emotional states
 * Used for emotional check-ins and AI-driven mission suggestions
 */

export type EmotionCategory = 
  | 'happy'
  | 'sad'
  | 'anxious'
  | 'stressed'
  | 'calm'
  | 'peaceful'
  | 'tired'
  | 'energetic'
  | 'hyper'
  | 'frustrated'
  | 'angry'
  | 'grateful'
  | 'hopeful'
  | 'lonely'
  | 'confused'
  | 'sick'
  | 'overwhelmed'
  | 'motivated'
  | 'bored'
  | 'neutral';

export interface EmotionDefinition {
  key: EmotionCategory;
  emoji: string;
  keywords: string[];
  suggestedMissionTypes: string[];
}

export const EMOTION_BANK: EmotionDefinition[] = [
  {
    key: 'happy',
    emoji: '😊',
    keywords: ['happy', 'great', 'wonderful', 'amazing', 'joyful', 'excited', 'good', 'fantastic', 'awesome', 'excellent', 'thrilled', 'delighted', 'cheerful', 'pleased', 'content', 'elated', 'overjoyed'],
    suggestedMissionTypes: ['walking', 'jumping-jacks'],
  },
  {
    key: 'sad',
    emoji: '😢',
    keywords: ['sad', 'down', 'depressed', 'unhappy', 'blue', 'low', 'miserable', 'gloomy', 'heartbroken', 'disappointed', 'melancholy', 'dejected', 'sorrowful'],
    suggestedMissionTypes: ['walking', 'meditation'],
  },
  {
    key: 'anxious',
    emoji: '😰',
    keywords: ['anxious', 'worried', 'nervous', 'panicked', 'uneasy', 'tense', 'apprehensive', 'fearful', 'jittery', 'on edge', 'restless'],
    suggestedMissionTypes: ['deep-breathing', 'meditation'],
  },
  {
    key: 'stressed',
    emoji: '😫',
    keywords: ['stressed', 'pressure', 'overwhelmed', 'burnt out', 'exhausted', 'frazzled', 'swamped', 'strained', 'under pressure'],
    suggestedMissionTypes: ['deep-breathing', 'meditation', 'walking'],
  },
  {
    key: 'calm',
    emoji: '😌',
    keywords: ['calm', 'relaxed', 'serene', 'tranquil', 'at ease', 'chill', 'mellow', 'composed', 'collected'],
    suggestedMissionTypes: ['meditation', 'water-glasses'],
  },
  {
    key: 'peaceful',
    emoji: '🕊️',
    keywords: ['peaceful', 'at peace', 'harmonious', 'balanced', 'centered', 'grounded', 'still', 'quiet minded'],
    suggestedMissionTypes: ['meditation', 'water-glasses'],
  },
  {
    key: 'tired',
    emoji: '😴',
    keywords: ['tired', 'exhausted', 'fatigued', 'sleepy', 'drained', 'worn out', 'weary', 'lethargic', 'sluggish', 'beat', 'run down'],
    suggestedMissionTypes: ['water-glasses', 'deep-breathing'],
  },
  {
    key: 'energetic',
    emoji: '⚡',
    keywords: ['energetic', 'energized', 'pumped', 'active', 'motivated', 'alive', 'vibrant', 'dynamic', 'lively', 'spirited'],
    suggestedMissionTypes: ['jumping-jacks', 'walking'],
  },
  {
    key: 'hyper',
    emoji: '🚀',
    keywords: ['hyper', 'hyperactive', 'wired', 'buzzing', 'restless', 'fidgety', 'keyed up', 'amped', 'overstimulated'],
    suggestedMissionTypes: ['jumping-jacks', 'walking'],
  },
  {
    key: 'frustrated',
    emoji: '😤',
    keywords: ['frustrated', 'annoyed', 'irritated', 'upset', 'aggravated', 'exasperated', 'fed up', 'bothered'],
    suggestedMissionTypes: ['deep-breathing', 'walking', 'jumping-jacks'],
  },
  {
    key: 'angry',
    emoji: '😡',
    keywords: ['angry', 'mad', 'furious', 'enraged', 'livid', 'outraged', 'irate', 'fuming', 'seething'],
    suggestedMissionTypes: ['deep-breathing', 'walking', 'jumping-jacks'],
  },
  {
    key: 'grateful',
    emoji: '🙏',
    keywords: ['grateful', 'thankful', 'appreciative', 'blessed', 'fortunate', 'appreciating'],
    suggestedMissionTypes: ['meditation', 'walking'],
  },
  {
    key: 'hopeful',
    emoji: '🌟',
    keywords: ['hopeful', 'optimistic', 'positive', 'confident', 'encouraged', 'upbeat', 'expectant', 'looking forward'],
    suggestedMissionTypes: ['walking', 'jumping-jacks'],
  },
  {
    key: 'lonely',
    emoji: '🥺',
    keywords: ['lonely', 'alone', 'isolated', 'disconnected', 'solitary', 'abandoned', 'left out'],
    suggestedMissionTypes: ['walking', 'meditation'],
  },
  {
    key: 'confused',
    emoji: '🤔',
    keywords: ['confused', 'lost', 'uncertain', 'unsure', 'puzzled', 'bewildered', 'perplexed', 'unclear'],
    suggestedMissionTypes: ['meditation', 'deep-breathing'],
  },
  {
    key: 'sick',
    emoji: '🤒',
    keywords: ['sick', 'ill', 'unwell', 'nauseous', 'under the weather', 'not feeling well', 'queasy', 'feverish', 'achy', 'poorly'],
    suggestedMissionTypes: ['water-glasses', 'deep-breathing'],
  },
  {
    key: 'overwhelmed',
    emoji: '😵',
    keywords: ['overwhelmed', 'overloaded', 'snowed under', 'buried', 'drowning', 'too much', 'cant cope', 'in over my head'],
    suggestedMissionTypes: ['deep-breathing', 'meditation'],
  },
  {
    key: 'motivated',
    emoji: '💪',
    keywords: ['motivated', 'driven', 'determined', 'inspired', 'eager', 'ready', 'focused', 'ambitious', 'fired up'],
    suggestedMissionTypes: ['jumping-jacks', 'walking'],
  },
  {
    key: 'bored',
    emoji: '😑',
    keywords: ['bored', 'boring', 'uninterested', 'unstimulated', 'dull', 'listless', 'apathetic', 'disengaged'],
    suggestedMissionTypes: ['jumping-jacks', 'walking'],
  },
  {
    key: 'neutral',
    emoji: '😐',
    keywords: ['okay', 'fine', 'alright', 'so-so', 'meh', 'normal', 'average', 'neither good nor bad', 'nothing special'],
    suggestedMissionTypes: ['water-glasses', 'walking'],
  },
];

export const SUPPORTIVE_MESSAGES: Record<EmotionCategory, string[]> = {
  happy: [
    "That's wonderful to hear! Keep embracing that positive energy. Remember, joy is contagious - spread it around!",
    "I'm so glad you're feeling good! Happiness boosts your immune system and overall health.",
  ],
  sad: [
    "I'm sorry you're feeling down. Remember, it's okay to feel this way. Take it one moment at a time, and be gentle with yourself.",
    "Sadness is part of being human. Consider reaching out to someone you trust, or try a brief walk outside.",
  ],
  anxious: [
    "Anxiety can be tough, but you're not alone. Try taking some slow, deep breaths. You've got through difficult moments before.",
    "When anxiety hits, grounding exercises can help. Focus on 5 things you can see, 4 you can touch, 3 you can hear.",
  ],
  stressed: [
    "Stress can feel overwhelming, but remember to take breaks. Even 5 minutes of quiet can help reset your mind.",
    "You're dealing with a lot right now. Consider breaking tasks into smaller steps, and celebrate small wins.",
  ],
  calm: [
    "It's great that you're feeling at peace. This calm state is so valuable for your health and wellbeing.",
    "Enjoy this peaceful moment. Calm times help your body recover and recharge.",
  ],
  peaceful: [
    "What a beautiful state to be in. Peace of mind is one of the greatest gifts you can give yourself.",
    "Cherish this peaceful feeling. It shows you're in tune with yourself and your needs.",
  ],
  tired: [
    "Rest is so important for your health. Listen to your body - if you can, try to get some extra sleep tonight.",
    "Feeling tired is your body's way of asking for rest. Be kind to yourself and prioritize recovery.",
  ],
  energetic: [
    "That energy is fantastic! Channel it into something you enjoy - maybe a walk, a workout, or a creative project!",
    "Ride that wave of energy! Active moments like these are great for both your body and mind.",
  ],
  hyper: [
    "Lots of energy today! Try channeling it into physical activity - it can help you feel more balanced.",
    "When you're feeling hyper, movement can help. A quick workout or walk might help you feel centered.",
  ],
  frustrated: [
    "Frustration is valid. Taking a step back can help. Try to identify what's bothering you most.",
    "It's okay to feel frustrated. Consider writing down what's on your mind - it can help process these feelings.",
  ],
  angry: [
    "Anger is a natural emotion. Take some deep breaths and give yourself space before reacting.",
    "When anger rises, physical activity can help release that energy safely. Even a short walk helps.",
  ],
  grateful: [
    "Gratitude is powerful! It's amazing how acknowledging the good things can lift your whole day.",
    "That thankful feeling is wonderful for your mental health. Keep noticing those positive moments!",
  ],
  hopeful: [
    "Hope is a beautiful thing. That optimistic outlook can really help carry you through challenges.",
    "Your positive outlook is inspiring! Keep that hopeful energy going.",
  ],
  lonely: [
    "Loneliness can be hard. Remember, reaching out - even a small message to someone - can help bridge that gap.",
    "You matter, and you're not as alone as you might feel. Consider connecting with someone today, even briefly.",
  ],
  confused: [
    "It's okay to not have all the answers. Sometimes clarity comes with time and rest.",
    "Feeling uncertain is normal. Try writing down your thoughts - it can help sort things out.",
  ],
  sick: [
    "I'm sorry you're not feeling well. Rest and hydration are your best friends right now. Take it easy.",
    "Being sick is no fun. Focus on what your body needs - rest, fluids, and gentle care.",
  ],
  overwhelmed: [
    "When everything feels like too much, start with just one small thing. You don't have to solve everything at once.",
    "Feeling overwhelmed is a sign you need support. Break things down into tiny steps, and ask for help if you can.",
  ],
  motivated: [
    "That motivation is powerful! This is a great time to tackle something you've been putting off.",
    "Harness that drive! Motivated moments are perfect for making progress on your goals.",
  ],
  bored: [
    "Boredom can actually be a doorway to creativity. What's something new you could try today?",
    "Feeling bored? This might be the perfect time for a spontaneous activity or learning something new.",
  ],
  neutral: [
    "Sometimes 'okay' is perfectly fine. Not every day needs to be extraordinary.",
    "Feeling neutral is valid. Take this steady moment to check in with what you need today.",
  ],
};

export function getEmotionByKey(key: string): EmotionDefinition | undefined {
  return EMOTION_BANK.find(e => e.key === key);
}

export function detectEmotionFromText(text: string): EmotionCategory | null {
  const lowerText = text.toLowerCase().trim();
  
  // First, check if the input exactly matches an emotion name (e.g., user types just "neutral" or "happy")
  const allEmotionKeys = EMOTION_BANK.map(e => e.key);
  if (allEmotionKeys.includes(lowerText as EmotionCategory)) {
    return lowerText as EmotionCategory;
  }
  
  // Check for emotion name as standalone word in the text (e.g., "I feel neutral" or "feeling happy today")
  for (const emotionKey of allEmotionKeys) {
    const emotionRegex = new RegExp(`\\b${emotionKey}\\b`, 'i');
    if (emotionRegex.test(lowerText)) {
      return emotionKey;
    }
  }
  
  // Then check keywords for each emotion
  for (const emotion of EMOTION_BANK) {
    for (const keyword of emotion.keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
      if (regex.test(lowerText)) {
        return emotion.key;
      }
    }
  }
  
  return null;
}

export function getRandomSupportiveMessage(emotion: EmotionCategory): string {
  const messages = SUPPORTIVE_MESSAGES[emotion] || SUPPORTIVE_MESSAGES.neutral;
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getEmotionEmoji(emotion: EmotionCategory): string {
  const emotionDef = getEmotionByKey(emotion);
  return emotionDef?.emoji || '😐';
}

export function getSuggestedMissionTypes(emotion: EmotionCategory): string[] {
  const emotionDef = getEmotionByKey(emotion);
  return emotionDef?.suggestedMissionTypes || ['water-glasses'];
}

/**
 * Emotions that should trigger alternative (easier) missions
 * These are low-energy or difficult emotional states where users need gentler options
 */
export const LOW_MOOD_EMOTIONS: EmotionCategory[] = [
  'sick',
  'stressed', 
  'anxious',
  'tired',
  'sad',
  'overwhelmed',
  'frustrated',
  'angry',
  'lonely',
];

/**
 * Check if an emotion qualifies as "low mood" for alternative mission suggestions
 */
export function isLowMoodEmotion(emotion: EmotionCategory | string | null): boolean {
  if (!emotion) return false;
  return LOW_MOOD_EMOTIONS.includes(emotion as EmotionCategory);
}
