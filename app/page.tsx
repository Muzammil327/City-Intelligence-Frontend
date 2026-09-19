import { Suspense } from "react";

import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <div className="min-h-dvh w-full">
      {/*
        DashboardView reads `?tab=` through `useSearchParams`, which opts the
        tree below this boundary into client-side rendering. Without the
        boundary that opt-in climbs to the whole route, and the build says so.
      */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardView />
      </Suspense>
    </div>
  );
}
