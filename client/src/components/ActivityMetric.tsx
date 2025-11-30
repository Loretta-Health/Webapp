import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'wouter';
import MedicalTerm from './MedicalTerm';

interface ActivityMetricProps {
  title: string;
  value: number | string;
  goal?: number | string;
  unit: string;
  icon: LucideIcon;
  progress?: number;
  trend?: number;
  color?: string;
  explanation?: string;
  simpleExplanation?: string;
  href?: string;
  className?: string;
}

export default function ActivityMetric({
  title,
  value,
  goal,
  unit,
  icon: Icon,
  progress = 0,
  trend,
  color = 'text-primary',
  explanation,
  simpleExplanation,
  href,
  className = ''
}: ActivityMetricProps) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  const cardContent = (
    <Card className={`p-4 hover:-translate-y-1 transition-all ${href ? 'cursor-pointer hover-elevate' : ''} ${className}`} data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
          {explanation ? (
            <MedicalTerm 
              term={title}
              explanation={explanation}
              simpleExplanation={simpleExplanation}
              category="metric"
            />
          ) : title}
        </h4>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              className="text-muted/20"
            />
            <circle
              cx="48"
              cy="48"
              r="45"
              stroke="currentColor"
              strokeWidth="6"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className={`${color} transition-all duration-500`}
              data-testid="metric-circle"
            />
          </svg>
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-foreground" data-testid="metric-value">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">{unit}</span>
          </div>
        </div>
        
        <div className="flex-1">
          {goal && (
            <div className="text-sm mb-2">
              <span className="text-muted-foreground">Goal: </span>
              <span className="font-bold text-foreground" data-testid="metric-goal">{goal}</span>
            </div>
          )}
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-bold ${
              trend > 0 ? 'text-primary' : trend < 0 ? 'text-destructive' : 'text-muted-foreground'
            }`} data-testid="metric-trend">
              {trend > 0 ? <TrendingUp className="w-4 h-4" /> : trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
              <span>{Math.abs(trend)}% {trend > 0 ? 'more' : 'less'}</span>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-1">
            {progress}% complete
          </div>
        </div>
      </div>
    </Card>
  );
  
  if (href) {
    return <Link href={href}>{cardContent}</Link>;
  }
  
  return cardContent;
}
