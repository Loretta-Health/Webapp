import StreakCounter from '../StreakCounter';

export default function StreakCounterExample() {
  return (
    <div className="flex gap-8 items-center justify-center p-8">
      <StreakCounter days={5} size="sm" />
      <StreakCounter days={14} size="md" />
      <StreakCounter days={30} size="lg" />
    </div>
  );
}
