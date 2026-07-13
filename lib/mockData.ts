import { type Article } from '@/components/ArticleCard'

// Immagine placeholder motorsport (sostituita da Sanity in produzione)
const PLACEHOLDER = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'
const PLACEHOLDER_2 = 'https://images.unsplash.com/photo-1541447270886-5b0a95c8f8ea?w=800&q=80'
const PLACEHOLDER_3 = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80'

// Articoli mostrati in hero + "Le ultime news"
export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'Camara sull\'annuncio di Haas: "Contento di prendere il posto ad Ocon"',
    slug: 'formula-1/camara-haas-ocon',
    category: 'Formula 1',
    author: 'Francesco Di Blasi',
    date: '28 maggio',
    imageUrl: PLACEHOLDER,
    breaking: true,
  },
  {
    id: '2',
    title: 'Hamilton alla Ferrari: le prime impressioni dopo i test di Barcellona',
    slug: 'formula-1/hamilton-ferrari-barcellona',
    category: 'Formula 1',
    author: 'Redazione',
    date: '27 maggio',
    imageUrl: PLACEHOLDER_2,
    breaking: true,
  },
  {
    id: '3',
    title: 'Verstappen: "La Red Bull ha ancora margine di sviluppo"',
    slug: 'formula-1/verstappen-red-bull-sviluppo',
    category: 'Formula 1',
    author: 'Luca Rossi',
    date: '26 maggio',
    imageUrl: PLACEHOLDER_3,
  },
  {
    id: '4',
    title: 'WEC Le Mans: Ferrari in pole position con la 499P',
    slug: 'wec/ferrari-le-mans-pole',
    category: 'WEC',
    author: 'Marco Bianchi',
    date: '25 maggio',
    imageUrl: PLACEHOLDER,
  },
  {
    id: '5',
    title: 'Formula 2: Antonelli domina in qualifica a Monaco',
    slug: 'formula-2/antonelli-monaco-qualifica',
    category: 'Formula 2',
    author: 'Francesco Di Blasi',
    date: '24 maggio',
    imageUrl: PLACEHOLDER_2,
  },
  {
    id: '6',
    title: 'Norris: "McLaren è pronta a lottare per il titolo fino alla fine"',
    slug: 'formula-1/norris-mclaren-titolo',
    category: 'Formula 1',
    author: 'Luca Rossi',
    date: '23 maggio',
    imageUrl: PLACEHOLDER_3,
  },
  {
    id: '11',
    title: 'Leclerc: "Il passo gara della Ferrari è cresciuto molto nelle ultime settimane"',
    slug: 'formula-1/leclerc-passo-gara-ferrari',
    category: 'Formula 1',
    author: 'Redazione',
    date: '22 maggio',
    imageUrl: PLACEHOLDER,
  },
  {
    id: '12',
    title: 'Russell: "Mercedes può ancora giocarsi il mondiale costruttori"',
    slug: 'formula-1/russell-mercedes-mondiale-costruttori',
    category: 'Formula 1',
    author: 'Marco Bianchi',
    date: '21 maggio',
    imageUrl: PLACEHOLDER_2,
  },
]

// Articoli aggiuntivi per la sezione "Altre News" — non compaiono in
// hero/"Le ultime news", così la sezione mostra contenuti diversi.
// Da sostituire con la query Sanity reale quando il CMS sarà collegato.
export const MOCK_OTHER_ARTICLES: Article[] = [
  {
    id: '7',
    title: 'WRC Rally Italia Sardegna: doppietta Toyota, ordine ribaltato nel finale',
    slug: 'wrc/rally-italia-sardegna-toyota',
    category: 'WRC',
    author: 'Marco Bianchi',
    date: '22 maggio',
    imageUrl: PLACEHOLDER_3,
  },
  {
    id: '8',
    title: 'Formula 3: pole position per il rookie italiano a Barcellona',
    slug: 'formula-3/pole-rookie-italiano-barcellona',
    category: 'Formula 3',
    author: 'Redazione',
    date: '21 maggio',
    imageUrl: PLACEHOLDER,
  },
  {
    id: '9',
    title: 'Mercedes annuncia il rinnovo dello sponsor titolo per il 2026',
    slug: 'formula-1/mercedes-rinnovo-sponsor-2026',
    category: 'Formula 1',
    author: 'Francesco Di Blasi',
    date: '20 maggio',
    imageUrl: PLACEHOLDER_2,
  },
  {
    id: '10',
    title: 'MotoGP a Barcellona: analisi del weekend e classifica aggiornata',
    slug: 'altro/motogp-barcellona-analisi',
    category: 'Altro',
    author: 'Luca Rossi',
    date: '19 maggio',
    imageUrl: PLACEHOLDER_3,
  },
  {
    id: '13',
    title: 'WEC: Toyota risponde a Ferrari nei test privati di Portimao',
    slug: 'wec/toyota-test-portimao',
    category: 'WEC',
    author: 'Marco Bianchi',
    date: '18 maggio',
    imageUrl: PLACEHOLDER,
  },
  {
    id: '14',
    title: 'Formula 2: cambio di rotta tecnico per il team Prema in vista di Barcellona',
    slug: 'formula-2/prema-cambio-tecnico-barcellona',
    category: 'Formula 2',
    author: 'Francesco Di Blasi',
    date: '17 maggio',
    imageUrl: PLACEHOLDER_2,
  },
  {
    id: '15',
    title: 'WRC: la Hyundai presenta gli aggiornamenti in vista del Rally di Sardegna',
    slug: 'wrc/hyundai-aggiornamenti-sardegna',
    category: 'WRC',
    author: 'Redazione',
    date: '16 maggio',
    imageUrl: PLACEHOLDER_3,
  },
]
