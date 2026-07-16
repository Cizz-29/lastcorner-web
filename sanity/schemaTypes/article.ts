import { defineField, defineType } from 'sanity'

// Categorie del sito - tenute in sync a mano con lib/categories.ts finche'
// non collega direttamente lo schema a quella lista in fase di integrazione.
const CATEGORY_OPTIONS = ['Formula 1', 'Formula 2', 'Formula 3', 'WEC', 'WRC', 'Altro']

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
                        description: 'Opzionale. "classifiche" fa comparire l\'articolo nella pagina Classifica come recap di fine weekend.',
                        options: { list: ['classifiche'] },
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
                        title: 'In evidenza (Ultim\'ora)',
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
