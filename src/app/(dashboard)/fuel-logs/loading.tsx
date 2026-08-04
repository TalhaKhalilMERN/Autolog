
export default function LoadingFuelLogs() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-muted/60" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="h-10 rounded bg-muted/60" />
        <div className="h-10 rounded bg-muted/60" />
        <div className="h-10 rounded bg-muted/60" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/40 border border-border" />
        ))}
      </div>
    </div>
  );
}
