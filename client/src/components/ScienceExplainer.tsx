import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface ScienceExplainerProps {
  title: string;
  whyItMatters: string;
  scienceDetails: string[];
  communityTip?: string;
  sources?: string[];
  className?: string;
}

export default function ScienceExplainer({
  title,
  whyItMatters,
  scienceDetails,
  communityTip,
  sources,
  className = ''
}: ScienceExplainerProps) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-3 border border-primary/10">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-chart-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-chart-3 uppercase mb-1">Why this matters</p>
            <p className="text-sm text-foreground leading-relaxed">{whyItMatters}</p>
          </div>
        </div>
      </div>
      
      {communityTip && (
        <div className="bg-gradient-to-r from-chart-2/5 to-chart-4/5 rounded-lg p-3 border border-chart-2/10">
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-chart-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-chart-2 uppercase mb-1">Health Tip</p>
              <p className="text-sm text-foreground leading-relaxed italic">"{communityTip}"</p>
            </div>
          </div>
        </div>
      )}
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full justify-between bg-gradient-to-r from-primary/5 to-chart-1/5 hover:from-primary/10 hover:to-chart-1/10 border-primary/20"
        data-testid="button-learn-science"
      >
        <span className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-primary" />
          <span className="font-bold text-primary">Learn the Science</span>
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </Button>
      
      <AnimatePresence>
        {expanded && (
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
                <h4 className="font-bold text-foreground">The Science Behind {title}</h4>
              </div>
              
              <ul className="space-y-3">
                {scienceDetails.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white">{index + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{detail}</p>
                  </li>
                ))}
              </ul>
              
              {sources && sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center gap-1 mb-2">
                    <BookOpen className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-semibold text-muted-foreground">Sources</span>
                  </div>
                  <ul className="space-y-1">
                    {sources.map((source, index) => (
                      <li key={index} className="text-xs text-muted-foreground">
                        • {source}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
