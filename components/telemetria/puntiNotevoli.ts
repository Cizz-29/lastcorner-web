// Punti notevoli di un giro: apici di curva e punte sui rettilinei.
//
// Servono a mettere sul grafico della velocita' i numeri che si leggono
// davvero — "qui tocca 341, qui scende a 73" — invece di lasciare al lettore
// il compito di stimarli a occhio dalla linea.
//
// Il metodo e' in due tempi, e l'ordine conta:
//
//   1. Le CURVE sono i minimi locali della velocita'. La prominenza (quanto
//      il minimo si stacca da cio' che gli sta intorno) si misura contro il
//      massimo entro una finestra di distanza fissa, NON risalendo il segnale
//      punto per punto: dentro una chicane ci sono due apici separati da una
//      gobba di pochi km/h, e risalendo il segnale il secondo apice — che e'
//      il punto piu' lento di tutto il giro — risulterebbe irrilevante.
//
//   2. I RETTILINEI sono, semplicemente, il punto piu' veloce fra due curve
//      consecutive. Cercarli come "massimi locali prominenti" non funziona:
//      in fondo a un rettilineo la velocita' e' quasi piatta e nessun punto
//      spicca abbastanza. Fra due curve, invece, di rettilineo ce n'e' uno
//      solo, e il suo massimo e' quello che interessa.

export type TipoPunto = 'curva' | 'rettilineo'

export interface PuntoNotevole {
  /** Distanza dal traguardo, in metri. */
  distanza: number
  /** Velocita' in quel punto, km/h. */
  velocita: number
  tipo: TipoPunto
}

/** Quanto lontano guardare per decidere se un minimo conta davvero (metri). */
const FINESTRA_M = 250
/** Di quanti km/h un apice deve staccarsi da cio' che ha intorno. */
const PROMINENZA_MIN = 30
/** Distanza minima fra due etichette, per non sovrapporle (metri). */
const SEPARAZIONE_M = 250
/** Di quanto la punta di un rettilineo deve superare le curve che lo delimitano. */
const RILIEVO_RETTILINEO = 15

function apiciDiCurva(speed: number[], distance: number[]): { i: number; distanza: number; velocita: number }[] {
  const n = speed.length
  const cand: { i: number; distanza: number; velocita: number; prominenza: number }[] = []

  for (let i = 1; i < n - 1; i++) {
    // Plateau: un minimo puo' essere ripetuto su piu' campioni uguali.
    let j = i
    while (j + 1 < n - 1 && speed[j + 1] === speed[i]) j++
    if (!(speed[i] < speed[i - 1] && speed[i] < speed[j + 1])) continue

    let a = i
    while (a > 0 && distance[i] - distance[a - 1] <= FINESTRA_M) a--
    let b = j
    while (b < n - 1 && distance[b + 1] - distance[i] <= FINESTRA_M) b++

    let maxSx = speed[i]
    for (let k = a; k <= i; k++) if (speed[k] > maxSx) maxSx = speed[k]
    let maxDx = speed[j]
    for (let k = j; k <= b; k++) if (speed[k] > maxDx) maxDx = speed[k]

    const prominenza = Math.min(maxSx, maxDx) - speed[i]
    if (prominenza >= PROMINENZA_MIN) {
      cand.push({ i, distanza: (distance[i] + distance[j]) / 2, velocita: speed[i], prominenza })
    }
  }

  // I piu' marcati per primi, poi si scarta chi cade troppo vicino a uno gia'
  // tenuto: cosi' fra due apici quasi sovrapposti resta quello che conta.
  cand.sort((x, y) => y.prominenza - x.prominenza)
  const tenuti: typeof cand = []
  for (const c of cand) {
    if (tenuti.every((t) => Math.abs(c.distanza - t.distanza) >= SEPARAZIONE_M)) tenuti.push(c)
  }
  tenuti.sort((x, y) => x.distanza - y.distanza)
  return tenuti.map(({ i, distanza, velocita }) => ({ i, distanza, velocita }))
}

export function puntiNotevoli(speed: number[], distance: number[]): PuntoNotevole[] {
  if (speed.length < 5) return []

  const curve = apiciDiCurva(speed, distance)
  const punti: PuntoNotevole[] = curve.map((c) => ({
    distanza: c.distanza,
    velocita: c.velocita,
    tipo: 'curva' as const,
  }))

  // Fra una curva e l'altra (e agli estremi del giro) c'e' un rettilineo:
  // se ne prende il punto piu' veloce.
  const bordi = [0, ...curve.map((c) => c.i), speed.length - 1]
  for (let k = 0; k < bordi.length - 1; k++) {
    const a = bordi[k]
    const b = bordi[k + 1]
    if (b - a < 3) continue
    let i = a
    for (let z = a; z <= b; z++) if (speed[z] > speed[i]) i = z
    if (speed[i] - Math.max(speed[a], speed[b]) < RILIEVO_RETTILINEO) continue
    punti.push({ distanza: distance[i], velocita: speed[i], tipo: 'rettilineo' })
  }

  punti.sort((x, y) => x.distanza - y.distanza)
  return punti
}
