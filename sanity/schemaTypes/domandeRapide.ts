import { defineField } from 'sanity'

// Campo "Domande rapide" delle schede bio di piloti e team di F1.
//
// Sul sito le domande si scrivono da sole con i numeri aggiornati (vedi
// lib/domandeRapide.ts): qui si possono spegnere una per una o riscrivere la
// risposta. Lasciato vuoto, vale il testo automatico.

const SEGNAPOSTI =
  'Segnaposto utilizzabili: {nome} {cognome} {anno} {posizione} {punti} {mondiali} {anniMondiali} {vittorie} {podi} {pole} {gp} {esordio}. Si aggiornano da soli.'

const DOMANDE: { name: string; title: string }[] = [
  { name: 'classifica', title: 'Posizione nella classifica della stagione' },
  { name: 'mondiali', title: 'Mondiali vinti (o miglior piazzamento, se nessuno)' },
  { name: 'vittorie', title: 'Vittorie' },
  { name: 'podi', title: 'Podi' },
  { name: 'pole', title: 'Pole position' },
  { name: 'carriera', title: 'Esordio e Gran Premi disputati' },
]

export const campoDomandeRapide = defineField({
  name: 'domandeRapide',
  title: 'Domande rapide (solo F1)',
  type: 'object',
  description:
    'Le domande sotto la biografia, sul sito ("Quanti Mondiali ha vinto…?"). Si generano da sole con i dati aggiornati: qui si spengono, si riscrivono o se ne aggiungono altre.',
  options: { collapsible: true, collapsed: true },
  fields: [
    ...DOMANDE.map((d) =>
    defineField({
      name: d.name,
      title: d.title,
      type: 'object',
      options: { columns: 1 },
      fields: [
        defineField({
          name: 'mostra',
          title: 'Mostra questa domanda',
          type: 'boolean',
          initialValue: true,
          description: 'Spenta, la domanda non compare. Una domanda senza senso (es. vittorie per chi non ne ha) si nasconde comunque da sola.',
        }),
        defineField({
          name: 'risposta',
          title: 'Risposta personalizzata',
          type: 'text',
          rows: 3,
          description: `Facoltativa: se vuota si usa quella automatica. ${SEGNAPOSTI}`,
        }),
      ],
    })
  ),
    // Domande libere, scritte a mano: compaiono dopo quelle automatiche,
    // nell'ordine dell'elenco.
    defineField({
      name: 'altre',
      title: 'Altre domande (scritte a mano)',
      type: 'array',
      description: `Compaiono dopo quelle automatiche, nell'ordine dell'elenco. ${SEGNAPOSTI}`,
      of: [
        {
          type: 'object',
          name: 'domandaLibera',
          title: 'Domanda',
          fields: [
            defineField({
              name: 'domanda',
              title: 'Domanda',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'risposta',
              title: 'Risposta',
              type: 'text',
              rows: 3,
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'mostra',
              title: 'Mostra',
              type: 'boolean',
              initialValue: true,
            }),
          ],
          preview: { select: { title: 'domanda', subtitle: 'risposta' } },
        },
      ],
    }),
  ],
})
