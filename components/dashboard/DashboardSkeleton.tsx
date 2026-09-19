import { Skeleton } from "@/components/ui/skeleton";

/**
 * The dashboard's shape before it has anything to put in it.
 *
 * Shared by `app/loading.tsx` and the Suspense boundary in `app/page.tsx`, so
 * the two never drift: the view reads `?tab=` with `useSearchParams`, which
 * makes it client-rendered up to the nearest boundary, and a fallback that
 * disagreed with the route skeleton would show two different layouts on one
 * page load.
 *
 * Mirrors `DashboardNav`: a bar on small screens, a column at `lg`.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex w-full flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3 lg:hidden">
        <Skeleton className="size-9 shrink-0 rounded-md" />
        <Skeleton className="h-6 w-40" />
      </div>

      <aside className="hidden shrink-0 lg:flex lg:h-full lg:w-60 lg:flex-col lg:gap-6 lg:border-r lg:border-white/5 lg:px-5 lg:py-6">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-1.5">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-md" />
          ))}
        </div>
      </aside>

      <div className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="mb-6 h-64 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-28 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
