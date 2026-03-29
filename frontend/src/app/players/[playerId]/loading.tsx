export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-32 bg-lavender-rose/30 rounded-2xl mb-6" />
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 w-16 bg-lavender-rose/30 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-40 bg-lavender-rose/30 rounded-xl" />
          <div className="h-64 bg-lavender-rose/30 rounded-xl" />
          <div className="h-48 bg-lavender-rose/30 rounded-xl" />
        </div>
        <div className="h-[500px] bg-lavender-rose/30 rounded-2xl" />
      </div>
    </div>
  );
}
