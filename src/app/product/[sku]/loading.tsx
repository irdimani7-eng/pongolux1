// Shown instantly while a product's data streams in.
export default function ProductLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-6 py-12">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="aspect-square rounded-md bg-muted" />
        <div>
          <div className="h-3 w-1/4 rounded bg-muted" />
          <div className="mt-3 h-7 w-3/4 rounded bg-muted" />
          <div className="mt-5 h-6 w-1/3 rounded bg-muted" />
          <div className="mt-8 h-11 w-40 rounded-full bg-muted" />
        </div>
      </div>
    </div>
  );
}
