import { createClient } from 'next-sanity'
import { projectId, dataset } from '@/sanity.config'

// Client di sola lettura per il sito pubblico. Non collegato ancora a
// nessuna pagina: verra' usato quando sostituiremo lib/mockData.ts,
// lib/driverBios.ts e lib/teamBios.ts con query reali.
export const sanityClient = createClient({
    projectId,
    dataset,
    apiVersion: '2025-01-01',
    useCdn: true,
})
