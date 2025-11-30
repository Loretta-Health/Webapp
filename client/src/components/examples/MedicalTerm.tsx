import MedicalTerm from '../MedicalTerm';

export default function MedicalTermExample() {
  return (
    <div className="p-6 space-y-4 max-w-lg">
      <p className="text-foreground">
        Your medication{' '}
        <MedicalTerm 
          term="Omeprazole"
          explanation="A proton pump inhibitor (PPI) that reduces stomach acid production by blocking the enzyme in the stomach wall that produces acid."
          simpleExplanation="A medicine that helps reduce stomach acid to prevent heartburn and protect your stomach lining."
          category="medication"
        />{' '}
        should be taken with{' '}
        <MedicalTerm 
          term="20mg"
          explanation="Milligrams - a unit of measurement for medication dosage. 1000 milligrams equals 1 gram."
          simpleExplanation="A tiny measurement for medicine doses. Helps make sure you get exactly the right amount."
          category="medication"
        >
          20mg
        </MedicalTerm>{' '}
        dosage.
      </p>
      
      <p className="text-foreground">
        Your{' '}
        <MedicalTerm 
          term="Heart Rate"
          explanation="The number of heart contractions per minute. Resting heart rate between 60-100 bpm is considered normal for adults."
          simpleExplanation="How fast your heart is pumping. Lower is usually healthier when resting."
          category="metric"
        />{' '}
        is measured in{' '}
        <MedicalTerm 
          term="bpm"
          explanation="Beats per minute - the standard measurement of heart rate, indicating how many times your heart contracts in one minute."
          simpleExplanation="How many times your heart beats in one minute. Normal resting is 60-100 bpm."
          category="metric"
        />.
      </p>
    </div>
  );
}
