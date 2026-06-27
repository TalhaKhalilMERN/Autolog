export default function VehiclesLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-muted" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-3/4 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="flex justify-between border-t border-border/60 pt-3">
              <div className="h-4 w-24 animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-16 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
