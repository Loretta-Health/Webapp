import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BackButton } from '@/components/BackButton';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { 
  ChevronRight, 
  ChevronLeft,
  Check,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { trackQuestionnaire, trackPageView } from '@/lib/clarity';

interface Question {
  id: number;
  text: string;
  type: 'yesno' | 'choice' | 'scale';
  options?: string[];
}

const questions: Question[] = [
  {
    id: 1,
    text: "Have you had your blood tested in the past three years?",
    type: 'yesno',
  },
  {
    id: 2,
    text: "Do you currently take any prescription medications?",
    type: 'yesno',
  },
  {
    id: 3,
    text: "How would you rate your current physical activity level?",
    type: 'choice',
    options: ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active'],
  },
  {
    id: 4,
    text: "Do you have any chronic health conditions?",
    type: 'yesno',
  },
  {
    id: 5,
    text: "How many hours of sleep do you typically get per night?",
    type: 'choice',
    options: ['Less than 5', '5-6 hours', '7-8 hours', 'More than 8'],
  },
  {
    id: 6,
    text: "Do you smoke or use tobacco products?",
    type: 'yesno',
  },
  {
    id: 7,
    text: "How often do you consume alcohol?",
    type: 'choice',
    options: ['Never', 'Occasionally', '1-2 times per week', 'Daily'],
  },
  {
    id: 8,
    text: "Have you experienced any concerning symptoms recently?",
    type: 'yesno',
  },
];

export default function Questionnaire() {
  useSwipeBack({ backPath: '/profile' });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [completed, setCompleted] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    trackPageView('questionnaire');
    trackQuestionnaire('started');
  }, []);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  const handleAnswer = (answer: string) => {
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
    trackQuestionnaire('step_completed', currentQuestion + 1, questions.length);
    
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(prev => prev + 1), 300);
    } else {
      trackQuestionnaire('completed');
      setCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    setLocation('/profile');
  };

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md"
        >
          <Card className="p-8 text-center border-0 shadow-xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            
            
            <h1 className="text-2xl font-black text-foreground mb-2">Questionnaire Complete!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for completing the health questionnaire. Your responses will help us personalize your health journey.
            </p>
            
            <div className="bg-gradient-to-r from-primary/10 to-chart-2/10 rounded-lg p-4 mb-6">
              <p className="text-sm font-bold text-foreground">+100 XP Earned!</p>
              <p className="text-xs text-muted-foreground">For completing the questionnaire</p>
            </div>
            
            <Button 
              className="w-full bg-gradient-to-r from-primary to-chart-2"
              onClick={handleFinish}
              data-testid="button-finish-questionnaire"
            >
              View Your Profile
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-4 safe-area-top">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <BackButton 
            href="/profile" 
            className="text-white" 
            iconClassName="text-white"
            data-testid="button-back" 
          />
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-white" />
            <h1 className="text-lg font-black text-white">Onboarding Questionnaire</h1>
          </div>
          <div className="w-16" />
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-muted-foreground" data-testid="text-question-progress">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-bold text-primary" data-testid="text-progress-percent">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-3" data-testid="progress-bar" />
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 border-0 shadow-xl">
                
                <h2 className="text-xl font-black text-foreground text-center mb-8" data-testid="text-question">
                  {question.text}
                </h2>

                {question.type === 'yesno' && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <Button
                      variant="outline"
                      className={`py-6 sm:py-8 text-base sm:text-lg font-bold hover-elevate ${
                        answers[question.id] === 'Yes' 
                          ? 'bg-primary text-white border-primary' 
                          : ''
                      }`}
                      onClick={() => handleAnswer('Yes')}
                      data-testid="button-answer-yes"
                    >
                      Yes
                    </Button>
                    <Button
                      variant="outline"
                      className={`py-6 sm:py-8 text-base sm:text-lg font-bold hover-elevate ${
                        answers[question.id] === 'No' 
                          ? 'bg-primary text-white border-primary' 
                          : ''
                      }`}
                      onClick={() => handleAnswer('No')}
                      data-testid="button-answer-no"
                    >
                      No
                    </Button>
                  </div>
                )}

                {question.type === 'choice' && question.options && (
                  <div className="space-y-3">
                    {question.options.map((option, index) => (
                      <Button
                        key={option}
                        variant="outline"
                        className={`w-full py-6 text-left justify-start font-bold hover-elevate ${
                          answers[question.id] === option 
                            ? 'bg-primary text-white border-primary' 
                            : ''
                        }`}
                        onClick={() => handleAnswer(option)}
                        data-testid={`button-answer-${index}`}
                      >
                        <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-3 text-sm">
                          {String.fromCharCode(65 + index)}
                        </span>
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="ghost"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              data-testid="button-previous"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground self-center">
              {Object.keys(answers).length} answered
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
