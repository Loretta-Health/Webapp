import { useState } from 'react';
import LevelUpModal from '../LevelUpModal';
import { Button } from '@/components/ui/button';

export default function LevelUpModalExample() {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="p-6 flex justify-center">
      <Button onClick={() => setOpen(true)}>
        Show Level Up
      </Button>
      
      <LevelUpModal
        open={open}
        level={13}
        xpEarned={500}
        badges={['Week Warrior', 'Hydration Hero']}
        unlocks={['New achievement category', 'Bonus XP multiplier', 'Custom avatar accessories']}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
