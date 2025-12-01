import { Link } from 'wouter';
import { ChevronLeft, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RiskFactor {
  id: string;
  text: string;
  type: 'negative' | 'warning' | 'positive';
}

const riskFactors: RiskFactor[] = [
  { id: '1', text: 'You smoke 10 cigarettes per day', type: 'negative' },
  { id: '2', text: 'Limited physical activity', type: 'negative' },
  { id: '3', text: 'High sugar diet', type: 'negative' },
  { id: '4', text: 'Low vegetable intake', type: 'negative' },
  { id: '5', text: 'Minimal protein consumption', type: 'negative' },
  { id: '6', text: 'Moderate alcohol consumption (1 drink/day)', type: 'warning' },
  { id: '7', text: 'Taking prescribed medication regularly', type: 'positive' },
];

export default function RiskScoreDetails() {
  const score = 72;

  const getScoreColor = () => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-chart-3';
    if (score >= 40) return 'text-chart-2';
    return 'text-destructive';
  };

  const getFactorStyles = (type: RiskFactor['type']) => {
    switch (type) {
      case 'negative':
        return {
          bg: 'bg-red-50',
          border: 'border-red-100',
          icon: <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />,
          text: 'text-destructive',
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-100',
          icon: <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />,
          text: 'text-orange-600',
        };
      case 'positive':
        return {
          bg: 'bg-green-50',
          border: 'border-green-100',
          icon: <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />,
          text: 'text-primary',
        };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[#4355B9] text-white py-4 px-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-1 hover:bg-white/10 rounded-lg transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </Link>
          <div className="text-center flex-1 pr-10">
            <h1 className="text-xl font-bold">Risk Score</h1>
            <p className="text-sm text-white/80">Your Health Overview</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        <section className="bg-slate-100 py-8 px-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-6">Your Risk Score</h2>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.4 }}
              className="relative w-32 h-32 mx-auto"
            >
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="#e5e7eb"
                  strokeWidth="10"
                  fill="none"
                />
                <circle
                  cx="50%"
                  cy="50%"
                  r="45%"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 283} 283`}
                  className={getScoreColor()}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-3xl font-black ${getScoreColor()}`}>{score}</span>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-4 py-6">
          <h3 className="text-lg font-bold text-foreground mb-2">What does this mean?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your risk score is calculated based on your lifestyle, medical history, and daily habits. 
            Below are the key factors affecting your score. Green items are positive factors, 
            while orange and red items need attention.
          </p>
        </section>

        <section className="px-4 pb-8">
          <h3 className="text-lg font-bold text-foreground mb-4">Key Factors</h3>
          
          <div className="space-y-3">
            {riskFactors.map((factor, index) => {
              const styles = getFactorStyles(factor.type);
              return (
                <motion.div
                  key={factor.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-4 rounded-lg ${styles.bg} border ${styles.border}`}
                >
                  {styles.icon}
                  <span className={`text-sm font-medium ${styles.text}`}>
                    {factor.text}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
