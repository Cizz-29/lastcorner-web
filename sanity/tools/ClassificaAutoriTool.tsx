'use client'

import { useEffect, useMemo, useState } from 'react'
import { useClient } from 'sanity'
import { Box, Button, Card, Flex, Select, Spinner, Stack, Text } from '@sanity/ui'
import { QUERY_CLASSIFICA, classifica, intervallo, type Periodo, type RigaClassifica } from './classificaAutori'

// Tool custom dello Studio: quanti articoli ha pubblicato ciascun autore in
// una settimana, un mese o un anno, con le frecce per tornare ai periodi
// precedenti. Contano solo gli articoli pubblicati, non le bozze. La logica
// (date dei periodi, conteggio, parita') sta in classificaAutori.ts.
//
// Legge da Sanity direttamente dal browser, con le credenziali di chi e'
// entrato nello Studio: non passa dal sito e non costa niente su Vercel.

const PERIODI: { value: Periodo; title: string }[] = [
  { value: 'settimana', title: 'Settimana' },
  { value: 'mese', title: 'Mese' },
  { value: 'anno', title: 'Anno' },
]

export default function ClassificaAutoriTool() {
  const client = useClient({ apiVersion: '2025-01-01' })

  const [periodo, setPeriodo] = useState<Periodo>('mese')
  // 0 = il periodo in corso, -1 = quello prima, e cosi' via.
  const [spostamento, setSpostamento] = useState(0)
  const [righe, setRighe] = useState<RigaClassifica[]>([])
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState('')

  const range = useMemo(() => intervallo(periodo, spostamento), [periodo, spostamento])

  useEffect(() => {
    let attivo = true
    setCaricamento(true)
    setErrore('')
    client
      .fetch<{ author?: string }[]>(QUERY_CLASSIFICA, { da: range.da.toISOString(), a: range.a.toISOString() })
      .then((dati) => attivo && setRighe(classifica(dati)))
      .catch((e: Error) => attivo && setErrore(e.message))
      .finally(() => attivo && setCaricamento(false))
    return () => {
      attivo = false
    }
  }, [client, range])

  const totale = righe.reduce((somma, r) => somma + r.articoli, 0)
  const massimo = righe[0]?.articoli ?? 0

  return (
    <Box padding={4} style={{ maxWidth: 720, margin: '0 auto' }}>
      <Stack space={4}>
        <Stack space={2}>
          <Text size={3} weight="bold">
            Classifica autori
          </Text>
          <Text size={1} muted>
            Articoli pubblicati da ciascun autore nel periodo scelto. Le bozze non contano; la
            data è quella di pubblicazione dell&apos;articolo.
          </Text>
        </Stack>

        <Flex gap={2} align="center" wrap="wrap">
          <Box style={{ minWidth: 140 }}>
            <Select
              value={periodo}
              onChange={(e) => {
                setPeriodo(e.currentTarget.value as Periodo)
                setSpostamento(0)
              }}
            >
              {PERIODI.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Box>
          <Button text="←" mode="ghost" title="Periodo precedente" onClick={() => setSpostamento((s) => s - 1)} />
          <Button
            text="→"
            mode="ghost"
            title="Periodo successivo"
            disabled={spostamento >= 0}
            onClick={() => setSpostamento((s) => Math.min(0, s + 1))}
          />
          {spostamento < 0 && <Button text="Oggi" mode="bleed" onClick={() => setSpostamento(0)} />}
          <Box flex={1}>
            <Text size={2} weight="semibold" align="right">
              {range.etichetta}
            </Text>
          </Box>
        </Flex>

        {errore && (
          <Card padding={3} radius={2} tone="critical">
            <Text size={1}>Classifica non disponibile: {errore}</Text>
          </Card>
        )}

        {caricamento ? (
          <Flex justify="center" padding={5}>
            <Spinner muted />
          </Flex>
        ) : righe.length === 0 ? (
          <Card padding={4} radius={2} tone="transparent" border>
            <Text size={1} muted align="center">
              Nessun articolo pubblicato in questo periodo.
            </Text>
          </Card>
        ) : (
          <Card radius={2} border>
            <Stack>
              {righe.map((r) => (
                <Flex key={r.autore} align="center" gap={3} paddingX={3} paddingY={2}>
                  <Box style={{ width: 28 }}>
                    <Text size={1} muted align="right">
                      {r.posizione}.
                    </Text>
                  </Box>
                  <Box style={{ width: 200 }}>
                    <Text size={1} weight={r.posizione === 1 ? 'bold' : 'regular'} textOverflow="ellipsis">
                      {r.autore}
                    </Text>
                  </Box>
                  <Box flex={1}>
                    <Card
                      tone="primary"
                      radius={1}
                      style={{ height: 8, width: `${Math.max(4, (r.articoli / massimo) * 100)}%` }}
                    />
                  </Box>
                  <Box style={{ width: 36 }}>
                    <Text size={1} weight="semibold" align="right">
                      {r.articoli}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </Stack>
          </Card>
        )}

        {!caricamento && righe.length > 0 && (
          <Text size={1} muted>
            {totale} {totale === 1 ? 'articolo' : 'articoli'} di {righe.length}{' '}
            {righe.length === 1 ? 'autore' : 'autori'}.
          </Text>
        )}
      </Stack>
    </Box>
  )
}
