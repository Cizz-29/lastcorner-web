'use client'

import { useState } from 'react'
import { Box, Button, Card, Flex, Select, Stack, Text, TextArea, TextInput } from '@sanity/ui'

const CATEGORIE = ['Formula 1', 'Formula 2', 'Formula 3', 'F1 Academy', 'WRC', 'Altro']

// Tool custom di Sanity Studio (appare come voce "Genera Bozza IA" nella
// barra di navigazione dello Studio, accanto a "Structure" e "Vision").
// Permette a qualsiasi editor di incollare il testo di una fonte (una
// notizia, un articolo di un altro sito) più una descrizione opzionale
// (es. lo spunto di un post Instagram), e ottenere una bozza generata
// nello stile di Francesco Di Blasi, salvata come DRAFT pronta da rivedere
// prima della pubblicazione. Non pubblica mai da sola.

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function GeneraBozzaTool() {
  const [fonte, setFonte] = useState('')
  const [descrizione, setDescrizione] = useState('')
  const [categoria, setCategoria] = useState('Formula 1')
  const [autore, setAutore] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errore, setErrore] = useState('')
  const [risultato, setRisultato] = useState<{ title: string; studioUrl: string } | null>(null)

  async function handleGenera() {
    setStatus('loading')
    setErrore('')
    setRisultato(null)
    try {
      const res = await fetch('/api/genera-bozza', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fonte, descrizione, categoria, autore }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus('error')
        setErrore(data.error || 'Errore sconosciuto')
        return
      }
      setRisultato({ title: data.title, studioUrl: data.studioUrl })
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrore((err as Error).message)
    }
  }

  return (
    <Box padding={4} style={{ maxWidth: 720, margin: '0 auto' }}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Genera Bozza IA
          </Text>
          <Text size={1} muted>
            Incolla il testo di una fonte (notizia, articolo di un altro sito) e, se vuoi, una
            breve descrizione (es. lo spunto per un post Instagram). Il sistema genera una bozza
            nello stile di Francesco, salvata come bozza non pubblicata: revisionala sempre prima
            di pubblicare. Categoria, autore, slug e data vengono precompilati e restano
            modificabili; l&apos;immagine principale va invece caricata a mano.
          </Text>
        </Stack>

        <Flex gap={3}>
          <Stack space={2} flex={1}>
            <Text size={1} weight="semibold">
              Categoria
            </Text>
            <Select value={categoria} onChange={(e) => setCategoria(e.currentTarget.value)}>
              {CATEGORIE.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Stack>
          <Stack space={2} flex={1}>
            <Text size={1} weight="semibold">
              Autore
            </Text>
            <TextInput
              value={autore}
              onChange={(e) => setAutore(e.currentTarget.value)}
              placeholder="Francesco Di Blasi"
            />
          </Stack>
        </Flex>

        <Stack space={2}>
          <Text size={1} weight="semibold">
            Descrizione (opzionale)
          </Text>
          <TextInput
            value={descrizione}
            onChange={(e) => setDescrizione(e.currentTarget.value)}
            placeholder="Es. spunto del post Instagram, angolo da cui trattare la notizia..."
          />
        </Stack>

        <Stack space={2}>
          <Text size={1} weight="semibold">
            Fonte della notizia *
          </Text>
          <TextArea
            value={fonte}
            onChange={(e) => setFonte(e.currentTarget.value)}
            rows={12}
            placeholder="Incolla qui il testo della notizia/articolo di partenza..."
          />
        </Stack>

        <Flex justify="flex-start">
          <Button
            text={status === 'loading' ? 'Generazione in corso...' : 'Genera bozza'}
            tone="primary"
            disabled={status === 'loading' || !fonte.trim()}
            onClick={handleGenera}
          />
        </Flex>

        {status === 'error' && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>{errore}</Text>
          </Card>
        )}

        {status === 'done' && risultato && (
          <Card padding={3} radius={2} tone="positive">
            <Stack space={3}>
              <Text size={1}>
                Bozza creata: <strong>{risultato.title}</strong>
              </Text>
              <Box>
                <a href={risultato.studioUrl}>
                  <Button text="Apri la bozza in Studio" tone="positive" />
                </a>
              </Box>
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
