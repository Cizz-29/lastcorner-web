import { NextResponse } from 'next/server'
import { getUltimiArticoli } from '@/lib/sanity/articles'
import { ULTIMI_DA_SERVIRE } from '@/lib/altriArticoli'

// Gli ultimi articoli pubblicati, per la colonna "Altri articoli" delle
// pagine articolo.
//
// Perche' una route a parte: le pagine articolo sono statiche e si rigenerano
// solo quando le modifichi o al deploy, quindi la lista scritta nel loro HTML
// si ferma a quel momento. Il browser, dopo aver caricato la pagina, chiede
// qui la lista aggiornata e sostituisce quella vecchia.
//
// Si aggiorna a tempo, al massimo una volta l'ora per tutto il sito e solo se
// qualcuno la chiede: un articolo nuovo compare nella colonna entro un'ora.
// (La home e la pagina categoria invece si aggiornano subito, dal webhook.)
//
// Perche' non dal webhook di Sanity: in Next 14 revalidatePath non raggiunge
// le route statiche come questa. Provato con next start il 27 settembre:
// dopo il webhook la pagina /formula-1 veniva riscritta, il file in cache di
// questa route restava quello della build. Sta sotto /api, che il middleware
// non tocca.
export const revalidate = 3600

export async function GET() {
  const articoli = await getUltimiArticoli(ULTIMI_DA_SERVIRE)
  // Solo i campi che la card mostra: niente tag, estratti o secondo ritaglio.
  return NextResponse.json(
    articoli.map(({ id, title, slug, category, author, date, imageUrl }) => ({
      id, title, slug, category, author, date, imageUrl,
    }))
  )
}
