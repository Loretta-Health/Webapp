import TreasureChest from '../TreasureChest';

export default function TreasureChestExample() {
  return (
    <div className="flex gap-8 items-center justify-center p-8">
      <TreasureChest canOpen={true} />
      <TreasureChest canOpen={false} />
    </div>
  );
}
