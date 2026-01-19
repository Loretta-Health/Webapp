import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, 
  ChevronUp, 
  Beaker, 
  BookOpen, 
  Brain,
  Lightbulb,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HealthScienceSectionProps {
  category: 'activity' | 'sleep' | 'nutrition' | 'medication' | 'heart';
  className?: string;
}

interface Source {
  name: string;
  url: string;
}

const scienceData = {
  activity: {
    title: 'Physical Activity',
    whyItMatters: "Regular movement helps your muscles use blood sugar for energy and makes your insulin work more effectively. It doesn't have to be a gym workout—just moving your body counts.",
    tip: "Walking to the bus stop, taking the stairs, or even dancing in your kitchen counts as exercise! Try to add just 10 more minutes today.",
    details: [
      "Exercise increases insulin sensitivity by up to 50% for 24-72 hours after a workout, helping your cells absorb glucose more efficiently.",
      "Physical activity triggers GLUT-4 transporters to move to cell surfaces, allowing glucose to enter muscle cells without requiring insulin.",
      "Regular movement reduces visceral fat (belly fat), which produces inflammatory compounds that contribute to insulin resistance.",
      "Even short 10-minute walks after meals can reduce post-meal blood sugar spikes by 12-22% according to studies."
    ],
    sources: [
      { name: "American Diabetes Association Standards of Care (2024)", url: "https://diabetesjournals.org/care/issue/47/Supplement_1" },
      { name: "Harvard Health - Walking After Meals Study", url: "https://www.health.harvard.edu/staying-healthy/the-importance-of-exercise-when-you-have-diabetes" }
    ] as Source[]
  },
  sleep: {
    title: 'Sleep Quality',
    whyItMatters: "When you don't sleep enough, your body releases stress hormones like cortisol, which can actually raise your blood sugar even if you haven't eaten.",
    tip: "Street lights keeping you up? Try hanging a thick blanket over the window if you don't have blackout curtains. A darker room helps you stay asleep.",
    details: [
      "Sleep deprivation reduces insulin sensitivity by 25-40% after just 4 nights of shortened sleep, mimicking pre-diabetic states.",
      "Poor sleep increases ghrelin (hunger hormone) by 28% and decreases leptin (fullness hormone), leading to increased calorie intake.",
      "During deep sleep, growth hormone is released which helps repair tissues and regulate metabolism. Missing this phase affects overall health.",
      "Circadian rhythm disruption affects the body's ability to produce insulin properly, independent of sleep duration."
    ],
    sources: [
      { name: "Sleep Medicine Reviews - Sleep and Metabolism", url: "https://www.sciencedirect.com/journal/sleep-medicine-reviews" },
      { name: "Lancet - Sleep Deprivation and Insulin Sensitivity", url: "https://www.thelancet.com/journals/landia/article/PIIS2213-8587(14)70235-6/fulltext" },
      { name: "National Sleep Foundation Guidelines", url: "https://www.sleepfoundation.org/how-sleep-works/how-much-sleep-do-we-really-need" }
    ] as Source[]
  },
  nutrition: {
    title: 'Nutrition & Fiber',
    whyItMatters: "Fiber acts like a sponge in your digestion, slowing down how fast sugar enters your blood. This prevents those tired, spiky feelings after eating.",
    tip: "Frozen vegetables are just as healthy as fresh ones and often cheaper! Rinse canned beans to lower the salt before cooking.",
    details: [
      "Soluble fiber forms a gel in the digestive tract that slows glucose absorption, reducing post-meal blood sugar spikes by up to 50%.",
      "Eating protein and vegetables before carbohydrates can reduce glucose spikes by 73%, according to food sequencing studies.",
      "The glycemic index of foods can be lowered by combining them with healthy fats, fiber, and protein in the same meal.",
      "Gut bacteria ferment fiber into short-chain fatty acids, which improve insulin sensitivity and reduce inflammation."
    ],
    sources: [
      { name: "American Journal of Clinical Nutrition", url: "https://academic.oup.com/ajcn" },
      { name: "Diabetes Care - Food Order and Glycemic Control", url: "https://diabetesjournals.org/care/article/38/7/e98/37557/Food-Order-Has-a-Significant-Impact-on" },
      { name: "Gut Microbiome and Metabolic Health Studies", url: "https://www.nature.com/articles/s41575-019-0157-3" }
    ] as Source[]
  },
  medication: {
    title: 'Medication Adherence',
    whyItMatters: "Taking medications consistently keeps their levels stable in your body, which is essential for them to work effectively. Missing doses can cause fluctuations that reduce effectiveness.",
    tip: "Set a daily phone alarm or keep your medications next to something you do every day, like your coffee maker or toothbrush.",
    details: [
      "Medication half-life determines how long drugs stay active in your system. Consistent timing maintains therapeutic levels.",
      "Missing doses of blood pressure medications can cause rebound hypertension, potentially increasing cardiovascular risk.",
      "For diabetes medications, consistent timing helps match drug action with meal patterns, optimizing blood sugar control.",
      "Studies show that patients who use reminder systems have 20-30% better medication adherence rates."
    ],
    sources: [
      { name: "Clinical Pharmacology & Therapeutics", url: "https://ascpt.onlinelibrary.wiley.com/journal/15326535" },
      { name: "WHO Medication Adherence Guidelines", url: "https://www.who.int/chp/knowledge/publications/adherence_report/en/" },
      { name: "Journal of the American Medical Association", url: "https://jamanetwork.com/journals/jama" }
    ] as Source[]
  },
  heart: {
    title: 'Heart Health',
    whyItMatters: "Your resting heart rate is a window into your cardiovascular fitness. A lower resting rate often indicates a stronger, more efficient heart muscle.",
    tip: "Check your heart rate first thing in the morning before getting out of bed for the most accurate resting measurement.",
    details: [
      "Each 10 bpm increase in resting heart rate is associated with a 16% increased risk of cardiovascular mortality.",
      "Regular aerobic exercise can lower resting heart rate by 10-20 bpm over several months by strengthening the heart muscle.",
      "Heart rate variability (HRV) - the variation between heartbeats - is a key indicator of nervous system health and stress resilience.",
      "The heart adapts to regular exercise by increasing stroke volume, allowing it to pump more blood with fewer beats."
    ],
    sources: [
      { name: "European Heart Journal", url: "https://academic.oup.com/eurheartj" },
      { name: "American College of Cardiology Guidelines", url: "https://www.acc.org/guidelines" },
      { name: "Journal of the American Heart Association", url: "https://www.ahajournals.org/journal/jaha" }
    ] as Source[]
  }
};

