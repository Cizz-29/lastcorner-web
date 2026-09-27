// Quanti articoli mostra la colonna "Altri articoli" di una pagina articolo.
export const ALTRI_ARTICOLI = 5

// Quanti ne serve /api/ultimi-articoli: uno in piu', perche' dalla lista si
// toglie l'articolo che si sta leggendo, se e' fra gli ultimi.
export const ULTIMI_DA_SERVIRE = ALTRI_ARTICOLI + 1
