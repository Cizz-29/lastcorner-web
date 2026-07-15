'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '@/sanity.config'

// Monta lo Studio Sanity direttamente dentro il sito, su /studio - niente
// hosting separato da configurare: si accede con lo stesso account con cui
// e' stato creato il progetto Sanity.
export default function StudioPage() {
    return <NextStudio config={config} />
}
