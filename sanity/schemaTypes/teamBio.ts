import { defineField, defineType } from 'sanity'

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
                  type: 'text',
                  rows: 8,
                  validation: (Rule) => Rule.required(),
          }),
        ],
    preview: {
          select: { title: 'name', subtitle: 'constructorId' },
    },
})
