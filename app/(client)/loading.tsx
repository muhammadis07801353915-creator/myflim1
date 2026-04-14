export default function Loading() {
  return (
    <div className="bg-neutral-950 text-white min-h-screen animate-pulse">
      {/* Hero Skeleton */}
      <div className="relative w-full h-[60vh] md:h-[70vh] bg-neutral-900 rounded-b-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent" />
        <div className="absolute bottom-8 left-6 right-6 space-y-4">
          <div className="h-8 w-64 bg-neutral-800 rounded-lg" />
          <div className="h-4 w-48 bg-neutral-800 rounded" />
          <div className="flex space-x-3 mt-4">
            <div className="h-12 w-36 bg-red-600/30 rounded-xl" />
            <div className="h-12 w-12 bg-neutral-800 rounded-full" />
          </div>
        </div>
      </div>

      {/* Content Rows Skeleton */}
      <div className="px-4 md:px-6 mt-8 space-y-8">
        {[1, 2, 3].map((row) => (
          <div key={row}>
            <div className="h-6 w-40 bg-neutral-800 rounded mb-4" />
            <div className="flex space-x-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((card) => (
                <div key={card} className="flex-shrink-0 w-32 md:w-40">
                  <div className="aspect-[2/3] bg-neutral-800 rounded-xl" />
                  <div className="h-3 w-24 bg-neutral-800 rounded mt-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
