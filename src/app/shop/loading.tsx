// Shown instantly while the shop page's product query streams in (see
// loading.js convention — swapped out automatically once the real page is
// ready). Mirrors the real grid's shape so there's no layout jump.
export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-md bg-muted" />
            <div className="mt-3 h-3 w-2/3 rounded bg-muted" />
            <div className="mt-2 h-3 w-1/3 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
