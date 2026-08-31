import { defineField, defineType } from 'sanity'

// Scheda autore mostrata in cima a /autori/{slug}.
//
// Il collegamento con gli articoli avviene per nome: il campo "author" di un
// articolo e' testo libero, e lo slug della pagina si ricava normalizzandolo
// (minuscole, accenti tolti, spazi in trattini). Quindi "Francesco Di Blasi",
// "francesco di blasi" e "FRANCESCO DI BLASI" finiscono tutti sulla stessa
// pagina e prendono questa stessa scheda.
//
// Attenzione a una cosa sola: grafie diverse dello stesso nome ("F. Di Blasi"
// contro "Francesco Di Blasi") restano due autori distinti. Il nome qui sotto
// deve essere scritto come compare negli articoli.
export default defineType({
  name: 'authorBio',
  title: 'Bio autore',
  type: 'document',
  fields: [
    defineField({
      name: 'fullName',
      title: 'Nome e cognome',
      type: 'string',
      description:
        'Come compare nel campo "Autore" degli articoli. Maiuscole e accenti non contano; conta che sia lo stesso nome.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Ruolo',
      type: 'string',
      description: 'Facoltativo, es. "Fondatore e direttore" o "Redattore Formula 2".',
    }),
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
      description: 'Facoltativa. Viene mostrata rotonda: meglio un primo piano centrato.',
      fields: [{ name: 'alt', title: 'Testo alternativo (alt)', type: 'string' }],
    }),
    defineField({
      name: 'bio',
      title: 'Biografia',
      type: 'array',
      description: 'Qualche riga di presentazione. Si può modificare quando si vuole, senza rimettere online il sito.',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Paragrafo', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [
              { title: 'Grassetto', value: 'strong' },
              { title: 'Corsivo', value: 'em' },
            ],
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
                    validation: (Rule) =>
                      Rule.required().uri({ allowRelative: true, scheme: ['http', 'https'] }),
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
    defineField({
      name: 'social',
      title: 'Link social',
      type: 'array',
      description: 'Aggiungi solo quelli che vuoi mostrare. L’ordine qui è l’ordine sulla pagina.',
      of: [
        {
          type: 'object',
          name: 'profilo',
          title: 'Profilo',
          fields: [
            {
              name: 'piattaforma',
              title: 'Piattaforma',
              type: 'string',
              options: {
                list: [
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'X (Twitter)', value: 'x' },
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'TikTok', value: 'tiktok' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'LinkedIn', value: 'linkedin' },
                  { title: 'Sito web', value: 'sito' },
                ],
              },
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'url',
              title: 'Indirizzo',
              type: 'url',
              validation: (Rule) => Rule.required().uri({ scheme: ['http', 'https'] }),
            },
          ],
          preview: { select: { title: 'piattaforma', subtitle: 'url' } },
        },
      ],
    }),
    defineField({
      name: 'email',
      title: 'Email pubblica',
      type: 'string',
      description: 'Facoltativa. Compare come link di contatto accanto ai social.',
      validation: (Rule) => Rule.email(),
    }),
  ],
  preview: {
    select: { title: 'fullName', subtitle: 'role', media: 'photo' },
  },
})
