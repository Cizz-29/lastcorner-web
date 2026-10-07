// Stato di consenso condiviso tra il banner e il resto del sito.
// Salvato in localStorage così la scelta dell'utente persiste tra le
// visite senza bisogno di un cookie tecnico dedicato al consenso stesso.
//
// Due categorie, entrambe per cose che il sito carica di propria iniziativa:
//
// - "marketing": gli embed di X e Instagram. Il nome della chiave resta
//   quello storico, cosi' le scelte gia' salvate nei browser dei lettori
//   continuano a essere lette.
// - "statistiche": Google Analytics 4 (dal 7 ottobre 2026, vedi
//   components/GoogleAnalytics.tsx). Senza consenso lo script non viene
//   nemmeno scaricato.
//
// La pubblicita' non passa di qui: il consenso lo raccoglie la CMP
// certificata di Google dentro lo script AdSense (vedi AdsenseScript.tsx).
// Vercel Web Analytics non usa cookie e non chiede consenso.
//
// VERSIONE_CONSENSO sale quando si aggiunge una finalita': chi aveva scelto
// prima rivede il banner una volta, con la sua scelta sugli embed gia'
// impostata, perche' su una finalita' nuova non si e' ancora espresso.

export interface CookieConsent {
  necessary: true
  marketing: boolean
  statistiche: boolean
  versione: number
  updatedAt: string
}

export type CategoriaConsenso = 'marketing' | 'statistiche'

const STORAGE_KEY = 'lc-cookie-consent'
export const VERSIONE_CONSENSO = 2
export const REOPEN_EVENT = 'lc-open-cookie-prefs'
// Emesso ogni volta che il consenso viene salvato (sia alla prima scelta
// che modificandolo dopo): permette agli script di terze parti già montati
// di reagire subito, senza bisogno di un reload di pagina.
export const CONSENT_CHANGED_EVENT = 'lc-cookie-consent-changed'

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const salvato = JSON.parse(raw) as Partial<CookieConsent>
    return {
      necessary: true,
      marketing: salvato.marketing === true,
      statistiche: salvato.statistiche === true,
      versione: typeof salvato.versione === 'number' ? salvato.versione : 1,
      updatedAt: salvato.updatedAt ?? '',
    }
  } catch {
    return null
  }
}

/** Vero se il banner va mostrato: nessuna scelta, o una scelta fatta prima
 *  che esistesse una delle finalita' attuali. */
export function sceltaDaChiedere(): boolean {
  const consenso = getStoredConsent()
  return !consenso || consenso.versione < VERSIONE_CONSENSO
}

export function saveConsent(consent: { marketing: boolean; statistiche: boolean }) {
  const value: CookieConsent = {
    necessary: true,
    marketing: consent.marketing,
    statistiche: consent.statistiche,
    versione: VERSIONE_CONSENSO,
    updatedAt: new Date().toISOString(),
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Navigazione privata con storage bloccato: la scelta vale per la pagina
    // aperta (l'evento sotto la comunica comunque), alla prossima si richiede.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }))
  return value
}

/** Va richiamato prima di iniettare uno script di terze parti, così non
 *  parte senza consenso. Una scelta di una versione precedente vale per
 *  le categorie che allora esistevano (gli embed), non per le nuove. */
export function hasConsent(category: CategoriaConsenso): boolean {
  const consent = getStoredConsent()
  if (!consent) return false
  if (category === 'statistiche' && consent.versione < VERSIONE_CONSENSO) return false
  return consent[category]
}
