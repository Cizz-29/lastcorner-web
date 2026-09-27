// Skeleton di caricamento per le sezioni che dipendono da fetch esterni
// (Jolpica API), usati come fallback dei relativi <Suspense>.

export function NextEventSkeleton() {
  return (
    <div
      className="mb-16 rounded-[32px] bg-[#0a0a0e] border border-white/10 p-8 lg:p-12 animate-pulse motion-reduce:animate-none"
      aria-hidden
    >
      <div className="h-8 w-64 bg-white/10 rounded mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-4">
          <div className="h-16 w-full bg-white/5 rounded-xl" />
          <div className="h-14 w-full bg-white/5 rounded-xl" />
          <div className="h-14 w-full bg-white/5 rounded-xl" />
        </div>
        <div className="h-40 w-full bg-white/5 rounded-2xl" />
      </div>
    </div>
  )
}
