import QuestCard from '../QuestCard';

export default function QuestCardExample() {
  return (
    <div className="p-6 max-w-md space-y-4">
      <QuestCard 
        title="Complete 10 jumping jacks"
        category="daily"
        xpReward={50}
        progress={10}
        maxProgress={10}
      />
      <QuestCard 
        title="Drink 8 glasses of water"
        category="daily"
        xpReward={30}
        progress={5}
        maxProgress={8}
      />
      <QuestCard 
        title="Maintain 30-day streak"
        category="bonus"
        xpReward={500}
        progress={14}
        maxProgress={30}
        legendary
      />
    </div>
  );
}
