import { DashboardView } from "@/components/dashboard/DashboardView";

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 max-w-2xl">
        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          City Intelligence
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Air quality across Lahore&rsquo;s neighbourhoods, with trends, a
          short-range forecast, area comparisons, a monitoring map, and a
          planning tool that projects what mitigation measures could do.
          Running on bundled{" "}
          <strong className="font-medium text-foreground">sample data</strong>{" "}
          to demonstrate the interface — these are not live readings.
        </p>
      </header>

      <DashboardView />
    </main>
  );
}
