import MedicationTracker from '../MedicationTracker';

export default function MedicationTrackerExample() {
  return (
    <div className="p-6 max-w-sm">
      <MedicationTracker 
        medicationId="example-med-1"
        name="Omeprazole"
        dosage="20mg"
        scheduledTimes={["08:00"]}
        frequency="daily"
        adherencePercent={85}
      />
    </div>
  );
}
