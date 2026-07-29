import { defineField, defineType } from 'sanity'

// Categorie del sito — tenute in sync a mano con lib/categories.ts finche'
// non collega direttamente lo schema a quella lista in fase di integrazione.
const CATEGORY_OPTIONS = ['Formula 1', 'Formula 2', 'Formula 3', 'F1 Academy', 'WRC', 'Altro']

// Sotto-categorie: F1 e WRC hanno il set completo (come sul vecchio sito),
// tutte le altre categorie solo News e Rubriche. Il menu a tendina mostra
// sempre tutte le opzioni (Sanity non supporta liste condizionali native),
// ma la validazione sotto blocca la scelta sbagliata per la categoria.
const SUBCATEGORY_OPTIONS = [
  { title: 'News', value: 'news' },
  { title: 'Editoriali', value: 'editoriali' },
  { title: 'Analisi Tecnica', value: 'analisi-tecnica' },
  { title: 'Guide e Approfondimenti', value: 'guide-approfondimenti' },
  { title: 'Rubriche', value: 'rubriche' },
  { title: 'Classifiche', value: 'classifiche' },
]
const CATEGORIES_WITH_FULL_SUBCATEGORIES = ['Formula 1', 'WRC']
const LIMITED_SUBCATEGORY_VALUES = ['news', 'rubriche']

export default defineType({
  name: 'article',
  title: 'Articolo',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'Parte finale del link, es. "camara-haas-ocon". Generato dal titolo, modificabile.',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      options: { list: CATEGORY_OPTIONS },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'subcategory',
      title: 'Sotto-categoria',
      type: 'string',
      description:
        'Opzionale. "Classifiche" fa comparire l\'articolo nella pagina Classifica come recap di fine weekend. ' +
        'Per Formula 1 e WRC sono disponibili tutte le sotto-categorie; per le altre categorie solo News e Rubriche.',
      options: { list: SUBCATEGORY_OPTIONS },
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (!value) return true
          const category = (context.document as { category?: string } | undefined)?.category
          if (category && CATEGORIES_WITH_FULL_SUBCATEGORIES.includes(category)) return true
          if (LIMITED_SUBCATEGORY_VALUES.includes(value as string)) return true
          return `Per "${category ?? 'questa categoria'}" la sotto-categoria può essere solo News o Rubriche`
        }),
    }),
    defineField({
      name: 'author',
      title: 'Autore',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: 'Data pubblicazione',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'mainImage',
      title: 'Immagine principale',
      type: 'image',
      options: { hotspot: true },
      fields: [
        { name: 'alt', title: 'Testo alternativo (alt)', type: 'string', description: 'Descrizione breve per accessibilita e SEO.' },
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'excerpt',
      title: 'Sommario',
      type: 'text',
      rows: 3,
      description: 'Riassunto breve mostrato nelle card e sotto al titolo articolo.',
    }),
    defineField({
      name: 'breaking',
      title: 'In evidenza (Ultim’ora)',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'tags',
      title: 'Tag pilota/team',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'driverId / constructorId collegati (es. "leclerc", "ferrari"), per la sezione "news relative a". Maiuscole/minuscole non contano.',
    }),
    defineField({
      name: 'body',
      title: 'Corpo articolo',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          title: 'Immagine nel testo',
          options: { hotspot: true },
          fields: [
            { name: 'caption', title: 'Didascalia', type: 'string' },
            { name: 'alt', title: 'Testo alternativo (alt)', type: 'string' },
          ],
        },
        {
          type: 'object',
          name: 'embed',
          title: 'Embed (X / social)',
          fields: [
            { name: 'url', title: 'Link al post (X/Twitter, YouTube, ecc.)', type: 'url' },
          ],
          preview: { select: { title: 'url' } },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'mainImage' },
  },
})
