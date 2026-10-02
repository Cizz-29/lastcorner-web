import { defineField, defineType } from 'sanity'
import { CampoTestoRitardato } from '../studio/personalizzazioni'
import { campoDomandeRapide } from './domandeRapide'
import { LARGHEZZA_MINIMA_CORPO, larghezzaSufficiente } from './misureImmagine'

export default defineType({
  name: 'teamBio',
  title: 'Bio team',
  type: 'document',
  fields: [
    defineField({
      name: 'constructorId',
      title: 'Constructor ID',
      type: 'string',
      description: 'Deve combaciare con il constructorId Jolpica (F1) o del roster statico (F2/F3), es. "ferrari".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name',
      title: 'Nome team',
      type: 'string',
      description: 'Solo per riconoscerlo facilmente nella lista dello Studio.',
    }),
    defineField({
      name: 'bio',
      title: 'Storia / overview',
      type: 'array',
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
          title: 'Immagine',
          // Finestra grande come negli articoli: nel popup piccolo l'editor
          // perde il fuoco a ogni carattere e la didascalia non si scrive.
          options: { hotspot: true, modal: { type: 'dialog' } },
          description: `Mostrata a tutta la larghezza della colonna: sotto ${LARGHEZZA_MINIMA_CORPO}px viene ingrandita e sgrana.`,
          validation: (Rule) =>
            Rule.custom((value) => larghezzaSufficiente(value, LARGHEZZA_MINIMA_CORPO)).warning(),
          fields: [
            {
              name: 'caption',
              title: 'Didascalia',
              type: 'string',
              description: 'Il testo sotto la foto, come negli articoli.',
              components: { input: CampoTestoRitardato },
            },
            {
              name: 'alt',
              title: 'Testo alternativo (alt)',
              type: 'string',
              description: "Descrive l'immagine: serve all'accessibilità e a Google.",
              components: { input: CampoTestoRitardato },
            },
          ],
        },
      ],
      validation: (Rule) => Rule.required(),
    }),
    campoDomandeRapide,
  ],
  preview: {
    select: { title: 'name', subtitle: 'constructorId' },
  },
})
