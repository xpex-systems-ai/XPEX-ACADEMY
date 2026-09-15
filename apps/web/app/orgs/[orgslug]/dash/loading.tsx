export default function DashboardLoading() {
  return (
    <div
      className="min-h-screen w-full bg-[#05080d] px-4 py-8 text-white sm:px-10"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Carregando painel de gestão…</span>
      <div className="mx-auto w-full max-w-[1600px] animate-pulse space-y-6">
        <div className="aspect-[1536/614] w-full rounded-3xl border border-[#223550] bg-[#0b1220]" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-56 rounded bg-[#142238]" />
            <div className="h-4 w-36 rounded bg-[#101a2b]" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-9 w-28 rounded-lg border border-[#223550] bg-[#0b1220]" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 rounded-2xl border border-[#223550] bg-[#0b1220]" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-72 rounded-2xl border border-[#223550] bg-[#0b1220] lg:col-span-2" />
          <div className="h-72 rounded-2xl border border-[#223550] bg-[#0b1220]" />
        </div>
      </div>
    </div>
  )
}
