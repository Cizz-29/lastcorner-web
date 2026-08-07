'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Generatore delle grafiche citazione per i social.
//
// Monta sempre gli stessi tre pezzi: la foto, il PNG della grafica fissa
// esportato da Photoshop e il testo. Nessuna immagine viene generata: le
// decorazioni sono quelle originali del template, l'unica cosa disegnata
// qui e' il testo.
//
// Gira interamente nel browser: la foto non viene caricata da nessuna
// parte, resta sul dispositivo. Nessun costo di server ne' di banda.

const W = 2080
const H = 2600

const ROSSO = '#FF4242'
const BIANCO = '#FFFFFF'

const TEMPLATE = '/grafiche/template-intervista.webp'
const FONT_TITOLO = '800 __PX__px "Akira Expanded"'

/** Nome reale della famiglia Montserrat caricata da next/font: e' generato
 *  a ogni build (tipo "__Montserrat_a1b2c3"), quindi non si puo' scrivere a
 *  mano. Lo si legge dal foglio di stile applicando la classe del sito a un
 *  elemento invisibile. */
function famigliaMontserrat(): string {
  const el = document.createElement('span')
  el.className = 'font-montserrat'
  el.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
  document.body.appendChild(el)
  const famiglia = getComputedStyle(el).fontFamily || 'sans-serif'
  el.remove()
  return famiglia
}

// Misure ricavate dal template Photoshop (2688x3360) e riportate su questa
// tela da 2080x2600. La linea bianca del template cade a y=2363.
const BOX_W = W - 180
const BOX_BOTTOM = 2290
const BOX_TOP_MIN = 1490
const MAX_RIGHE = 5
const ATTR_Y = 2410
const ATTR_DIM = 51 // 15,85 pt sul template a 300 dpi

// Il corpo e' piu' grande dell'interlinea: le righe si stringono fra loro.
const RAPPORTO_CORPO_INTERLINEA = 1.0659
// Crenatura Photoshop: l'unita' e' il millesimo di quadratone.
const TRACKING_EM = 0.025

// Il fondo della foto deve finire dentro la sfumatura scura del template,
// cosi' l'immagine sfuma senza mostrare lo stacco.
const FONDO_FOTO = 1850
const DISSOLVENZA = 200

// Preset Camera Raw di Francesco (Untitled.xmp). Nasce per file raw:
// applicato tale e quale a un JPEG gia' sviluppato brucia le alte luci,
// quindi i cursori vengono pesati con "forza".
const PRESET = {
  esposizione: 0.75,
  bianchi: 25,
  neri: -31,
  ombre: -16,
  chiarezza: 45,
  texture: 37,
  nitidezza: 31,
  vignettatura: -27,
}

type Tratto = { testo: string; colore: string }
type Parola = Tratto[]

// --------------------------------------------------------------- immagine

