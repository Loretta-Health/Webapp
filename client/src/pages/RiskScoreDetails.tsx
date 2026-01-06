import { Link, Redirect } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  MessageCircle,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
  type: 'negative' | 'warning' | 'positive';
  icon: string;
}

function GlassCard({ 
  children, 
  className = '',
  glow = false 
}: { 
  children: React.ReactNode; 
  className?: string;
  glow?: boolean;
}) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/70 dark:bg-gray-900/70
      border border-white/50 dark:border-white/10
      rounded-3xl shadow-xl
      ${glow ? 'shadow-[#013DC4]/20' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

function SolidCard({ 
  children, 
  className = ''
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  return (
    <div className={`
      bg-white dark:bg-gray-900
      border border-gray-200 dark:border-gray-800
      rounded-3xl shadow-xl
      ${className}
    `}>
      {children}
    </div>
  );
}

function Section({ 
  title, 
  icon, 
  badge, 
  children, 
  iconColor = 'from-[#013DC4] to-[#CDB6EF]'
}: { 
  title: string; 
  icon: React.ReactNode; 
  badge?: React.ReactNode;
  children: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <GlassCard className="overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br ${iconColor} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
            {icon}
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg">{title}</h3>
          {badge}
        </div>
        {children}
      </div>
    </GlassCard>
  );
}

const getIconComponent = (iconName: string, size = 'w-4 h-4') => {
  const iconMap: Record<string, React.ReactNode> = {
    'scale': <Scale className={size} />,
    'trending-up': <TrendingUp className={size} />,
    'trending-down': <TrendingDown className={size} />,
    'calendar': <Calendar className={size} />,
    'droplets': <Droplets className={size} />,
    'heart-pulse': <HeartPulse className={size} />,
    'activity': <Activity className={size} />,
    'heart': <Heart className={size} />,
    'heart-crack': <Heart className={size} />,
    'heart-off': <Heart className={size} />,
    'brain': <Brain className={size} />,
    'kidney': <Droplets className={size} />,
    'dumbbell': <Dumbbell className={size} />,
    'armchair': <Armchair className={size} />,
    'moon': <Moon className={size} />,
    'wine': <Wine className={size} />,
    'footprints': <Footprints className={size} />,
    'smile': <Smile className={size} />,
    'user': <User className={size} />,
    'pill': <Pill className={size} />,
  };
  return iconMap[iconName] || <Activity className={size} />;
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

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/risk-scores/calculate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risk-scores/latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk-scores'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk-factors'] });
    },
  });

  if (isAuthLoading || isScoreLoading || isFactorsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#013DC4]/5 via-white to-[#CDB6EF]/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#013DC4]" />
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
    if (score <= 20) return 'text-green-500';
    if (score <= 40) return 'text-[#013DC4]';
    if (score <= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreLabelColor = () => {
    if (score <= 20) return 'bg-green-500';
    if (score <= 40) return 'bg-[#013DC4]';
    if (score <= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getScoreLabel = () => {
    if (score <= 20) return 'Low Risk';
    if (score <= 40) return 'Moderate';
    if (score <= 60) return 'Elevated';
    return 'High Risk';
  };

  const getFactorStyles = (type: 'negative' | 'warning' | 'positive') => {
    if (type === 'negative') {
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800/30',
        iconBg: 'bg-gradient-to-br from-red-500 to-rose-400',
        iconColor: 'text-white',
        text: 'text-gray-900 dark:text-white',
      };
    } else if (type === 'warning') {
      return {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800/30',
        iconBg: 'bg-gradient-to-br from-amber-500 to-orange-400',
        iconColor: 'text-white',
        text: 'text-gray-900 dark:text-white',
      };
    }
    return {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800/30',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-400',
      iconColor: 'text-white',
      text: 'text-gray-900 dark:text-white',
    };
  };

  const factors = riskFactorsData || [];
  const negativeFactors = factors.filter(f => f.type === 'negative').sort((a, b) => a.name.localeCompare(b.name));
  const warningFactors = factors.filter(f => f.type === 'warning').sort((a, b) => a.name.localeCompare(b.name));
  const positiveFactors = factors.filter(f => f.type === 'positive').sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#013DC4]/5 via-white to-[#CDB6EF]/10 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] p-4 sm:p-6 pb-28 sm:pb-32">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/my-dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/20 rounded-xl" data-testid="button-back-dashboard">
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <div className="text-center">
              <h1 className="text-lg sm:text-xl font-black text-white">Health Score</h1>
              <p className="text-white/70 text-xs sm:text-sm">Your Health Overview</p>
            </div>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 rounded-xl" 
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
              data-testid="button-recalculate"
            >
              <RefreshCw className={`w-4 h-4 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-24 space-y-4 pb-8">
        {/* Score Card - Solid white background */}
        <SolidCard className="p-5 sm:p-6">
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
                    <stop offset="0%" style={{ stopColor: score <= 30 ? '#22c55e' : score <= 60 ? '#f59e0b' : '#ef4444' }} />
                    <stop offset="100%" style={{ stopColor: score <= 30 ? '#84cc16' : score <= 60 ? '#f97316' : '#dc2626' }} />
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
              <Badge className={`${getScoreLabelColor()} text-white border-0 px-4 py-1 rounded-full shadow-lg`}>
                {getScoreLabel()}
              </Badge>
              {trend === 'up' && (
                <div className="flex items-center gap-1 text-red-500 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{Math.round(score - previousScore)}</span>
                </div>
              )}
              {trend === 'down' && (
                <div className="flex items-center gap-1 text-green-500 text-sm font-medium">
                  <TrendingDown className="w-4 h-4" />
                  <span>{Math.round(score - previousScore)}</span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-sm">
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                <p className="text-xl sm:text-2xl font-black text-red-500">{negativeFactors.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Risk</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                <p className="text-xl sm:text-2xl font-black text-amber-500">{warningFactors.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Watch</p>
              </div>
              <div className="text-center p-3 sm:p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
                <p className="text-xl sm:text-2xl font-black text-green-500">{positiveFactors.length}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Good</p>
              </div>
            </div>
          </div>
        </SolidCard>

        {/* What This Means */}
        <GlassCard className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center flex-shrink-0 shadow-lg">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">What does this mean?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Your risk score is calculated from your lifestyle, medical history, and daily habits. 
                Focus on improving the red items first for the biggest impact on your health.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Risk Factors Section - Not collapsible */}
        <Section
          title="Areas Needing Attention"
          icon={<AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />}
          iconColor="from-red-500 to-rose-400"
          badge={
            <Badge className="ml-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border-0 rounded-full text-xs">
              {negativeFactors.length}
            </Badge>
          }
        >
          <div className="space-y-2">
            {negativeFactors.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No significant risk factors found. Great job!</p>
            ) : (
              negativeFactors.map((factor, index) => {
                const styles = getFactorStyles(factor.type);
                return (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-2xl ${styles.bg} border ${styles.border}`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${styles.iconBg} flex items-center justify-center ${styles.iconColor} shadow-lg flex-shrink-0`}>
                      {getIconComponent(factor.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${styles.text}`}>{factor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{factor.description}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </Section>

        {/* Warnings Section - Not collapsible */}
        {warningFactors.length > 0 && (
          <Section
            title="Watch These"
            icon={<AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconColor="from-amber-500 to-orange-400"
            badge={
              <Badge className="ml-2 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 border-0 rounded-full text-xs">
                {warningFactors.length}
              </Badge>
            }
          >
            <div className="space-y-2">
              {warningFactors.map((factor, index) => {
                const styles = getFactorStyles(factor.type);
                return (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-2xl ${styles.bg} border ${styles.border}`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${styles.iconBg} flex items-center justify-center ${styles.iconColor} shadow-lg flex-shrink-0`}>
                      {getIconComponent(factor.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${styles.text}`}>{factor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{factor.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Positive Factors Section - Not collapsible */}
        {positiveFactors.length > 0 && (
          <Section
            title="Keep It Up!"
            icon={<CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            iconColor="from-green-500 to-emerald-400"
            badge={
              <Badge className="ml-2 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 border-0 rounded-full text-xs">
                {positiveFactors.length}
              </Badge>
            }
          >
            <div className="space-y-2">
              {positiveFactors.map((factor, index) => {
                const styles = getFactorStyles(factor.type);
                return (
                  <motion.div
                    key={factor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-2xl ${styles.bg} border ${styles.border}`}
                  >
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${styles.iconBg} flex items-center justify-center ${styles.iconColor} shadow-lg flex-shrink-0`}>
                      {getIconComponent(factor.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${styles.text}`}>{factor.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{factor.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Get Personalized Recommendations */}
        <GlassCard className="p-4 sm:p-5 bg-gradient-to-br from-[#013DC4]/5 to-[#CDB6EF]/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#013DC4] to-[#CDB6EF] flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white">Want to lower your risk?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Chat with Loretta for personalized tips</p>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Our AI health assistant can analyze your risk factors and suggest practical steps tailored to your lifestyle.
          </p>

          <Link href="/chat">
            <Button className="w-full bg-gradient-to-r from-[#013DC4] to-[#CDB6EF] hover:opacity-90 text-white rounded-xl py-6 font-bold shadow-lg">
              <Sparkles className="w-4 h-4 mr-2" />
              Get Personalized Tips
            </Button>
          </Link>
        </GlassCard>

        {/* Disclaimer */}
        <div className="text-center pt-2 pb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
            <span className="font-semibold">Disclaimer:</span> Loretta is not a diagnostic tool. 
            This information is for educational purposes only and should not replace 
            professional medical advice. Always consult your healthcare provider.
          </p>
        </div>
      </div>
    </div>
  );
}
