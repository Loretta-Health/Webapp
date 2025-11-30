import DailyCheckIn from '../DailyCheckIn';

export default function DailyCheckInExample() {
  return (
    <div className="p-6 max-w-md">
      <DailyCheckIn 
        streak={14}
        dayNumber={14}
        xpReward={50}
        onStart={() => console.log('Check-in started')}
      />
    </div>
  );
}