function srgbALineare(v: number) {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function lineareASrgb(v: number) {
  const x = Math.min(1, Math.max(0, v))
  return x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
}

/** Tabella di conversione tonale: si calcola una volta e si applica a tutti
 *  i pixel, invece di rifare i conti 5 milioni di volte. */
function tabellaTonale(forza: number) {
  const guadagno = Math.pow(2, PRESET.esposizione * forza)
  const nero = (-PRESET.neri / 100) * 0.12 * forza
  const bianco = (PRESET.bianchi / 100) * 0.06 * forza
  const tab = new Uint8ClampedArray(256)
  for (let i = 0; i < 256; i++) {
    let lin = srgbALineare(i / 255) * guadagno
    // Ginocchio morbido sulle alte luci: un JPEG non ha il margine di
    // recupero di un raw, senza questo le zone chiare si bruciano.
    if (lin > 0.8) lin = 0.8 + (lin - 0.8) / (1 + (lin - 0.8) * 3)
    let v = lineareASrgb(lin)
    v = (v - nero) / Math.max(1e-6, 1 - nero - bianco)
    v = Math.min(1, Math.max(0, v))
    const peso = Math.min(1, Math.max(0, 1 - v * 2)) // 1 sul nero, 0 a meta' scala
    v = v * (1 + (PRESET.ombre / 100) * 0.55 * forza * peso)
    tab[i] = Math.round(Math.min(1, Math.max(0, v)) * 255)
  }
  return tab
}

function sfocatura(sorgente: HTMLCanvasElement, raggio: number) {
  const c = document.createElement('canvas')
  c.width = sorgente.width
  c.height = sorgente.height
  const ctx = c.getContext('2d')!
  ctx.filter = `blur(${raggio}px)`
  ctx.drawImage(sorgente, 0, 0)
  return ctx.getImageData(0, 0, c.width, c.height)
}

/** Preset Camera Raw applicato alla foto gia' ritagliata. */
function trattaFoto(canvas: HTMLCanvasElement, forza: number) {
  const ctx = canvas.getContext('2d')!
  const { width: w, height: h } = canvas
  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data

  const tab = tabellaTonale(forza)
  for (let i = 0; i < d.length; i += 4) {
    d[i] = tab[d[i]]
    d[i + 1] = tab[d[i + 1]]
    d[i + 2] = tab[d[i + 2]]
  }

  // Vignettatura: scurisce progressivamente verso gli angoli.
  const vign = (PRESET.vignettatura / 100) * forza
  if (vign) {
    const cx = w / 2
    const cy = h / 2
    for (let y = 0; y < h; y++) {
      const dy = (y - cy) / cy
      for (let x = 0; x < w; x++) {
        const dx = (x - cx) / cx
        const r = Math.sqrt(dx * dx + dy * dy)
        const cad = Math.min(1, Math.max(0, (r - 0.55) / 0.85))
        const k = 1 + vign * cad * cad
        const i = (y * w + x) * 4
        d[i] *= k
        d[i + 1] *= k
        d[i + 2] *= k
      }
    }
  }
  ctx.putImageData(img, 0, 0)

  // Chiarezza (contrasto locale, raggio ampio), texture (dettaglio medio) e
  // nitidezza: tutte maschere di contrasto, cambia solo il raggio.
  const passaggi: Array<[number, number]> = [
    [28, (PRESET.chiarezza / 100) * forza * 1.1],
    [4, (PRESET.texture / 100) * forza * 1.1],
    [1, (PRESET.nitidezza / 100) * forza * 0.8],
  ]
  for (const [raggio, quantita] of passaggi) {
    if (quantita <= 0) continue
    const base = ctx.getImageData(0, 0, w, h)
    const sfocata = sfocatura(canvas, raggio)
    const b = base.data
    const s = sfocata.data
    for (let i = 0; i < b.length; i += 4) {
      b[i] += quantita * (b[i] - s[i])
      b[i + 1] += quantita * (b[i + 1] - s[i + 1])
      b[i + 2] += quantita * (b[i + 2] - s[i + 2])
    }
    ctx.putImageData(base, 0, 0)
  }
}

// ------------------------------------------------------------------ testo

/** "*rosso*" -> parole colorate. Ogni parola e' fatta di tratti, perche' la
 *  punteggiatura dopo un asterisco appartiene alla parola ma cambia colore:
 *  senza questo la virgola finirebbe staccata. */
function tokenizza(testo: string): Parola[] {
  let colore = BIANCO
  const parole: Parola[] = []
  let corrente: Parola = []
  let buf = ''

  const chiudiTratto = () => {
    if (buf) {
      corrente.push({ testo: buf, colore })
      buf = ''
    }
  }
  const chiudiParola = () => {
    chiudiTratto()
    if (corrente.length) {
      parole.push(corrente)
      corrente = []
    }
  }

  for (const ch of testo) {
    if (ch === '*') {
      chiudiTratto()
      colore = colore === BIANCO ? ROSSO : BIANCO
    } else if (/\s/.test(ch)) {
      chiudiParola()
    } else {
      buf += ch
    }
  }
  chiudiParola()
  return parole
}

function larghTesto(ctx: CanvasRenderingContext2D, testo: string, tracking: number) {
  let l = 0
  for (const c of testo) l += ctx.measureText(c).width + tracking
  return l
}

function scriviTesto(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  testo: string,
  colore: string,
  tracking: number
) {
  ctx.fillStyle = colore
  for (const c of testo) {
    ctx.fillText(c, x, y)
    x += ctx.measureText(c).width + tracking
  }
  return x
}

function larghParola(ctx: CanvasRenderingContext2D, parola: Parola, tracking: number) {
  return parola.reduce((s, t) => s + larghTesto(ctx, t.testo, tracking), 0)
}

function disponi(ctx: CanvasRenderingContext2D, parole: Parola[], tracking: number) {
  const spazio = ctx.measureText(' ').width + tracking
  const righe: Parola[][] = []
  let riga: Parola[] = []
  let larg = 0
  for (const parola of parole) {
    const w = larghParola(ctx, parola, tracking)
    const aggiunta = riga.length ? w + spazio : w
    if (riga.length && larg + aggiunta > BOX_W) {
      righe.push(riga)
      riga = [parola]
      larg = w
    } else {
      riga.push(parola)
      larg += aggiunta
    }
  }
  if (riga.length) righe.push(riga)
  return righe
}

function larghRiga(ctx: CanvasRenderingContext2D, riga: Parola[], tracking: number) {
  const spazio = ctx.measureText(' ').width + tracking
  return (
    riga.reduce((s, p) => s + larghParola(ctx, p, tracking), 0) + spazio * (riga.length - 1)
  )
}

/** corpoFisso a 0 = la dimensione la sceglie il programma; altrimenti si usa
 *  quella indicata. L'interlinea resta sempre legata al corpo dal rapporto
 *  del template, quindi non si puo' sbagliare. */
function scriviCitazione(ctx: CanvasRenderingContext2D, testo: string, corpoFisso: number) {
  const altezzaMax = BOX_BOTTOM - BOX_TOP_MIN

  // Se il testo contiene degli a-capo, le righe le decide l'autore e
  // vengono rispettate cosi' come sono. Altrimenti si va a capo da soli.
  const forzate = testo.split('\n').map((r) => r.trim()).filter(Boolean)
  const manuale = forzate.length > 1
  const parole = manuale ? [] : tokenizza(testo.toUpperCase())

  let dim = 40
  let righe: Parola[][] = []
  let tracking = 0
  const partenza = corpoFisso || 150
  for (dim = partenza; dim >= 40; dim -= 2) {
    ctx.font = FONT_TITOLO.replace('__PX__', String(dim))
    tracking = dim * TRACKING_EM
    const passo = Math.round(dim / RAPPORTO_CORPO_INTERLINEA)

    righe = manuale
      ? forzate.map((r) => tokenizza(r.toUpperCase()))
      : disponi(ctx, parole, tracking)

    // Con la dimensione scelta a mano si prende quella e basta: se il blocco
    // sfora, cresce verso l'alto ed e' una decisione di chi impagina.
    if (corpoFisso) break

    if (manuale) {
      if (!righe.some((r) => larghRiga(ctx, r, tracking) > BOX_W) && righe.length * passo <= altezzaMax) break
    } else if (righe.length <= MAX_RIGHE && righe.length * passo <= altezzaMax) {
      // Mai piu' di cinque righe: oltre, il blocco diventa un muro di testo.
      break
    }
  }

  ctx.font = FONT_TITOLO.replace('__PX__', String(dim))
  const passo = Math.round(dim / RAPPORTO_CORPO_INTERLINEA)
  const spazio = ctx.measureText(' ').width + tracking
  let y = BOX_BOTTOM - righe.length * passo
  for (const riga of righe) {
    let larghezza = riga.reduce((s, p) => s + larghParola(ctx, p, tracking), 0)
    larghezza += spazio * (riga.length - 1)
    let x = (W - larghezza) / 2
    for (const parola of riga) {
      for (const tratto of parola) {
        x = scriviTesto(ctx, x, y, tratto.testo, tratto.colore, tracking)
      }
      x += spazio
    }
    y += passo
  }
  return { dim, righe: righe.length }
}

function scriviAttribuzione(ctx: CanvasRenderingContext2D, testo: string, famiglia: string) {
  ctx.font = `500 ${ATTR_DIM}px ${famiglia}`
  const tracking = ATTR_DIM * TRACKING_EM
  const t = testo.toUpperCase()
  const larghezza = larghTesto(ctx, t, tracking) - tracking
  scriviTesto(ctx, (W - larghezza) / 2, ATTR_Y, t, BIANCO, tracking)
}

// ----------------------------------------------------------------- pagina

export default function GrafichePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [foto, setFoto] = useState<HTMLImageElement | null>(null)
  const [template, setTemplate] = useState<HTMLImageElement | null>(null)
  const [citazione, setCitazione] = useState(
    'Abbiamo portato *due grossi pacchetti di aggiornamenti*, ed *entrambi hanno funzionato*'
  )
  const [attribuzione, setAttribuzione] = useState('Loic Serra, DT Ferrari')
  const [zoom, setZoom] = useState(100)
  const [spostaX, setSpostaX] = useState(50)
  const [spostaY, setSpostaY] = useState(0)
  const [forza, setForza] = useState(50)
  const [corpo, setCorpo] = useState(0)
  const [pronto, setPronto] = useState(false)
  const [info, setInfo] = useState('')
  const [famiglia, setFamiglia] = useState('sans-serif')

  // Il template e i font vanno caricati prima di disegnare, altrimenti il
  // canvas ripiega su un carattere di sistema senza dirlo.
  useEffect(() => {
    const img = new Image()
    img.onload = () => setTemplate(img)
    img.src = TEMPLATE
    const montserrat = famigliaMontserrat()
    setFamiglia(montserrat)
    Promise.all([
      document.fonts.load('800 100px "Akira Expanded"'),
      document.fonts.load(`500 ${ATTR_DIM}px ${montserrat}`),
    ]).then(() => setPronto(true))
  }, [])

  const disegna = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !template || !pronto) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, W, H)

    if (foto) {
      const c = document.createElement('canvas')
      c.width = W
      c.height = FONDO_FOTO
      const cx = c.getContext('2d')!

      const base = Math.max(W / foto.width, FONDO_FOTO / foto.height)
      const scala = base * (zoom / 100)
      const larg = foto.width * scala
      const alt = foto.height * scala
      const x = (W - larg) * (spostaX / 100)
      const y = (FONDO_FOTO - alt) * (spostaY / 100)
      cx.drawImage(foto, x, y, larg, alt)

      trattaFoto(c, forza / 100)

      // Dissolvenza corta sul bordo inferiore: a quell'altezza il template
      // e' gia' quasi opaco, serve solo a non lasciare uno stacco netto.
      // "destination-out" cancella la foto dove il gradiente e' opaco, cioe'
      // solo verso il bordo inferiore. Con "destination-in" si cancellerebbe
      // invece tutto cio' che sta FUORI dal rettangolo, lasciando visibile
      // la sola striscia in fondo.
      const sfuma = cx.createLinearGradient(0, FONDO_FOTO - DISSOLVENZA, 0, FONDO_FOTO)
      sfuma.addColorStop(0, 'rgba(0,0,0,0)')
      sfuma.addColorStop(1, 'rgba(0,0,0,1)')
      cx.globalCompositeOperation = 'destination-out'
      cx.fillStyle = sfuma
      cx.fillRect(0, FONDO_FOTO - DISSOLVENZA, W, DISSOLVENZA)
      cx.globalCompositeOperation = 'source-over'

      ctx.drawImage(c, 0, 0)
    }

    ctx.drawImage(template, 0, 0, W, H)

    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'
    const esito = scriviCitazione(ctx, citazione, corpo)
    scriviAttribuzione(ctx, attribuzione, famiglia)
    setInfo(
      `corpo ${esito.dim}px · ${esito.righe} righe` +
        (esito.righe > MAX_RIGHE ? ` — oltre il limite di ${MAX_RIGHE}` : '')
    )
  }, [foto, template, pronto, citazione, attribuzione, zoom, spostaX, spostaY, forza, corpo, famiglia])

  useEffect(() => {
    disegna()
  }, [disegna])

  function scegliFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => setFoto(img)
    img.src = URL.createObjectURL(file)
  }

  function scarica() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `lastcorner-${Date.now()}.jpg`
        a.click()
        URL.revokeObjectURL(a.href)
      },
      'image/jpeg',
      0.92
    )
  }

  const etichetta = 'font-montserrat text-[11px] uppercase tracking-widest text-lc-subtle'
  const campo =
    'w-full bg-lc-card border border-white/10 rounded-card-sm px-3 py-2 font-montserrat text-[14px] text-white focus:outline-none focus:border-lc-red'

  return (
    <div className="min-h-screen bg-lc-bg px-4 py-8 lg:px-10">
      <h1 className="font-akira text-[18px] text-white uppercase tracking-widest mb-6">
        Grafiche citazione
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 max-w-[1400px]">
        <div className="flex flex-col gap-5">
          <div>
            <label className={etichetta}>Foto</label>
            <input type="file" accept="image/*" onChange={scegliFoto} className={`${campo} mt-2`} />
          </div>

          <div>
            <label className={etichetta}>Citazione</label>
            <textarea
              rows={4}
              value={citazione}
              onChange={(e) => setCitazione(e.target.value)}
              className={`${campo} mt-2 resize-y`}
            />
            <p className="font-montserrat text-[11px] text-lc-subtle mt-1">
              Metti fra asterischi le parti da evidenziare in rosso: *così*. Vai a capo per
              decidere tu la divisione in righe, altrimenti la calcolo io. Massimo cinque.
            </p>
          </div>

          <div>
            <label className={etichetta}>Attribuzione</label>
            <input
              value={attribuzione}
              onChange={(e) => setAttribuzione(e.target.value)}
              className={`${campo} mt-2`}
            />
          </div>

          <div>
            <label className={etichetta}>
              Dimensione testo — {corpo === 0 ? 'automatica' : `${corpo}px`}
            </label>
            <input
              type="range"
              min={0}
              max={150}
              step={2}
              value={corpo}
              onChange={(e) => setCorpo(Number(e.target.value))}
              className="w-full mt-2 accent-lc-red"
            />
            <p className="font-montserrat text-[11px] text-lc-subtle mt-1">
              A zero la calcolo io. L&apos;interlinea segue sempre il corpo.
            </p>
          </div>

          {([
            ['Ingrandimento', zoom, setZoom, 100, 300],
            ['Sposta orizzontale', spostaX, setSpostaX, 0, 100],
            ['Sposta verticale', spostaY, setSpostaY, 0, 100],
            ['Forza trattamento', forza, setForza, 0, 100],
          ] as Array<[string, number, (v: number) => void, number, number]>).map(
            ([nome, valore, imposta, min, max]) => (
              <div key={nome}>
                <label className={etichetta}>
                  {nome} — {valore}
                </label>
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={valore}
                  onChange={(e) => imposta(Number(e.target.value))}
                  className="w-full mt-2 accent-lc-red"
                />
              </div>
            )
          )}

          <button
            onClick={scarica}
            className="bg-lc-red text-white font-akira text-[12px] uppercase tracking-widest py-3 rounded-card-sm hover:opacity-90 transition-opacity"
          >
            Scarica JPG
          </button>
          <p className="font-montserrat text-[11px] text-lc-subtle">
            {pronto ? info : 'Caratteri in caricamento…'}
          </p>
        </div>

        <div>
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="w-full max-w-[520px] h-auto rounded-card border border-white/10"
          />
        </div>
      </div>
    </div>
  )
}
