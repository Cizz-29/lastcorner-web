'use client'

import { REOPEN_EVENT } from '@/lib/cookieConsent'

// Bottone che riapre il banner cookie per modificare le preferenze già
// salvate. Isolato in un piccolo componente client così il Footer può
// restare un Server Component.
export default function CookiePreferencesButton() {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event(REOPEN_EVENT))}
      className="font-montserrat text-[12px] text-lc-subtle hover:text-lc-red transition-colors duration-200 text-left"
    >
      Preferenze Cookie
    </button>
  )
}
