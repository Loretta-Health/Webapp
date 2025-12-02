import { useState } from 'react';
import { Heart, ChevronDown, ChevronUp, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function InclusionFooter() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <footer className="w-full py-4 px-6 bg-gradient-to-r from-primary/5 via-background to-secondary/5 border-t border-border">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2"
            >
              <Heart className="w-4 h-4" />
              Inclusion & Accessibility at Loretta
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Inclusion & Accessibility at Loretta
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm text-muted-foreground">
              <p className="text-foreground font-medium">
                At Loretta, we believe everyone deserves easy, respectful, and reliable access to health and wellbeing support. Our app is built to serve people with different backgrounds, abilities, and levels of health literacy.
              </p>
              
              <p className="text-foreground font-medium">
                To make this possible, we design our experience with inclusion and accessibility at the center:
              </p>
              
              <ul className="space-y-3 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Clear, simple language is used throughout the app so information is easy to understand.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Flexible navigation supports different levels of digital experience.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Accessible color contrast and intuitive layouts are used throughout the app.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Screen-reader compatibility is currently in development, and we are working toward full accessibility support.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Respect for your identity is core to our work. You can always choose how you describe yourself.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Support is available if something is unclear or difficult to use.</span>
                </li>
              </ul>
              
              <div className="pt-4 border-t border-border">
                <p>
                  If you encounter a barrier or need additional support, please contact us at{' '}
                  <a 
                    href="mailto:info@loretta.care" 
                    className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <Mail className="w-3 h-3" />
                    info@loretta.care
                  </a>
                </p>
                <p className="mt-2 font-medium text-foreground">
                  Your feedback directly helps us improve accessibility for everyone.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        <span className="text-xs text-muted-foreground hidden sm:inline">|</span>
        
        <a 
          href="mailto:info@loretta.care" 
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <Mail className="w-3 h-3" />
          info@loretta.care
        </a>
      </div>
    </footer>
  );
}
