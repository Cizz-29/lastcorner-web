// Stato di consenso cookie condiviso tra il banner e il resto del sito.
// Salvato in localStorage così la scelta dell'utente persiste tra le
// visite senza bisogno di un cookie tecnico dedicato al consenso stesso.

export interface CookieConsent {
  necessary: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

const STORAGE_KEY = 'lc-cookie-consent'
export const REOPEN_EVENT = 'lc-open-cookie-prefs'
// Emesso ogni volta che il consenso viene salvato (sia alla prima scelta
// che modificandolo dopo): permette a script di terze parti già montati
// (es. AdSense) di reagire subito, senza bisogno di un reload di pagina.
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

export function saveConsent(consent: Omit<CookieConsent, 'necessary' | 'updatedAt'>) {
  const value: CookieConsent = {
    necessary: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    updatedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: value }))
  return value
}

// Helper per il codice che in futuro caricherà script di terze parti
// (es. Google Analytics, AdSense): va richiamato prima di iniettare lo
// script, così i tracker non partono senza consenso.
export function hasConsent(category: 'analytics' | 'marketing'): boolean {
  const consent = getStoredConsent()
  return consent ? consent[category] : false
}
