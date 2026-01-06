import { Link, Redirect } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Heart,
  Dumbbell,
  Pill,
  Wine,
  Info,
  Sparkles,
  Loader2,
  Scale,
  Calendar,
  Droplets,
  HeartPulse,
  Brain,
  Moon,
  Smile,
  User,
  Armchair,
  Footprints,
  MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

interface RiskScoreData {
  overallScore: number;
}

interface RiskScoreHistoryEntry {
  id: string;
  overallScore: number;
  calculatedAt: string;
}

interface RiskFactorData {
  id: string;
  name: string;
  description: string;
  category: string;
  points: number;
  maxPoints: number;
  type: 'negative' | 'warning' | 'positive';
  icon: string;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    'scale': <Scale className="w-4 h-4" />,
    'trending-up': <TrendingUp className="w-4 h-4" />,
    'trending-down': <TrendingDown className="w-4 h-4" />,
    'calendar': <Calendar className="w-4 h-4" />,
    'droplets': <Droplets className="w-4 h-4" />,
    'heart-pulse': <HeartPulse className="w-4 h-4" />,
    'activity': <Activity className="w-4 h-4" />,
    'heart': <Heart className="w-4 h-4" />,
    'heart-crack': <Heart className="w-4 h-4" />,
    'heart-off': <Heart className="w-4 h-4" />,
    'brain': <Brain className="w-4 h-4" />,
    'kidney': <Droplets className="w-4 h-4" />,
    'dumbbell': <Dumbbell className="w-4 h-4" />,
    'armchair': <Armchair className="w-4 h-4" />,
    'moon': <Moon className="w-4 h-4" />,
    'wine': <Wine className="w-4 h-4" />,
    'footprints': <Footprints className="w-4 h-4" />,
    'smile': <Smile className="w-4 h-4" />,
    'user': <User className="w-4 h-4" />,
    'pill': <Pill className="w-4 h-4" />,
  };
  return iconMap[iconName] || <Activity className="w-4 h-4" />;
};

