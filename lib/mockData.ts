import { type Article } from '@/components/ArticleCard'

// Immagine placeholder motorsport (sostituita da Sanity in produzione)
const PLACEHOLDER = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'
const PLACEHOLDER_2 = 'https://images.unsplash.com/photo-1541447270886-5b0a95c8f8ea?w=800&q=80'
const PLACEHOLDER_3 = 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80'

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
]
