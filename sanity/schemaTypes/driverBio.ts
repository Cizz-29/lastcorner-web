import { defineField, defineType } from 'sanity'

export default defineType({
    name: 'driverBio',
    title: 'Bio pilota',
    type: 'document',
    fields: [
          defineField({
                  name: 'driverId',
                  title: 'Driver ID',
                  type: 'string',
                  description: 'Deve combaciare con il driverId Jolpica (F1) o del roster statico (F2/F3), es. "hamilton", "antonelli".',
                  validation: (Rule) => Rule.required(),
          }),
          defineField({
                  name: 'fullName',
                  title: 'Nome completo',
                  type: 'string',
                  description: 'Solo per riconoscerlo facilmente nella lista dello Studio.',
          }),
          defineField({
                  name: 'bio',
                  title: 'Biografia',
                  type: 'text',
                  rows: 8,
                  validation: (Rule) => Rule.required(),
          }),
        ],
    preview: {
          select: { title: 'fullName', subtitle: 'driverId' },
    },
})