export default function RiskScoreDetails() {
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: riskScoreData, isLoading: isScoreLoading } = useQuery<RiskScoreData>({
    queryKey: ['/api/risk-scores/latest'],
    enabled: !!user,
  });

  const { data: riskScoreHistory } = useQuery<RiskScoreHistoryEntry[]>({
    queryKey: ['/api/risk-scores'],
    enabled: !!user,
  });

  const { data: riskFactorsData, isLoading: isFactorsLoading } = useQuery<RiskFactorData[]>({
    queryKey: ['/api/risk-factors'],
    enabled: !!user,
  });

  if (isAuthLoading || isScoreLoading || isFactorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  const score = riskScoreData?.overallScore ?? 50;
  const previousScore = riskScoreHistory && riskScoreHistory.length > 1 
    ? riskScoreHistory[1]?.overallScore ?? score 
    : score;
  const trend = score > previousScore ? 'up' : score < previousScore ? 'down' : 'stable';

  const getScoreColor = () => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-chart-3';
    if (score >= 40) return 'text-chart-2';
    return 'text-destructive';
  };

  const getScoreGradient = () => {
    if (score >= 80) return 'from-primary to-chart-2';
    if (score >= 60) return 'from-chart-3 to-chart-2';
    if (score >= 40) return 'from-chart-2 to-destructive';
    return 'from-destructive to-red-700';
  };

  const getScoreLabel = () => {
    if (score <= 20) return 'Excellent';
    if (score <= 40) return 'Great';
    if (score <= 60) return 'Getting There';
    return 'Room to Improve';
  };

  const getFactorStyles = (type: 'negative' | 'warning' | 'positive', points: number, maxPoints: number) => {
    if (type === 'negative') {
      const intensity = maxPoints > 0 ? Math.min(points / maxPoints, 1) : Math.min(points / 30, 1);
      if (intensity >= 0.7 || points >= 20) {
        return {
          bg: 'bg-red-500/20',
          border: 'border-red-500/40',
          iconBg: 'bg-red-500/30',
          iconColor: 'text-red-500',
          text: 'text-foreground',
          pointsBg: 'bg-red-500',
        };
      } else if (intensity >= 0.4 || points >= 10) {
        return {
          bg: 'bg-destructive/15',
          border: 'border-destructive/30',
          iconBg: 'bg-destructive/25',
          iconColor: 'text-destructive',
          text: 'text-foreground',
          pointsBg: 'bg-destructive',
        };
      }
      return {
        bg: 'bg-destructive/10',
        border: 'border-destructive/20',
        iconBg: 'bg-destructive/20',
        iconColor: 'text-destructive',
        text: 'text-foreground',
        pointsBg: 'bg-destructive/80',
      };
    } else if (type === 'warning') {
      const intensity = maxPoints > 0 ? Math.min(points / maxPoints, 1) : Math.min(points / 15, 1);
      if (intensity >= 0.6 || points >= 10) {
        return {
          bg: 'bg-amber-500/15',
          border: 'border-amber-500/30',
          iconBg: 'bg-amber-500/25',
          iconColor: 'text-amber-500',
          text: 'text-foreground',
          pointsBg: 'bg-amber-500',
        };
      }
      return {
        bg: 'bg-chart-3/10',
        border: 'border-chart-3/20',
        iconBg: 'bg-chart-3/20',
        iconColor: 'text-chart-3',
        text: 'text-foreground',
        pointsBg: 'bg-chart-3',
      };
    }
    return {
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      text: 'text-foreground',
      pointsBg: 'bg-primary',
    };
  };

  const factors = riskFactorsData || [];
  const negativeFactors = factors.filter(f => f.type === 'negative').sort((a, b) => b.points - a.points);
  const warningFactors = factors.filter(f => f.type === 'warning').sort((a, b) => b.points - a.points);
  const positiveFactors = factors.filter(f => f.type === 'positive').sort((a, b) => b.points - a.points);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary via-primary to-chart-2 p-6 pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/my-dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/20" data-testid="button-back-dashboard">
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                Back
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-xl font-black text-white">Risk Score</h1>
              <p className="text-white/70 text-sm">Health Overview</p>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </div>
      {/* Score Card - Overlapping Header */}
      <div className="max-w-4xl mx-auto px-4 -mt-24">
        <Card className="p-6 mb-6 border-0 shadow-xl">
          <div className="flex flex-col items-center">
            {/* Score Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="relative w-36 h-36 mb-4"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted/30"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 283} 283`}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" className={`${getScoreColor().replace('text-', 'stop-color-')}`} style={{ stopColor: score >= 60 ? '#84cc16' : '#f97316' }} />
                    <stop offset="100%" style={{ stopColor: '#06b6d4' }} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-black ${getScoreColor()}`}>{Math.round(score)}</span>
                <span className="text-xs text-muted-foreground font-medium">out of 100</span>
              </div>
            </motion.div>

            {/* Score Label & Trend */}
            <div className="flex items-center gap-3 mb-4">
              <Badge className={`bg-gradient-to-r ${getScoreGradient()} text-white border-0 px-4 py-1`}>
                {getScoreLabel()}
              </Badge>
              {trend === 'up' && (
                <div className="flex items-center gap-1 text-primary text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{Math.round(score - previousScore)} pts</span>
                </div>
              )}
              {trend === 'down' && (
                <div className="flex items-center gap-1 text-destructive text-sm font-medium">
                  <TrendingDown className="w-4 h-4" />
                  <span>{Math.round(score - previousScore)} pts</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-md">
              <div className="text-center p-2 sm:p-3 rounded-xl bg-destructive/10">
                <p className="text-xl sm:text-2xl font-black text-destructive">{negativeFactors.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Risk Factors</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-xl bg-chart-3/10">
                <p className="text-xl sm:text-2xl font-black text-chart-3">{warningFactors.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Warnings</p>
              </div>
              <div className="text-center p-2 sm:p-3 rounded-xl bg-primary/10">
                <p className="text-xl sm:text-2xl font-black text-primary">{positiveFactors.length}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Positive</p>
              </div>
            </div>
          </div>
        </Card>

        {/* What This Means */}
        <Card className="p-5 mb-4 border-0 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Info className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-foreground mb-1">What does this mean?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">Your risk score is calculated from your lifestyle, medical history, and daily habits. Focus on improving the red items that can be changed first for the biggest impact on your health.</p>
            </div>
          </div>
        </Card>

        {/* Risk Factors Section */}
        <Card className="p-5 mb-4 border-0 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <h3 className="font-bold text-foreground">Areas Needing Attention</h3>
            <Badge variant="outline" className="ml-auto text-destructive border-destructive/30">
              {negativeFactors.length} factors
            </Badge>
          </div>
          
          <div className="space-y-2">
            {negativeFactors.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No significant risk factors found. Great job!</p>
            ) : (
              negativeFactors.map((factor, index) => {
                const styles = getFactorStyles(factor.type, factor.points, factor.maxPoints);
                return (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${styles.bg} border ${styles.border}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center ${styles.iconColor}`}>
                      {getIconComponent(factor.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${styles.text}`}>{factor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{factor.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${styles.pointsBg} text-white text-xs px-2`}>
                        +{factor.points} pts
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{factor.category}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </Card>

        {/* Warnings Section */}
        {warningFactors.length > 0 && (
          <Card className="p-5 mb-4 border-0 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-chart-3/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-chart-3" />
              </div>
              <h3 className="font-bold text-foreground">Watch These</h3>
              <Badge variant="outline" className="ml-auto text-chart-3 border-chart-3/30">
                {warningFactors.length} factor{warningFactors.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {warningFactors.map((factor, index) => {
                const styles = getFactorStyles(factor.type, factor.points, factor.maxPoints);
                return (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (negativeFactors.length + index) * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${styles.bg} border ${styles.border}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center ${styles.iconColor}`}>
                      {getIconComponent(factor.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${styles.text}`}>{factor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{factor.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${styles.pointsBg} text-white text-xs px-2`}>
                        +{factor.points} pts
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{factor.category}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Positive Factors Section */}
        {positiveFactors.length > 0 && (
          <Card className="p-5 mb-4 border-0 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">Keep It Up!</h3>
              <Badge variant="outline" className="ml-auto text-primary border-primary/30">
                {positiveFactors.length} factor{positiveFactors.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="space-y-2">
              {positiveFactors.map((factor, index) => {
                const styles = getFactorStyles(factor.type, factor.points, factor.maxPoints);
                return (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (negativeFactors.length + warningFactors.length + index) * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-xl ${styles.bg} border ${styles.border}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${styles.iconBg} flex items-center justify-center ${styles.iconColor}`}>
                      {getIconComponent(factor.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${styles.text}`}>{factor.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{factor.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`${styles.pointsBg} text-white text-xs px-2`}>
                        0 pts
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{factor.category}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Get Personalized Recommendations */}
        <Card className="p-5 mb-8 border-0 shadow-lg bg-gradient-to-br from-primary/5 to-chart-2/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Want to lower your risk?</h3>
              <p className="text-sm text-muted-foreground">Chat with Loretta for personalized recommendations</p>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Our AI health assistant can analyze your risk factors and suggest practical steps tailored to your lifestyle and goals.
          </p>

          <Link href="/chat">
            <Button className="w-full bg-gradient-to-r from-primary to-chart-2 hover:opacity-90">
              <Sparkles className="w-4 h-4 mr-2" />
              Get Personalized Tips
            </Button>
          </Link>
        </Card>

        {/* Disclaimer */}
        <div className="text-center pb-8">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            <span className="font-semibold">Disclaimer:</span> Loretta is not a diagnostic tool. 
            The information provided is for educational purposes only and should not replace 
            professional medical advice, diagnosis, or treatment. Always consult your healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}