export default function HealthScienceSection({ category, className = '' }: HealthScienceSectionProps) {
  const { t } = useTranslation('dashboard');
  const [showScience, setShowScience] = useState(false);
  const data = scienceData[category];
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-3 border border-primary/10">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-chart-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-chart-3 uppercase mb-1">Why this matters</p>
            <p className="text-xs lg:text-sm text-foreground leading-relaxed">{data.whyItMatters}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-chart-2/5 to-chart-4/5 rounded-lg p-3 border border-chart-2/10">
        <div className="flex items-start gap-2">
          <Brain className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-chart-2 uppercase mb-1">{t('community.communityTip')}</p>
            <p className="text-xs lg:text-sm text-foreground leading-relaxed italic">"{data.tip}"</p>
          </div>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowScience(!showScience)}
        className="w-full justify-between bg-gradient-to-r from-primary/5 to-chart-1/5 hover:from-primary/10 hover:to-chart-1/10 border-primary/20"
        data-testid={`button-learn-science-${category}`}
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
                <h4 className="font-bold text-foreground text-sm lg:text-base">The Science Behind {data.title}</h4>
              </div>
              
              <ul className="space-y-3">
                {data.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <p className="text-xs lg:text-sm text-muted-foreground leading-relaxed">{detail}</p>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center gap-1 mb-2">
                  <BookOpen className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">Sources</span>
                </div>
                <ul className="space-y-1">
                  {data.sources.map((source, index) => (
                    <li key={index} className="text-xs">
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        data-testid={`link-source-${index}`}
                      >
                        {source.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
