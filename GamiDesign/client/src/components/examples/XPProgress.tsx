import XPProgress from '../XPProgress';

export default function XPProgressExample() {
  return (
    <div className="p-6 max-w-md">
      <XPProgress currentXP={750} nextLevelXP={1000} level={12} />
    </div>
  );
}
