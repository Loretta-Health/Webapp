import ActivityMetric from '../ActivityMetric';
import { Footprints, Moon, Heart, Flame } from 'lucide-react';

export default function ActivityMetricExample() {
  return (
    <div className="p-6 grid grid-cols-2 gap-4 max-w-2xl">
      <ActivityMetric
        title="Steps"
        value={8432}
        goal="10,000"
        unit="steps"
        icon={Footprints}
        progress={84}
        trend={12}
        color="text-chart-1"
      />
      <ActivityMetric
        title="Sleep"
        value="6.5"
        goal="8h"
        unit="hours"
        icon={Moon}
        progress={81}
        trend={-5}
        color="text-chart-2"
      />
      <ActivityMetric
        title="Heart Rate"
        value={72}
        goal="<80"
        unit="bpm"
        icon={Heart}
        progress={90}
        color="text-destructive"
      />
      <ActivityMetric
        title="Calories"
        value={1847}
        goal="2,200"
        unit="cal"
        icon={Flame}
        progress={84}
        trend={8}
        color="text-chart-3"
      />
    </div>
  );
}
