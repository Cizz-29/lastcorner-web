// CTA statica per la crescita del canale Instagram — nessuna chiamata
// esterna, solo un link diretto. Il numero di follower è passato come
// prop così è facile aggiornarlo senza toccare il markup.
export default function InstagramCTA({ followers = '35K' }: { followers?: string }) {
  return (
    <a
      href="https://www.instagram.com/lastcorner_net/"
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-lc-card rounded-card border border-white/10 p-5 hover:border-lc-red/40 transition-colors duration-200"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-lc-red/15 flex items-center justify-center shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-lc-red" aria-hidden="true">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-akira font-bold text-[12px] text-white">@lastcorner_net</p>
          <p className="font-montserrat text-[10px] text-lc-subtle">{followers} follower</p>
        </div>
      </div>
      <p className="font-montserrat text-[11px] text-lc-subtle mt-3 leading-relaxed">
        Contenuti quotidiani su F1 e motorsport, dietro le quinte e analisi rapide.
      </p>
      <span className="inline-block mt-3 font-akira text-[10px] text-lc-red uppercase tracking-wide group-hover:underline">
        Seguici su Instagram →
      </span>
    </a>
  )
}
