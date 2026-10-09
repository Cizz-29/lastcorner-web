// Campi degli articoli live (vedi lib/live.ts): l'interruttore "Live in
// corso" con inizio e fine prevista, e la lista degli aggiornamenti, ognuno
// con orario, titolo facoltativo e testo (paragrafi, link, foto, embed).

import { CampoTestoRitardato } from '../studio/personalizzazioni'
import { campoFonte, regoleFonte } from './fonteImmagine'
import { orarioBreve, testoSemplice } from '../../lib/live'

type Doc = { live?: { inCorso?: boolean }; aggiornamenti?: unknown[] }

export const campoLive = {
  name: 'live',
  title: 'Articolo live',
  type: 'object',
  description:
    'Per seguire una sessione in diretta. Il riassunto va nel corpo articolo; le novità, una alla volta, in "Aggiornamenti live".',
  options: { collapsible: true, collapsed: true },
  fields: [
    {
      name: 'inCorso',
      title: 'Live in corso',
      type: 'boolean',
      description:
        'Accendilo e pubblica quando inizia la diretta: sul sito compare il bollino LIVE e la pagina si aggiorna da sola. A diretta finita spegnilo e pubblica di nuovo.',
    },
    {
      name: 'inizio',
      title: 'Inizio della diretta',
      type: 'datetime',
      description: "Facoltativo: se vuoto vale l'orario del primo aggiornamento.",
    },
    {
      name: 'finePrevista',
      title: 'Fine prevista',
      type: 'datetime',
      description:
        'Facoltativo: quando pensi che finisca (es. fine sessione più mezz\'ora). Lo legge Google per sapere fino a quando la pagina è in diretta.',
    },
  ],
}

export const campoAggiornamenti = {
  name: 'aggiornamenti',
  title: 'Aggiornamenti live',
  type: 'array',
  description:
    'Uno per ogni novità, aggiunto in fondo con "Add item": sul sito compaiono dal più recente. Dopo ogni aggiornamento pubblica, altrimenti i lettori non lo vedono.',
  hidden: ({ document }: { document?: Doc }) =>
    !document?.live?.inCorso && !(document?.aggiornamenti?.length),
  of: [
    {
      type: 'object',
      name: 'aggiornamentoLive',
      title: 'Aggiornamento',
      options: { modal: { type: 'dialog' } },
      fields: [
        {
          name: 'orario',
          title: 'Orario',
          type: 'datetime',
          description: "Si mette da solo all'apertura: cambialo solo se serve.",
          initialValue: () => new Date().toISOString(),
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'titolo',
          title: 'Titolo (facoltativo)',
          type: 'string',
          description: 'Breve, per i momenti chiave: "Bandiera rossa", "Leclerc in testa". Aiuta chi scorre e Google.',
          components: { input: CampoTestoRitardato },
        },
        {
          name: 'testo',
          title: 'Testo',
          type: 'array',
          validation: (Rule: any) => Rule.required(),
          of: [
            {
              type: 'block',
              styles: [{ title: 'Normale', value: 'normal' }],
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
                        validation: (Rule: any) =>
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
              options: { hotspot: true, modal: { type: 'dialog' } },
              validation: (Rule: any) => [...regoleFonte(Rule)],
              fields: [
                { name: 'caption', title: 'Didascalia', type: 'string', components: { input: CampoTestoRitardato } },
                { name: 'alt', title: 'Testo alternativo (alt)', type: 'string', components: { input: CampoTestoRitardato } },
                campoFonte,
              ],
            },
            {
              type: 'object',
              name: 'embed',
              title: 'Embed (X / Instagram / YouTube)',
              options: { modal: { type: 'dialog' } },
              fields: [{ name: 'url', title: 'Link al post', type: 'url' }],
              preview: { select: { title: 'url' } },
            },
          ],
        },
      ],
      preview: {
        select: { orario: 'orario', titolo: 'titolo', testo: 'testo' },
        prepare: ({ orario, titolo, testo }: { orario?: string; titolo?: string; testo?: any[] }) => ({
          title: `${orarioBreve(orario) || '--:--'} · ${titolo || testoSemplice(testo).slice(0, 80) || 'Nuovo aggiornamento'}`,
        }),
      },
    },
  ],
}
