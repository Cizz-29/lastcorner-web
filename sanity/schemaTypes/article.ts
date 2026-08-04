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
      validation: (Rule) =>
        Rule.custom((tags) =>
          tags && (tags as string[]).length > 0
            ? true
            : 'Nessun tag pilota/team: valuta se aggiungerne uno per far comparire l\'articolo nella sezione "news correlate"'
        ).warning(),
    }),
    defineField({
      name: 'body',
      title: 'Corpo articolo',
      type: 'array',
      validation: (Rule) =>
        Rule.custom((blocks) => {
          const body = (blocks as { _type?: string; markDefs?: { _type?: string }[] }[] | undefined) ?? []
          const hasLink = body.some(
            (b) => b._type === 'embed' || (b.markDefs ?? []).some((m) => m._type === 'link')
          )
          return hasLink
            ? true
            : 'Nessun link (interno/esterno) o embed trovato nel testo: valuta se aggiungerne uno'
        }).warning(),
      of: [
        {
          type: 'block',
          marks: {
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL',
                    description: 'Link interno (es. /formula-1/piloti/leclerc) o esterno (con https://).',
                    validation: (Rule) =>
                      Rule.required().uri({ allowRelative: true, scheme: ['http', 'https'] }),
                  },
                ],
              },
            ],
          },
        },
        {
          type: 'image',
          title: 'Immagine nel testo',
          // modal: dialog invece del popup piccolo. Il popup dell'editor si
          // richiude da solo appena si digita nei campi di testo (difetto
          // noto dell'editor Sanity: si "ridisegna" a ogni carattere e
          // perde il fuoco), rendendo di fatto impossibile scrivere la
          // didascalia. La finestra grande non ha questo problema ed è
          // anche molto più comoda da telefono.
          options: { hotspot: true, modal: { type: 'dialog' } },
          fields: [
            { name: 'caption', title: 'Didascalia', type: 'string' },
            { name: 'alt', title: 'Testo alternativo (alt)', type: 'string' },
          ],
        },
        {
          type: 'object',
          name: 'embed',
          title: 'Embed (X / social)',
          options: { modal: { type: 'dialog' } },
          fields: [
            { name: 'url', title: 'Link al post (X/Twitter, YouTube, ecc.)', type: 'url' },
          ],
          preview: { select: { title: 'url' } },
        },
        {
          type: 'object',
          name: 'tabella',
          title: 'Tabella',
          description: 'Incolla righe e colonne: il sito le formatta da solo.',
          options: { modal: { type: 'dialog' } },
          fields: [
            {
              name: 'titolo',
              title: 'Titolo (opzionale)',
              type: 'string',
              description: 'Es. "Classifica piloti dopo il GP d\'Ungheria".',
            },
            {
              name: 'dati',
              title: 'Dati',
              type: 'text',
              rows: 12,
              description:
                'Una riga per riga della tabella. Le colonne si separano con un TAB (copia-incolla da un foglio di calcolo o da una tabella) oppure con il carattere |. La prima riga è l\'intestazione.',
              validation: (Rule: any) => Rule.required(),
            },
            {
              name: 'primaRigaIntestazione',
              title: 'La prima riga è l\'intestazione',
              type: 'boolean',
              initialValue: true,
            },
          ],
          preview: {
            select: { title: 'titolo', subtitle: 'dati' },
            prepare({ title, subtitle }: { title?: string; subtitle?: string }) {
              const righe = (subtitle ?? '').split('\n').filter(Boolean).length
              return { title: title || 'Tabella', subtitle: `${righe} righe` }
            },
          },
        },
        {
          type: 'object',
          name: 'classificaF1',
          title: 'Classifica F1 (aggiornata da sola)',
          description:
            'Inserisce la classifica live, la stessa della pagina Classifica. Si aggiorna da sé: non adatta ai riepiloghi post-gara immediati, perché i dati ufficiali arrivano dopo qualche ora.',
          options: { modal: { type: 'dialog' } },
          fields: [
            {
              name: 'tipo',
              title: 'Quale classifica',
              type: 'string',
              options: {
                list: [
                  { title: 'Piloti', value: 'piloti' },
                  { title: 'Costruttori', value: 'costruttori' },
                ],
                layout: 'radio',
              },
              initialValue: 'piloti',
            },
          ],
          preview: {
            select: { tipo: 'tipo' },
            prepare({ tipo }: { tipo?: string }) {
              return {
                title: `Classifica F1 live — ${tipo === 'costruttori' ? 'costruttori' : 'piloti'}`,
              }
            },
          },
        },
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'mainImage' },
  },
})
