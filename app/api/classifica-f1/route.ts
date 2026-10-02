import { NextResponse } from 'next/server'
import { getAllStandings } from '@/lib/f1api'
import type { ClassificaF1 } from '@/lib/classificaF1'

// Classifica F1 per il widget in sidebar: i primi cinque piloti e i primi
// cinque costruttori, nel formato minimo che il widget mostra.
//
// Perche' sta in una route a parte invece che dentro le pagine.
//
// Il widget chiedeva i dati a Jolpica direttamente dal server, con
// aggiornamento ogni ora. In Next 14 una pagina si rigenera con la frequenza
// PIU' ALTA fra quella che dichiara e quella dei fetch che contiene: il
// "revalidate = false" degli articoli veniva scavalcato in silenzio, e ogni
// articolo di Formula 1 (quasi cinquecento) tornava a essere ricalcolato da
// capo alla prima visita dopo un'ora — bastava il passaggio di un crawler.
// Lo si legge nel manifest della build: 478 articoli F1 a 3600 secondi, quelli
// di F2, F3 e WRC, che il widget non ce l'hanno, a "mai".
//
// Qui la classifica si aggiorna ogni 12 ore (e a ogni deploy, che dopo ogni
// gara arriva dal workflow delle statistiche: vedi lib/f1api.ts), una volta
// sola per tutto il sito. Le pagine tornano statiche davvero e il widget la chiede dal
// browser. Sta sotto /api, che il middleware non tocca.
export const revalidate = 43200

export async function GET() {
  const { drivers, constructors } = await getAllStandings()

  const corpo: ClassificaF1 = {
    // L'anno si calcola qui e non nel browser: arriva insieme ai dati a cui
    // si riferisce, e si aggiorna con loro.
    stagione: new Date().getFullYear(),
    piloti: drivers.slice(0, 5).map((d) => ({
      posizione: d.position,
      id: d.Driver.driverId,
      cognome: d.Driver.familyName,
      team: d.Constructors[0]?.name ?? '',
      punti: d.points,
    })),
    costruttori: constructors.slice(0, 5).map((c) => ({
      posizione: c.position,
      id: c.Constructor.constructorId,
      nome: c.Constructor.name,
      punti: c.points,
    })),
  }

  return NextResponse.json(corpo)
}
