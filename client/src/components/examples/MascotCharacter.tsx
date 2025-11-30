import MascotCharacter from '../MascotCharacter';

export default function MascotCharacterExample() {
  return (
    <div className="flex gap-8 items-center justify-center p-8">
      <MascotCharacter size="sm" pose="default" />
      <MascotCharacter size="md" pose="celebrate" speech="Great job!" />
      <MascotCharacter size="lg" pose="encourage" speech="Keep it up!" />
    </div>
  );
}
