// Esportazione di un grafico telemetria come immagine PNG.
//
// Vive in un file suo perche' la usano sia il confronto qualifica sia il passo
// gara: sono due grafici diversi, ma il modo di trasformarli in immagine e'
// lo stesso, e una seconda copia sarebbe una seconda copia da correggere.

/** Famiglia di caratteri realmente in uso, letta dalla pagina.
 *  next/font genera nomi con un suffisso casuale a ogni build, quindi scrivere
 *  "Montserrat" nel canvas non basterebbe: si chiede al browser quale famiglia
 *  sta effettivamente applicando a quell'elemento. */
export function famigliaDi(el: Element | null): string {
  if (!el) return 'system-ui, sans-serif'
  return getComputedStyle(el).fontFamily || 'system-ui, sans-serif'
}

export interface Annotazione {
  /** Posizione lungo il giro, da 0 (traguardo) a 1 (traguardo successivo). */
  frazione: number
  /** Altezza nel grafico, in pixel dell'altezza a schermo. */
  y: number
  /** Sopra il punto per i massimi, sotto per i minimi. */
  sopra: boolean
  righe: { testo: string; colore: string }[]
}

export interface VoceLegenda {
  abbr: string
  color: string
}

/** Salva il grafico come PNG.
 *
 *  Il grafico sullo schermo e' fatto di due pezzi: l'SVG con le tracce e, fuori
 *  da esso, le etichette dell'asse in HTML. Un'esportazione del solo SVG
 *  perderebbe i numeri sull'asse, cioe' la parte che rende leggibile
 *  l'immagine. Qui si disegna tutto su una tela: sfondo, titolo, etichette,
 *  tracce (rasterizzando l'SVG) e legenda con le sigle dei piloti.
 *
 *  L'immagine esce a larghezza fissa, quindi identica indipendentemente da
 *  quanto e' larga la finestra al momento del clic.
 */
