import { sanityClient } from '@/lib/sanity/client'

// Testi biografici dei piloti. Prima si controlla Sanity (documento
// driverBio con lo stesso driverId), poi il fallback statico qui sotto,
// poi il placeholder generico. Così i piloti già scritti a mano restano
// visibili anche prima che qualcuno li ricrei nello Studio.
const PLACEHOLDER =
    'La biografia di questo pilota sarà pubblicata a breve. Torna a trovarci per scoprire il suo percorso in Formula 1.'

export const DRIVER_BIOS: Record<string, string> = {
    hamilton: `Lewis Hamilton è uno dei piloti più vincenti nella storia della Formula 1: sette titoli mondiali conquistati tra il 2008 e il 2020, in coppia con McLaren prima e Mercedes poi, e il record assoluto di vittorie e pole position della categoria. Dopo oltre un decennio da protagonista assoluto del Mondiale, nel 2025 ha scelto una svolta clamorosa nella sua carriera firmando per la Ferrari, coronando un sogno inseguito fin da bambino e aprendo uno dei capitoli più attesi della sua storia sportiva. Conosciuto tanto per l'aggressività in pista quanto per l'impegno fuori, Hamilton resta un punto di riferimento assoluto per una generazione di piloti e per il pubblico della Formula 1 in tutto il mondo.`,
}

export async function getDriverBio(driverId: string): Promise<string> {
    try {
          const doc = await sanityClient.fetch<{ bio: string } | null>(
                  `*[_type == "driverBio" && lower(driverId) == $id][0]{ bio }`,
            { id: driverId.toLowerCase() }
                )
          if (doc?.bio) return doc.bio
    } catch {
          // Sanity irraggiungibile o non ancora configurato: si passa al fallback statico.
    }
    return DRIVER_BIOS[driverId] ?? PLACEHOLDER
}
