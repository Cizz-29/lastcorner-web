'use client'

import { useCallback, useEffect, useState } from 'react'
import { useClient } from 'sanity'
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Select,
  Spinner,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'

// Tool custom dello Studio: permette di riassegnare la categoria (e la
// sotto-categoria) a più articoli in una volta sola.
//
// Nasce da un problema concreto: molti articoli sono finiti in "Altro"
// perché chi scriveva dimenticava di impostare la categoria. Correggerli
// uno per uno significherebbe aprire e salvare decine di documenti.

const CATEGORIE = ['Formula 1', 'Formula 2', 'Formula 3', 'F1 Academy', 'WRC', 'Altro']

const SOTTOCATEGORIE = [
  { value: '', title: '— non modificare —' },
  { value: 'news', title: 'News' },
  { value: 'editoriali', title: 'Editoriali' },
  { value: 'analisi-tecnica', title: 'Analisi Tecnica' },
  { value: 'guide-approfondimenti', title: 'Guide e Approfondimenti' },
  { value: 'rubriche', title: 'Rubriche' },
  { value: 'classifiche', title: 'Classifiche' },
]

// Fuori da Formula 1 e WRC lo schema ammette solo "news" e "rubriche"
// (vedi sanity/schemaTypes/article.ts): spostando un articolo in una di
// quelle categorie, una sotto-categoria non ammessa lo renderebbe non
// pubblicabile, quindi va riportata a "news".
const CATEGORIE_COMPLETE = ['Formula 1', 'WRC']
const SOTTO_LIMITATE = ['news', 'rubriche']

interface Articolo {
  _id: string
  title: string
  category: string
  subcategory?: string
  publishedAt: string
}

