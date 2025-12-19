import { useState } from 'react';
import { Link } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp, Beaker, Lightbulb, Brain, GraduationCap, BookOpen, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MascotCharacter from './MascotCharacter';
import MedicalTerm from './MedicalTerm';

interface RiskScoreCardProps {
  score: number;
  trend?: 'up' | 'down' | 'stable';
  message?: string;
  className?: string;
}

export default function RiskScoreCard({ score, trend = 'stable', message, className = '' }: RiskScoreCardProps) {
  const { t } = useTranslation('dashboard');
  const [showScience, setShowScience] = useState(false);
  
  const getScoreColor = () => {
    if (score >= 80) return 'from-primary to-chart-4';
    if (score >= 60) return 'from-chart-3 to-primary';
    if (score >= 40) return 'from-chart-3 to-destructive';
    return 'from-destructive to-chart-5';
  };
  
  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent!';
    if (score >= 60) return 'Good Progress';
    if (score >= 40) return 'Keep Going';
    return 'Needs Attention';
  };
  
  return (
    <Card className={`relative overflow-hidden ${className}`} data-testid="risk-score-card">
      <div className={`absolute inset-0 bg-gradient-to-br ${getScoreColor()} opacity-5`} />
      
      <div className="relative p-4 lg:p-8">
        <Link href="/risk-score" className="block cursor-pointer group">
          <div className="flex items-start justify-between mb-4 lg:mb-6">
            <div>
              <h3 className="text-base lg:text-lg font-bold text-muted-foreground mb-1 flex items-center gap-2">
                <MedicalTerm
                  term="Risk Score"
                  explanation="A calculated health assessment based on various factors like lifestyle, vital signs, and medical history to predict potential health risks."
                  simpleExplanation="A number that shows your overall health status. Higher scores mean better health!"
                  category="metric"
                />
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </h3>
              <div className="flex items-center gap-2">
                {trend === 'up' && <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-primary" data-testid="trend-up" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5 text-destructive" data-testid="trend-down" />}
                <span className="text-xs lg:text-sm font-semibold text-muted-foreground">{getScoreLabel()}</span>
              </div>
            </div>
            
            <MascotCharacter 
              size="sm" 
              pose={score >= 70 ? 'celebrate' : score >= 40 ? 'encourage' : 'concerned'}
            />
          </div>
          
          <div className="flex items-center justify-center mb-4 lg:mb-6">
            <div className="relative w-32 h-32 lg:w-48 lg:h-48">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/40"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 283} 283`}
                className="transition-all duration-1000 ease-out"
                data-testid="score-circle"
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={score >= 80 ? 'hsl(210, 100%, 50%)' : score >= 60 ? 'hsl(35, 100%, 55%)' : 'hsl(0, 85%, 60%)'} />
                  <stop offset="50%" stopColor="hsl(260, 70%, 60%)" />
                  <stop offset="100%" stopColor="hsl(260, 70%, 60%)" />
                </linearGradient>
              </defs>
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl lg:text-6xl font-black text-foreground" data-testid="score-number">{Math.round(score)}</span>
              <span className="text-lg lg:text-2xl font-bold text-muted-foreground">/100</span>
            </div>
          </div>
        </div>
        </Link>
        
        {message && (
          <p className="text-center text-xs lg:text-sm text-muted-foreground mb-4" data-testid="score-message">
            {message}
          </p>
        )}
        
        <div className="space-y-3">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-3 border border-primary/10">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-chart-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-chart-3 uppercase mb-1">Why this matters</p>
                <p className="text-xs lg:text-sm text-foreground leading-relaxed">
                  Your risk score combines multiple factors to give you one easy number to track. 
                  Improving any single factor can boost your overall score!
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-chart-2/5 to-chart-4/5 rounded-lg p-3 border border-chart-2/10">
            <div className="flex items-start gap-2">
              <Brain className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-chart-2 uppercase mb-1">{t('community.communityTip')}</p>
                <p className="text-xs lg:text-sm text-foreground leading-relaxed italic">
                  "Focus on small, consistent improvements. Even adding a 10-minute walk can improve your score over time."
                </p>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScience(!showScience)}
            className="w-full justify-between bg-gradient-to-r from-primary/5 to-chart-1/5 hover:from-primary/10 hover:to-chart-1/10 border-primary/20"
            data-testid="button-learn-science"
          >
            <span className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span className="font-bold text-primary text-xs lg:text-sm">Learn the Science</span>
            </span>
            {showScience ? (
              <ChevronUp className="w-4 h-4 text-primary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-primary" />
            )}
          </Button>
          
          <AnimatePresence>
            {showScience && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="p-4 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Beaker className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-foreground text-sm lg:text-base">The Science Behind Risk Scores</h4>
                  </div>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">1</span>
                      </div>
                      <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                        <strong>Multi-factor Analysis:</strong> Your score integrates data from vital signs, lifestyle factors, and health history using validated clinical algorithms.
                      </p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">2</span>
                      </div>
                      <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                        <strong>Risk Stratification:</strong> Based on the Framingham Risk Score methodology, which has been validated in multiple large-scale population studies.
                      </p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">3</span>
                      </div>
                      <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                        <strong>Lifestyle Impact:</strong> Research shows that lifestyle modifications can reduce cardiovascular risk by 30-50% in high-risk individuals.
                      </p>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-white">4</span>
                      </div>
                      <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">
                        <strong>Continuous Monitoring:</strong> Regular tracking helps identify trends early, enabling proactive health management before issues become serious.
                      </p>
                    </li>
                  </ul>
                  
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="flex items-center gap-1 mb-2">
                      <BookOpen className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground">Sources</span>
                    </div>
                    <ul className="space-y-1">
                      <li className="text-xs">
                        <a 
                          href="https://www.framinghamheartstudy.org/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Framingham Heart Study
                        </a>
                      </li>
                      <li className="text-xs">
                        <a 
                          href="https://www.heart.org/en/health-topics/consumer-healthcare/what-is-cardiovascular-disease" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          American Heart Association Guidelines
                        </a>
                      </li>
                      <li className="text-xs">
                        <a 
                          href="https://www.who.int/news-room/fact-sheets/detail/cardiovascular-diseases-(cvds)" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          WHO Cardiovascular Risk Assessment
                        </a>
                      </li>
                    </ul>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Card>
  );
}
