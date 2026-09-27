// Forma dei dati che /api/classifica-f1 restituisce al widget in sidebar.
// Sta qui, e non nel file della route, perche' la usa anche il componente del
// browser: cosi' non deve importare niente da un file che vive sul server.
export interface ClassificaF1 {
  stagione: number
  piloti: { posizione: string; id: string; cognome: string; team: string; punti: string }[]
  costruttori: { posizione: string; id: string; nome: string; punti: string }[]
}
