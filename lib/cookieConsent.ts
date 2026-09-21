// Stato di consenso condiviso tra il banner e il resto del sito.
// Salvato in localStorage così la scelta dell'utente persiste tra le
// visite senza bisogno di un cookie tecnico dedicato al consenso stesso.
//
// Una categoria sola, e vale la pena spiegare perché.
//
// Prima ce n'erano due, "analytics" e "marketing". La prima non accendeva
// nulla: l'unica statistica del sito è Vercel Web Analytics, che sta nel
// layout, non usa cookie e non richiede consenso — quindi l'interruttore
// chiedeva il permesso per qualcosa che non esisteva. La seconda governava
// sia AdSense sia gli embed social; da quando il consenso pubblicitario lo
// raccoglie la CMP certificata di Google (vedi AdsenseScript.tsx), qui
// resta il solo caso degli embed di X e Instagram, che il sito carica di
// propria iniziativa e per cui questo banner è l'unico posto dove chiedere.
//
// Il nome della chiave resta "marketing": le scelte già salvate nei browser
// dei lettori continuano a essere lette senza doverle azzerare.

export interface CookieConsent {
  necessary: true
  marketing: boolean
  updatedAt: string
}

const STORAGE_KEY = 'lc-cookie-consent'
export const REOPEN_EVENT = 'lc-open-cookie-prefs'
// Emesso ogni volta che il consenso viene salvato (sia alla prima scelta
// che modificandolo dopo): permette agli script di terze parti già montati
// di reagire subito, senza bisogno di un reload di pagina.
export const CONSENT_CHANGED_EVENT = 'lc-cookie-consent-changed'

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as CookieConsent) : null
  } catch {
    return null
  }
}

export function saveConsent(consent: { marketing: boolean }) {
  const value: CookieConsent = {
    necessary: true,
    marketing: consent.marketing,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }))
  return value
}

/** Va richiamato prima di iniettare uno script di terze parti, così non
 *  parte senza consenso. */
export function hasConsent(category: 'marketing'): boolean {
  const consent = getStoredConsent()
  return consent ? consent[category] : false
}
