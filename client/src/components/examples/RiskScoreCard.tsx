import RiskScoreCard from '../RiskScoreCard';

export default function RiskScoreCardExample() {
  return (
    <div className="p-6 max-w-md mx-auto">
      <RiskScoreCard 
        score={68} 
        trend="up"
        message="Elevated due to smoking habits and limited exercise"
      />
    </div>
  );
}