export async function esportaPng(opts: {
  svg: SVGSVGElement | null
  titolo: string
  unita: string
  etichette: { testo: string; y: number }[]
  /** Etichette sopra il grafico (velocita' minime/massime): x e y sono in
   *  coordinate del grafico a schermo, quindi vanno riscalate. */
  annotazioni?: Annotazione[]
  larghezzaSchermo?: number
  altezzaGrafico: number
  legenda: VoceLegenda[]
  nomeFile: string
  fontTitolo: Element | null
  fontTesto: Element | null
}) {
  const { svg, titolo, unita, etichette, altezzaGrafico, legenda, nomeFile } = opts
  const annotazioni = opts.annotazioni ?? []
  if (!svg) return

  const LARGHEZZA_GRAFICO = 1600
  const MARGINE = 28
  const COL_ASSE = 64
  const ALT_TITOLO = 34
  const ALT_LEGENDA = legenda.length > 0 ? 34 : 0
  const SCALA = 2 // il doppio dei pixel: nitido anche ingrandito

  const larghezza = MARGINE * 2 + COL_ASSE + LARGHEZZA_GRAFICO
  const altezza = MARGINE * 2 + ALT_TITOLO + altezzaGrafico + ALT_LEGENDA

  // L'SVG va serializzato con misure esplicite: sulla pagina e' stirato dal
  // CSS, e senza width/height il browser non saprebbe a che dimensione
  // rasterizzarlo.
  const copia = svg.cloneNode(true) as SVGSVGElement
  // Fuori dalla pagina le classi Tailwind non esistono e lo stile inline
  // potrebbe litigare con le misure che imposto qui sotto: si tolgono.
  copia.removeAttribute('class')
  copia.removeAttribute('style')
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  copia.setAttribute('width', String(LARGHEZZA_GRAFICO))
  copia.setAttribute('height', String(altezzaGrafico))
  const testo = new XMLSerializer().serializeToString(copia)
  // encodeURIComponent e non btoa: btoa esplode sui caratteri non ASCII.
  const sorgente = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(testo)}`

  const img = new Image()
  await new Promise<void>((risolvi, rifiuta) => {
    img.onload = () => risolvi()
    img.onerror = () => rifiuta(new Error('rasterizzazione fallita'))
    img.src = sorgente
  })

  const tela = document.createElement('canvas')
  tela.width = larghezza * SCALA
  tela.height = altezza * SCALA
  const ctx = tela.getContext('2d')
  if (!ctx) return
  ctx.scale(SCALA, SCALA)

  const famigliaTitolo = famigliaDi(opts.fontTitolo)
  const famigliaTesto = famigliaDi(opts.fontTesto)

  // Sfondo: lo stesso del sito, cosi' l'immagine si incolla in un articolo
  // senza stonare.
  ctx.fillStyle = '#0A0A0A'
  ctx.fillRect(0, 0, larghezza, altezza)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = `700 17px ${famigliaTitolo}`
  ctx.textBaseline = 'middle'
  const yTitolo = MARGINE + ALT_TITOLO / 2 - 6
  ctx.fillText(titolo.toUpperCase(), MARGINE, yTitolo)
  const largTitolo = ctx.measureText(titolo.toUpperCase()).width
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `500 14px ${famigliaTesto}`
  ctx.fillText(`(${unita})`, MARGINE + largTitolo + 10, yTitolo)

  const yGrafico = MARGINE + ALT_TITOLO
  const xGrafico = MARGINE + COL_ASSE

  // Riquadro attorno alle tracce, come sullo schermo.
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 1
  ctx.strokeRect(xGrafico + 0.5, yGrafico + 0.5, LARGHEZZA_GRAFICO - 1, altezzaGrafico - 1)

  ctx.drawImage(img, xGrafico, yGrafico, LARGHEZZA_GRAFICO, altezzaGrafico)

  // Annotazioni (velocita' di punta e minime). Le y arrivano in pixel di
  // schermo: qui il grafico e' alto uguale ma largo LARGHEZZA_GRAFICO, quindi
  // la y si usa cosi' com'e' e solo la x va riscalata.
  if (annotazioni.length > 0) {
    const ALT_RIGA = 15
    ctx.textAlign = 'center'
    for (const a of annotazioni) {
      const x = xGrafico + a.frazione * LARGHEZZA_GRAFICO
      const yPunto = yGrafico + a.y
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, yPunto)
      ctx.lineTo(x, yPunto + (a.sopra ? -8 : 8))
      ctx.stroke()
      a.righe.forEach((r, i) => {
        ctx.font = `700 13px ${famigliaTesto}`
        ctx.fillStyle = r.colore
        const y = a.sopra
          ? yPunto - 12 - (a.righe.length - 1 - i) * ALT_RIGA
          : yPunto + 22 + i * ALT_RIGA
        ctx.fillText(r.testo, x, y)
      })
    }
    ctx.textAlign = 'left'
  }

  // Etichette dell'asse, alle stesse altezze che hanno sullo schermo.
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `500 13px ${famigliaTesto}`
  ctx.textAlign = 'right'
  for (const e of etichette) {
    ctx.fillText(e.testo, xGrafico - 12, yGrafico + e.y)
  }
  ctx.textAlign = 'left'

  // Legenda: senza, un'immagine con quattro tracce non dice chi e' chi.
  if (legenda.length > 0) {
    let x = xGrafico
    const yLeg = yGrafico + altezzaGrafico + ALT_LEGENDA / 2 + 2
    ctx.font = `700 14px ${famigliaTitolo}`
    for (const v of legenda) {
      ctx.strokeStyle = v.color
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(x, yLeg)
      ctx.lineTo(x + 26, yLeg)
      ctx.stroke()
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(v.abbr, x + 34, yLeg)
      x += 34 + ctx.measureText(v.abbr).width + 26
    }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.30)'
  ctx.font = `500 12px ${famigliaTesto}`
  ctx.textAlign = 'right'
  ctx.fillText('lastcorner.net', larghezza - MARGINE, altezza - MARGINE / 2)

  await new Promise<void>((risolvi) => {
    tela.toBlob((blob) => {
      if (!blob) return risolvi()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeFile
      a.click()
      URL.revokeObjectURL(url)
      risolvi()
    }, 'image/png')
  })
}
