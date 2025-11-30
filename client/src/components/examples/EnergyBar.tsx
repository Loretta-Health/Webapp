import EnergyBar from '../EnergyBar';

export default function EnergyBarExample() {
  return (
    <div className="p-6 space-y-6 max-w-md">
      <EnergyBar current={85} max={100} />
      <EnergyBar current={45} max={100} />
      <EnergyBar current={20} max={100} />
    </div>
  );
}
