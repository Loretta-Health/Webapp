import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, Heart, Footprints, Moon, Flame, Droplets } from 'lucide-react';
import { motion } from 'framer-motion';

export interface MetricData {
  type: 'steps' | 'heartRate' | 'sleep' | 'calories' | 'water' | 'activity';
  value: number;
  unit: string;
  goal?: number;
  trend?: number;
  label: string;
}

interface MetricCardProps {
  metric: MetricData;
}

const metricIcons = {
  steps: Footprints,
  heartRate: Heart,
  sleep: Moon,
  calories: Flame,
  water: Droplets,
  activity: Activity,
};

const metricColors = {
  steps: 'from-chart-1 to-blue-500',
  heartRate: 'from-destructive to-pink-500',
  sleep: 'from-chart-2 to-emerald-500',
  calories: 'from-chart-3 to-yellow-500',
  water: 'from-cyan-500 to-blue-500',
  activity: 'from-primary to-chart-2',
};

export default function MetricCard({ metric }: MetricCardProps) {
  const Icon = metricIcons[metric.type] || Activity;
  const colorGradient = metricColors[metric.type] || 'from-primary to-chart-2';
  const progress = metric.goal ? (metric.value / metric.goal) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="my-2"
    >
      <Card className="overflow-hidden border border-border/50 bg-gradient-to-br from-muted/30 to-muted/10">
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGradient} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase font-semibold">{metric.label}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">
                  {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                </span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
            </div>

            {metric.trend !== undefined && (
              <Badge 
                variant="secondary" 
                className={`${metric.trend >= 0 ? 'bg-chart-2/20 text-chart-2' : 'bg-destructive/20 text-destructive'}`}
              >
                {metric.trend >= 0 ? (
                  <TrendingUp className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingDown className="w-3 h-3 mr-1" />
                )}
                {Math.abs(metric.trend)}%
              </Badge>
            )}
          </div>

          {metric.goal && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progress)}% of goal</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-2" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
