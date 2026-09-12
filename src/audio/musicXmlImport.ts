import type { NoteEvent, Song } from '../types/music'
import { buildImportedSong } from './midiImport'

const pitchClasses: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

function directChild(element: Element, name: string): Element | null {
  return Array.from(element.children).find((child) => child.localName === name) ?? null
}

function numberFrom(element: Element | null, fallback: number): number {
  const value = Number(element?.textContent)
  return Number.isFinite(value) ? value : fallback
}

function parsePart(part: Element, partIndex: number): NoteEvent[] {
  const notes: NoteEvent[] = []
  let divisions = 1
  let tempo = 100
  let cursor = 0
  let previousStart = 0

  Array.from(part.children).filter((child) => child.localName === 'measure').forEach((measure) => {
    Array.from(measure.children).forEach((event) => {
      if (event.localName === 'attributes') {
        divisions = Math.max(.001, numberFrom(directChild(event, 'divisions'), divisions))
        return
      }
      if (event.localName === 'direction') {
        const sound = Array.from(event.getElementsByTagName('*')).find((child) => child.localName === 'sound' && child.hasAttribute('tempo'))
        const metronome = Array.from(event.getElementsByTagName('*')).find((child) => child.localName === 'per-minute')
        tempo = Math.max(20, Number(sound?.getAttribute('tempo')) || numberFrom(metronome ?? null, tempo))
        return
      }
      if (event.localName === 'backup' || event.localName === 'forward') {
        const seconds = numberFrom(directChild(event, 'duration'), 0) / divisions * 60 / tempo
        cursor += event.localName === 'backup' ? -seconds : seconds
        return
      }
      if (event.localName !== 'note') return
      const duration = Math.max(.04, numberFrom(directChild(event, 'duration'), divisions) / divisions * 60 / tempo)
      const chord = directChild(event, 'chord') !== null
      const start = chord ? previousStart : Math.max(0, cursor)
      previousStart = start
      const pitch = directChild(event, 'pitch')
      if (pitch && directChild(event, 'rest') === null) {
        const step = directChild(pitch, 'step')?.textContent?.trim().toUpperCase() ?? ''
        const octave = numberFrom(directChild(pitch, 'octave'), 4)
        const alter = numberFrom(directChild(pitch, 'alter'), 0)
        if (step in pitchClasses) notes.push({
          id: `musicxml-${partIndex}-${notes.length}`,
          start,
          duration: Math.max(.08, duration * .94),
          midi: (octave + 1) * 12 + pitchClasses[step] + alter,
        })
      }
      if (!chord) cursor += duration
    })
  })
  return notes
}

export async function importLocalMusicXml(file: File): Promise<Song> {
  if (file.size > 5 * 1024 * 1024) throw new Error('MusicXML 文件请控制在 5MB 以内')
  const document = new DOMParser().parseFromString(await file.text(), 'application/xml')
  if (document.querySelector('parsererror') || document.documentElement.localName !== 'score-partwise') {
    throw new Error('目前支持未压缩的 score-partwise MusicXML 文件')
  }
  const parts = Array.from(document.documentElement.children)
    .filter((child) => child.localName === 'part')
    .map(parsePart)
  return buildImportedSong(file.name.replace(/\.(musicxml|xml)$/i, ''), parts, 'MusicXML')
}
