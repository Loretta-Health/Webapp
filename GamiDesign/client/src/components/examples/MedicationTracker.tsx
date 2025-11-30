import MedicationTracker from '../MedicationTracker';

export default function MedicationTrackerExample() {
  return (
    <div className="p-6 max-w-sm">
      <MedicationTracker 
        name="Omeprazole"
        dosage="20mg"
        timing="Before breakfast"
        frequency="daily"
        streak={14}
        onTake={() => console.log('Medication taken')}
      />
    </div>
  );
}
