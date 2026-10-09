import { defineField, defineType } from 'sanity'
import { OlistIcon } from '@sanity/icons'
import { CampoTestoRitardato } from '../studio/personalizzazioni'
import { campoFonte, regoleFonte } from './fonteImmagine'
import { OPZIONI_SESSIONE } from '../../lib/sessioniF1'
import { campoAggiornamenti, campoLive } from './live'
import { MINIMO_VOCI_INDICE, titoliDelCorpo, vociIndice, type LivelloIndice } from '../../lib/indice'
import {
  LARGHEZZA_MINIMA_PRINCIPALE,
  LARGHEZZA_MINIMA_CORPO,
  larghezzaSufficiente,
  orientamentoOrizzontale,
} from './misureImmagine'

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
      description: 'Parte finale del link, es. "camara-haas-ocon". Generato dal titolo, modificabile. Niente accenti.',
      // Lo slug di default di Sanity toglie gli spazi ma tiene gli accenti:
      // "penalità" restava "penalità", e l'articolo e' finito in 404 pur
      // essendo pubblicato. Qui gli accenti si sciolgono (à -> a) e resta
      // solo quello che in un indirizzo non da' mai problemi.
      options: {
        source: 'title',
        maxLength: 96,
        slugify: (testo: string) =>
          testo
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, ' ')
            .trim()
            .replace(/[\s-]+/g, '-')
            .slice(0, 96)
            .replace(/-+$/, ''),
      },
      // E se lo slug si scrive a mano, lo Studio non lascia pubblicare con
      // un accento o un carattere speciale dentro, e dice perche'.
      validation: (Rule) => [
        Rule.required().custom((valore?: { current?: string }) => {
          const slug = valore?.current ?? ''
          return /^[A-Za-z0-9-]*$/.test(slug)
            ? true
            : 'Solo lettere senza accenti, numeri e trattini: "penalità" va scritto "penalita".'
        }),
        // Avviso, non errore: 14 articoli pubblicati hanno maiuscole nello
        // slug e devono restare modificabili. Il sito li trova anche scritti
        // in minuscolo (vedi getArticleBySlug), ma un indirizzo tutto
        // minuscolo resta il piu' sicuro da condividere e da linkare.
        Rule.custom((valore?: { current?: string }) =>
          /[A-Z]/.test(valore?.current ?? '')
            ? 'Meglio tutto minuscolo: usa "Genera" per ricrearlo dal titolo.'
            : true
        ).warning(),
      ],
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
      name: 'recapSessione',
      title: 'Recap di sessione F1',
      type: 'string',
      description:
        'Solo se l\'articolo è il resoconto di una sessione del weekend: in home, nel riquadro "Prossimo evento", il nome della sessione (es. PL1) diventa un link a questo articolo. Il Gran Premio lo ricava il sito dalla data di pubblicazione.',
      options: { list: OPZIONI_SESSIONE },
      hidden: ({ document }) => (document as { category?: string } | undefined)?.category !== 'Formula 1',
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
      name: 'aggiornatoIl',
      title: 'Aggiornato il',
      type: 'datetime',
      description:
        "Solo per aggiornamenti veri del contenuto (fatti nuovi, correzioni importanti). Compare sotto il titolo come \"Aggiornato\" e dice a Google che il pezzo e' cambiato. Non serve per refusi o ritocchi.",
      validation: (Rule) =>
        Rule.custom((valore, contesto) => {
          const pubblicato = (contesto.document as { publishedAt?: string } | undefined)?.publishedAt
          if (valore && pubblicato && new Date(valore as string) < new Date(pubblicato)) {
            return "L'aggiornamento non puo' essere precedente alla pubblicazione"
          }
          return true
        }),
    }),
    defineField({
      name: 'mainImage',
      title: 'Immagine principale',
      type: 'image',
      options: { hotspot: true },
      description: `Almeno ${LARGHEZZA_MINIMA_PRINCIPALE}px di larghezza, orizzontale. E' l'immagine che Google usa per Discover e per l'anteprima social.`,
      fields: [
        { name: 'alt', title: 'Testo alternativo (alt)', type: 'string', description: 'Descrizione breve per accessibilita e SEO.' },
        campoFonte,
      ],
      validation: (Rule) => [
        ...regoleFonte(Rule),
        Rule.required(),
        // Errore, non avviso: sotto i 1200px l'articolo e' fuori da Discover
        // e l'anteprima social esce sgranata. Vale la pena fermarsi e
        // cercare il file originale.
        Rule.custom((value) => larghezzaSufficiente(value, LARGHEZZA_MINIMA_PRINCIPALE)),
        Rule.custom((value) => orientamentoOrizzontale(value)).warning(),
      ],
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
    defineField(campoLive as any),
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
          description: `Mostrata a tutta la larghezza della colonna nelle sue proporzioni reali: sotto ${LARGHEZZA_MINIMA_CORPO}px viene ingrandita e sgrana.`,
          // Avviso e non errore: nel corpo capita di dover mettere uno
          // screenshot, un grafico o una vecchia foto d'archivio che a piena
          // risoluzione non esiste. Meglio segnalarlo che impedirlo.
          validation: (Rule) => [
            ...regoleFonte(Rule),
            Rule.custom((value) => larghezzaSufficiente(value, LARGHEZZA_MINIMA_CORPO)).warning(),
          ],
          fields: [
            {
              name: 'caption',
              title: 'Didascalia',
              type: 'string',
              description: 'Il credito della foto si aggiunge da solo: non scriverlo qui.',
              components: { input: CampoTestoRitardato },
            },
            {
              name: 'alt',
              title: 'Testo alternativo (alt)',
              type: 'string',
              description: 'Descrive l\'immagine: serve all\'accessibilità, a Google e alla ricerca nell\'archivio.',
              components: { input: CampoTestoRitardato },
            },
            campoFonte,
          ],
        },
        {
          type: 'object',
          name: 'embed',
          title: 'Embed (X / Instagram / YouTube)',
          options: { modal: { type: 'dialog' } },
          fields: [
            {
              name: 'url',
              title: 'Link al post',
              type: 'url',
              description:
                'X/Twitter, Instagram (post, reel o IGTV) e YouTube diventano anteprime vere. Qualsiasi altro indirizzo resta un link.',
            },
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
          // Indice dei contenuti. Non si scrive niente: l'elenco si ricava
          // dai titoli H2 (ed eventualmente H3) del corpo, quindi resta
          // allineato anche se un titolo cambia. Va messo dove deve comparire,
          // di solito dopo il primo paragrafo. Vedi lib/indice.ts.
          type: 'object',
          name: 'indice',
          title: 'Indice dei contenuti',
          icon: OlistIcon,
          description: 'Elenco cliccabile dei titoli dell\'articolo. Si compila da solo.',
          options: { modal: { type: 'dialog' } },
          fields: [
            {
              name: 'titolo',
              title: 'Intestazione (opzionale)',
              type: 'string',
              description: 'Vuota = "In questo articolo".',
            },
            {
              name: 'livelli',
              title: 'Cosa elencare',
              type: 'string',
              options: {
                list: [
                  { title: 'Solo i titoli (H2)', value: 'h2' },
                  { title: 'Titoli e sottotitoli (H2 e H3)', value: 'h2h3' },
                ],
                layout: 'radio',
              },
              initialValue: 'h2',
            },
          ],
          // Avvisi, non errori: un indice di troppo non rompe niente, sul
          // sito semplicemente non compare.
          validation: (Rule: any) =>
            Rule.custom((valore: { livelli?: LivelloIndice } | undefined, contesto: any) => {
              const corpo = (contesto?.document?.body ?? []) as any[]
              const quanti = corpo.filter((b) => b?._type === 'indice').length
              if (quanti > 1) return 'C\'è più di un indice: ne basta uno.'
              const voci = vociIndice(titoliDelCorpo(corpo), valore?.livelli)
              return voci.length >= MINIMO_VOCI_INDICE
                ? true
                : `L'indice compare solo con almeno ${MINIMO_VOCI_INDICE} titoli${valore?.livelli === 'h2h3' ? '' : ' H2'}: ora ${voci.length === 1 ? 'ce n\'è uno' : 'non ce ne sono'}.`
            }).warning(),
          preview: {
            select: { titolo: 'titolo', livelli: 'livelli' },
            prepare({ titolo, livelli }: { titolo?: string; livelli?: string }) {
              return {
                title: titolo || 'Indice dei contenuti',
                subtitle: livelli === 'h2h3' ? 'Titoli H2 e H3' : 'Titoli H2',
                media: OlistIcon,
              }
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
    // Note lasciate dal revisore (Claude) quando corregge un articolo in bozza:
    // cosa ha cambiato e perche', cosi' chi pubblica lo legge nello Studio
    // accanto al confronto delle modifiche. Non compare mai sul sito: le query
    // del sito elencano i campi uno per uno e questo non c'e'.
    // Dopo aver letto le note si puo' svuotare il campo prima di pubblicare.
    defineField(campoAggiornamenti as any),
    defineField({
      name: 'noteRevisione',
      title: 'Note di revisione',
      type: 'text',
      rows: 8,
      description: 'Cosa è stato modificato in revisione e perché. Non compare sul sito.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'category', media: 'mainImage' },
  },
})
