// Il nome del Gran Premio in italiano. FastF1 lo da' in inglese
// ("Azerbaijan Grand Prix"): nei titoli e nei risultati di Google serve come
// lo cerca la gente, "GP dell'Azerbaijan".
const NOMI: [string, string][] = [
  // Prima di "bahrain": nel 2026 il GP del Bahrain si corre a Sepang.
  ['in malaysia', 'GP del Bahrain a Sepang'],
  ['australian', "GP d'Australia"],
  ['chinese', 'GP di Cina'],
  ['japanese', 'GP del Giappone'],
  ['bahrain', 'GP del Bahrain'],
  ['saudi', "GP dell'Arabia Saudita"],
  ['miami', 'GP di Miami'],
  ['canadian', 'GP del Canada'],
  ['monaco', 'GP di Monaco'],
  ['barcelona', 'GP di Barcellona'],
  ['austrian', "GP d'Austria"],
  ['british', 'GP di Gran Bretagna'],
  ['belgian', 'GP del Belgio'],
  ['hungarian', "GP d'Ungheria"],
  ['dutch', "GP d'Olanda"],
  ['italian', "GP d'Italia"],
  ['emilia', "GP dell'Emilia-Romagna"],
  ['spanish', 'GP di Spagna'],
  ['azerbaijan', "GP dell'Azerbaijan"],
  ['singapore', 'GP di Singapore'],
  ['united states', 'GP degli Stati Uniti'],
  ['mexico', 'GP del Messico'],
  ['mexican', 'GP del Messico'],
  ['paulo', 'GP del Brasile'],
  ['brazil', 'GP del Brasile'],
  ['las vegas', 'GP di Las Vegas'],
  ['qatar', 'GP del Qatar'],
  ['abu dhabi', 'GP di Abu Dhabi'],
  ['malaysia', 'GP della Malesia'],
  // Gran Premi del passato: servono alle statistiche di carriera ("la prima
  // vittoria al GP di Germania 2008").
  ['german', 'GP di Germania'],
  ['french', 'GP di Francia'],
  ['portuguese', 'GP del Portogallo'],
  ['turkish', 'GP di Turchia'],
  ['russian', 'GP di Russia'],
  ['korean', 'GP di Corea'],
  ['indian', "GP dell'India"],
  ['styrian', 'GP di Stiria'],
  ['70th anniversary', 'GP del 70° anniversario'],
  ['tuscan', 'GP di Toscana'],
  ['eifel', "GP dell'Eifel"],
  ['sakhir', 'GP di Sakhir'],
  ['european', "GP d'Europa"],
  ['san marino', 'GP di San Marino'],
  ['pacific', 'GP del Pacifico'],
  ['argentine', 'GP di Argentina'],
  ['south african', 'GP del Sudafrica'],
  ['swedish', 'GP di Svezia'],
  ['swiss', 'GP di Svizzera'],
  ['luxembourg', 'GP del Lussemburgo'],
  ['detroit', 'GP di Detroit'],
  ['dallas', 'GP di Dallas'],
  ['caesars palace', 'GP del Caesars Palace'],
  ['moroccan', 'GP del Marocco'],
  ['pescara', 'GP di Pescara'],
  ['indianapolis', '500 Miglia di Indianapolis'],
]

export function nomeGp(nome: string): string {
  const n = nome.toLowerCase()
  return NOMI.find(([chiave]) => n.includes(chiave))?.[1] ?? nome.replace(/ Grand Prix$/i, '').replace(/^/, 'GP ')
}
