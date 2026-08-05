'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Card, Dialog, Flex, Grid, Spinner, Stack, Text, TextInput } from '@sanity/ui'
import { SearchIcon } from '@sanity/icons'
import {
  set,
  unset,
  useClient,
  type AssetSource,
  type AssetSourceComponentProps,
  type StringInputProps,
} from 'sanity'

// ---------------------------------------------------------------------------
// 1) Ricerca immagini nell'archivio
// ---------------------------------------------------------------------------
//
// Sanity di suo mostra solo la lista delle immagini in ordine di caricamento:
// con qualche migliaio di file diventa inutilizzabile. Questa scheda cerca
// per nome del file, titolo, testo alternativo e descrizione — come faceva
// la libreria media di WordPress.
//
// Nota sui dati esistenti: le immagini importate da WordPress hanno il nome
// del file originale ma non titolo/alt/descrizione, quindi all'inizio la
// ricerca lavora di fatto sul nome. Si arricchisce da sé man mano che si
// compila il campo "alt" al caricamento.

const CAMPI = `{ _id, url, originalFilename, title, altText, description }`

const QUERY_RICERCA = `*[_type == "sanity.imageAsset" && (
  originalFilename match $q ||
  title match $q ||
  altText match $q ||
  description match $q
)] | order(_createdAt desc)[0...60] ${CAMPI}`

const QUERY_RECENTI = `*[_type == "sanity.imageAsset"] | order(_createdAt desc)[0...60] ${CAMPI}`

interface Immagine {
  _id: string
  url: string
  originalFilename?: string
  title?: string
  altText?: string
  description?: string
}

function etichetta(img: Immagine): string {
  return img.title || img.altText || img.originalFilename || 'Senza nome'
}

function RicercaImmaginiComponent(props: AssetSourceComponentProps) {
  const { onClose, onSelect } = props
  const client = useClient({ apiVersion: '2024-01-01' })

  const [termine, setTermine] = useState('')
  const [risultati, setRisultati] = useState<Immagine[]>([])
  const [caricamento, setCaricamento] = useState(true)
  const [errore, setErrore] = useState<string | null>(null)

  // La ricerca parte 300ms dopo l'ultimo tasto: si evita una query per
  // ogni carattere digitato.
  useEffect(() => {
    let annullato = false
    const timer = setTimeout(() => {
      const cercato = termine.trim()
      setCaricamento(true)
      setErrore(null)
      const richiesta = cercato
        ? client.fetch<Immagine[]>(QUERY_RICERCA, { q: `*${cercato}*` })
        : client.fetch<Immagine[]>(QUERY_RECENTI)
      richiesta
        .then((docs) => {
          if (annullato) return
          setRisultati(docs.filter((d) => d?.url))
        })
        .catch((err: Error) => {
          if (annullato) return
          setErrore(err.message)
        })
        .finally(() => {
          if (!annullato) setCaricamento(false)
        })
    }, 300)
    return () => {
      annullato = true
      clearTimeout(timer)
    }
  }, [termine, client])

  const scegli = useCallback(
    (img: Immagine) => {
      onSelect([{ kind: 'assetDocumentId', value: img._id }])
      onClose()
    },
    [onSelect, onClose]
  )

  return (
    <Dialog
      id="ricerca-immagini"
      header="Cerca nell'archivio immagini"
      width={2}
      onClose={onClose}
      onClickOutside={onClose}
    >
      <Box padding={4}>
        <Stack space={4}>
          <TextInput
            icon={SearchIcon}
            placeholder="Cerca per nome file, titolo, alt o descrizione — es. leclerc"
            value={termine}
            onChange={(e) => setTermine(e.currentTarget.value)}
            autoFocus
          />

          {caricamento && (
            <Flex align="center" justify="center" padding={5}>
              <Spinner muted />
            </Flex>
          )}

          {!caricamento && errore && (
            <Card padding={4} radius={2} tone="critical">
              <Text size={1}>Errore nella ricerca: {errore}</Text>
            </Card>
          )}

          {!caricamento && !errore && risultati.length === 0 && (
            <Card padding={4} radius={2} tone="caution">
              <Text size={1}>
                Nessuna immagine trovata. Prova con una parola più corta: la ricerca guarda nel nome
                del file, nel titolo, nel testo alternativo e nella descrizione.
              </Text>
            </Card>
          )}

          {!caricamento && risultati.length > 0 && (
            <Grid columns={[2, 3, 4]} gap={3}>
              {risultati.map((img) => (
                <Button
                  key={img._id}
                  mode="bleed"
                  padding={1}
                  onClick={() => scegli(img)}
                  title={etichetta(img)}
                >
                  <Stack space={2}>
                    <Card radius={2} overflow="hidden" tone="transparent">
                      {/* immagine statica dell'archivio: <img> va benissimo,
                          qui non siamo nel sito ma nel CMS */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${img.url}?w=320&h=240&fit=crop&auto=format`}
                        alt={img.altText || ''}
                        style={{ display: 'block', width: '100%', height: 120, objectFit: 'cover' }}
                      />
                    </Card>
                    <Text size={0} muted textOverflow="ellipsis">
                      {etichetta(img)}
                    </Text>
                  </Stack>
                </Button>
              ))}
            </Grid>
          )}
        </Stack>
      </Box>
    </Dialog>
  )
}

export const ricercaImmagini: AssetSource = {
  name: 'ricerca-archivio',
  title: 'Cerca',
  icon: SearchIcon,
  component: RicercaImmaginiComponent,
}

// ---------------------------------------------------------------------------
// 2) Campo di testo che salva all'uscita
// ---------------------------------------------------------------------------
//
// Nei blocchi dentro il corpo articolo (immagine, embed, tabella) l'editor
// riscrive il documento a ogni singolo carattere e si ridisegna: il campo
// perde il fuoco e il pannello si chiude dopo la prima lettera.
//
// Qui il testo resta locale mentre si scrive e viene salvato quando si esce
// dal campo, con Invio, o se il pannello viene chiuso. Nessuna scrittura a
// ogni tasto, quindi nessun ridisegno.

export function CampoTestoRitardato(props: StringInputProps) {
  const { value, onChange, elementProps } = props
  const [testo, setTesto] = useState<string>(value ?? '')

  // Ultimo valore effettivamente salvato: serve a non inviare patch inutili
  // e a riallineare il campo se il valore cambia da fuori (annulla/ripristina).
  const salvato = useRef<string>(value ?? '')

  useEffect(() => {
    const esterno = value ?? ''
    if (esterno !== salvato.current) {
      salvato.current = esterno
      setTesto(esterno)
    }
  }, [value])

  const salva = useCallback(
    (testoDaSalvare: string) => {
      if (testoDaSalvare === salvato.current) return
      salvato.current = testoDaSalvare
      onChange(testoDaSalvare ? set(testoDaSalvare) : unset())
    },
    [onChange]
  )

  // Se il pannello viene chiuso mentre il campo ha ancora il fuoco, il blur
  // può non arrivare: si salva anche allo smontaggio.
  const testoRef = useRef(testo)
  testoRef.current = testo
  const salvaRef = useRef(salva)
  salvaRef.current = salva
  useEffect(() => {
    return () => {
      salvaRef.current(testoRef.current)
    }
  }, [])

  return (
    <TextInput
      {...elementProps}
      value={testo}
      onChange={(e) => setTesto(e.currentTarget.value)}
      onBlur={(e) => {
        salva(testo)
        elementProps.onBlur?.(e)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') salva(testo)
      }}
    />
  )
}
