import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex w-full flex-col gap-8 lg:h-dvh lg:flex-row lg:gap-0 lg:overflow-hidden">
      <aside className="shrink-0 px-5 py-6 lg:flex lg:h-full lg:w-60 lg:flex-col lg:gap-6 lg:border-r lg:border-white/5 lg:px-5 lg:py-6">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-1.5">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
      </aside>
      <div className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto">
        <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="mb-6 h-64 w-full" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}