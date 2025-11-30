import LivesIndicator from '../LivesIndicator';

export default function LivesIndicatorExample() {
  return (
    <div className="flex gap-8 items-center justify-center p-8">
      <LivesIndicator current={5} max={5} size="sm" />
      <LivesIndicator current={3} max={5} size="md" />
      <LivesIndicator current={1} max={5} size="lg" />
    </div>
  );
}
