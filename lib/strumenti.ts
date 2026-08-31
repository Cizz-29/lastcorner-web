// Interruttore degli strumenti di redazione (telemetria e generatore grafiche).
//
// Sono strumenti interni: non erano linkati da nessuna parte del sito ed
// erano protetti da password, ma vivevano comunque sul sito pubblicato.
// Adesso girano sul PC, dove i dati stanno gia' su disco e non serve
// caricarli da nessuna parte.
//
// Il valore si legge una volta sola quando il sito viene compilato:
//   - in locale il file .env.local mette STRUMENTI_LOCALI=true, e le pagine
//     esistono;
//   - su Vercel la variabile non c'e', quindi le pagine rispondono 404 e non
//     finiscono nemmeno nel sito compilato.
//
// Per riattivarli online basterebbe aggiungere la variabile su Vercel: non
// c'e' niente di distrutto, solo spento.
export const STRUMENTI_LOCALI = process.env.STRUMENTI_LOCALI === 'true'
