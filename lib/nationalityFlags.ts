// Mappa nazionalità (formato Ergast/Jolpica, es. "Italian", "British") →
// codice paese ISO 3166-1 alpha-2, usato per le bandiere di flagcdn.com.
// Copre le nazionalità della griglia F1 2026 più qualche altra ricorrente
// nel motorsport, per restare valida anche ai futuri cambi di line-up.
const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  Italian: 'it',
  British: 'gb',
  Dutch: 'nl',
  Monegasque: 'mc',
  Austrian: 'at',
  French: 'fr',
  American: 'us',
  German: 'de',
  Spanish: 'es',
  Argentine: 'ar',
  Brazilian: 'br',
  Thai: 'th',
  'New Zealander': 'nz',
  Mexican: 'mx',
  Canadian: 'ca',
  Finnish: 'fi',
  Australian: 'au',
  Belgian: 'be',
  Danish: 'dk',
  Japanese: 'jp',
  Chinese: 'cn',
  Indian: 'in',
  Swiss: 'ch',
  Polish: 'pl',
  Russian: 'ru',
  Indonesian: 'id',
  Swedish: 'se',
  Portuguese: 'pt',
  Irish: 'ie',
  Paraguayan: 'py',
  Bulgarian: 'bg',
  Colombian: 'co',
  Norwegian: 'no',
  Singaporean: 'sg',
  'South Korean': 'kr',
  Emirati: 'ae',
}

export function getFlagUrl(nationality: string, size: 'w40' | 'w80' = 'w40'): string | null {
  const code = NATIONALITY_TO_COUNTRY[nationality]
  return code ? `https://flagcdn.com/${size}/${code}.png` : null
}
