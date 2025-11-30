import AchievementBadge from '../AchievementBadge';

export default function AchievementBadgeExample() {
  return (
    <div className="p-6 grid grid-cols-2 gap-4 max-w-2xl">
      <AchievementBadge
        title="First Steps"
        description="Complete your first daily check-in"
        icon="🎯"
        unlocked
        rarity="common"
        unlockedDate="2 days ago"
      />
      <AchievementBadge
        title="Week Warrior"
        description="Maintain a 7-day streak"
        icon="🔥"
        unlocked
        rarity="rare"
        unlockedDate="Today"
      />
      <AchievementBadge
        title="Health Champion"
        description="Reach level 10"
        icon="👑"
        unlocked={false}
        progress={7}
        maxProgress={10}
        rarity="epic"
      />
      <AchievementBadge
        title="Legend Status"
        description="Achieve 100-day streak"
        icon="⭐"
        unlocked={false}
        progress={14}
        maxProgress={100}
        rarity="legendary"
      />
    </div>
  );
}