export default function CategorieInBloccoTool() {
  const client = useClient({ apiVersion: '2025-01-01' })

  const [filtroCategoria, setFiltroCategoria] = useState('Altro')
  const [ricerca, setRicerca] = useState('')
  const [articoli, setArticoli] = useState<Articolo[]>([])
  const [selezionati, setSelezionati] = useState<Set<string>>(new Set())
  const [caricamento, setCaricamento] = useState(false)

  const [nuovaCategoria, setNuovaCategoria] = useState('Formula 1')
  const [nuovaSotto, setNuovaSotto] = useState('')
  const [applicazione, setApplicazione] = useState(false)
  const [messaggio, setMessaggio] = useState('')
  const [errore, setErrore] = useState('')

  const carica = useCallback(async () => {
    setCaricamento(true)
    setErrore('')
    setMessaggio('')
    try {
      const risultati = await client.fetch<Articolo[]>(
        `*[_type == "article" && category == $cat && (!defined($q) || $q == "" || title match $match)]
          | order(publishedAt desc)[0...200]
          { _id, title, category, subcategory, publishedAt }`,
        { cat: filtroCategoria, q: ricerca, match: `*${ricerca}*` }
      )
      setArticoli(risultati)
      setSelezionati(new Set())
    } catch (err) {
      setErrore((err as Error).message)
    } finally {
      setCaricamento(false)
    }
  }, [client, filtroCategoria, ricerca])

  useEffect(() => {
    carica()
  }, [carica])

  function alterna(id: string) {
    setSelezionati((prec) => {
      const nuovo = new Set(prec)
      if (nuovo.has(id)) nuovo.delete(id)
      else nuovo.add(id)
      return nuovo
    })
  }

  function selezionaTutti() {
    setSelezionati(
      selezionati.size === articoli.length ? new Set() : new Set(articoli.map((a) => a._id))
    )
  }

  async function applica() {
    if (selezionati.size === 0) return
    setApplicazione(true)
    setErrore('')
    setMessaggio('')
    try {
      const permetteTutte = CATEGORIE_COMPLETE.includes(nuovaCategoria)
      let transazione = client.transaction()

      for (const id of Array.from(selezionati)) {
        const articolo = articoli.find((a) => a._id === id)
        const campi: Record<string, string> = { category: nuovaCategoria }

        if (nuovaSotto) {
          campi.subcategory = nuovaSotto
        } else if (
          articolo?.subcategory &&
          !permetteTutte &&
          !SOTTO_LIMITATE.includes(articolo.subcategory)
        ) {
          // Sotto-categoria non ammessa nella nuova categoria: si riporta
          // a "news" invece di lasciare un documento non pubblicabile.
          campi.subcategory = 'news'
        }

        transazione = transazione.patch(id, (p) => p.set(campi))
      }

      await transazione.commit()
      setMessaggio(
        `${selezionati.size} articol${selezionati.size === 1 ? 'o' : 'i'} spostat${
          selezionati.size === 1 ? 'o' : 'i'
        } in "${nuovaCategoria}".`
      )
      await carica()
    } catch (err) {
      setErrore((err as Error).message)
    } finally {
      setApplicazione(false)
    }
  }

  return (
    <Box padding={4} style={{ maxWidth: 900, margin: '0 auto' }}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Categorie in blocco
          </Text>
          <Text size={1} muted>
            Seleziona gli articoli da riassegnare e scegli la nuova categoria. Utile per
            recuperare quelli finiti in &quot;Altro&quot; perché la categoria non era stata
            impostata. La modifica agisce sui documenti pubblicati ed è immediata.
          </Text>
        </Stack>

        {/* Filtri */}
        <Card padding={3} radius={2} border>
          <Flex gap={3} align="flex-end" wrap="wrap">
            <Stack space={2} style={{ minWidth: 180 }}>
              <Text size={1} weight="semibold">
                Mostra categoria
              </Text>
              <Select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.currentTarget.value)}
              >
                {CATEGORIE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Stack>
            <Stack space={2} flex={1} style={{ minWidth: 200 }}>
              <Text size={1} weight="semibold">
                Cerca nel titolo
              </Text>
              <TextInput
                value={ricerca}
                onChange={(e) => setRicerca(e.currentTarget.value)}
                placeholder="es. Verstappen"
              />
            </Stack>
            <Button text="Aggiorna elenco" onClick={carica} disabled={caricamento} mode="ghost" />
          </Flex>
        </Card>

        {/* Azione */}
        <Card padding={3} radius={2} border tone="primary">
          <Flex gap={3} align="flex-end" wrap="wrap">
            <Stack space={2} style={{ minWidth: 180 }}>
              <Text size={1} weight="semibold">
                Nuova categoria
              </Text>
              <Select
                value={nuovaCategoria}
                onChange={(e) => setNuovaCategoria(e.currentTarget.value)}
              >
                {CATEGORIE.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Stack>
            <Stack space={2} style={{ minWidth: 220 }}>
              <Text size={1} weight="semibold">
                Sotto-categoria
              </Text>
              <Select value={nuovaSotto} onChange={(e) => setNuovaSotto(e.currentTarget.value)}>
                {SOTTOCATEGORIE.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.title}
                  </option>
                ))}
              </Select>
            </Stack>
            <Button
              text={
                applicazione
                  ? 'Applico...'
                  : `Applica a ${selezionati.size} selezionat${selezionati.size === 1 ? 'o' : 'i'}`
              }
              tone="primary"
              disabled={applicazione || selezionati.size === 0}
              onClick={applica}
            />
          </Flex>
        </Card>

        {messaggio && (
          <Card padding={3} radius={2} tone="positive">
            <Text size={1}>{messaggio}</Text>
          </Card>
        )}
        {errore && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{errore}</Text>
          </Card>
        )}

        {/* Elenco */}
        {caricamento ? (
          <Flex justify="center" padding={5}>
            <Spinner />
          </Flex>
        ) : articoli.length === 0 ? (
          <Card padding={4} radius={2} border>
            <Text size={1} muted>
              Nessun articolo trovato con questi filtri.
            </Text>
          </Card>
        ) : (
          <Stack space={2}>
            <Flex align="center" gap={3}>
              <Button
                text={selezionati.size === articoli.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                mode="ghost"
                onClick={selezionaTutti}
              />
              <Text size={1} muted>
                {articoli.length} articoli · {selezionati.size} selezionati
              </Text>
            </Flex>

            <Card radius={2} border>
              <Stack>
                {articoli.map((a) => (
                  <Card
                    key={a._id}
                    padding={3}
                    borderBottom
                    tone={selezionati.has(a._id) ? 'primary' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => alterna(a._id)}
                  >
                    <Flex align="center" gap={3}>
                      <Checkbox
                        checked={selezionati.has(a._id)}
                        onChange={() => alterna(a._id)}
                        style={{ pointerEvents: 'none' }}
                      />
                      <Stack space={2} flex={1}>
                        <Text size={1} weight="medium">
                          {a.title}
                        </Text>
                        <Text size={0} muted>
                          {a.category}
                          {a.subcategory ? ` · ${a.subcategory}` : ' · senza sotto-categoria'}
                          {a.publishedAt ? ` · ${a.publishedAt.slice(0, 10)}` : ''}
                        </Text>
                      </Stack>
                    </Flex>
                  </Card>
                ))}
              </Stack>
            </Card>
          </Stack>
        )}
      </Stack>
    </Box>
  )
}
