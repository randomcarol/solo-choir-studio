import { Midi } from '@tonejs/midi'
import type { NoteEvent, PracticeSegment, Song, VoicePartId } from '../types/music'

function averagePitch(notes: { midi: number }[]): number {
  return notes.reduce((sum, note) => sum + note.midi, 0) / Math.max(1, notes.length)
}

function syntheticPart(notes: NoteEvent[], part: 'soprano' | 'bass'): NoteEvent[] {
  return notes.map((note) => ({ ...note, id: `${part}-${note.id}`, midi: note.midi + (part === 'soprano' ? 3 : -12) }))
}

export async function importLocalMidi(file: File): Promise<Song> {
  if (file.size > 5 * 1024 * 1024) throw new Error('MIDI 文件请控制在 5MB 以内')
  const midi = new Midi(await file.arrayBuffer())
  const pitchedTracks = midi.tracks.filter((track) => track.notes.length > 0 && track.instrument.percussion === false)
  if (!pitchedTracks.length) throw new Error('没有在这个 MIDI 中找到可练习的音符轨道')

  const ordered = [...pitchedTracks].sort((a, b) => averagePitch(b.notes) - averagePitch(a.notes)).slice(0, 3)
  const normalized = ordered.map((track, trackIndex) => track.notes.map((note, noteIndex) => ({
    id: `midi-${trackIndex}-${noteIndex}`,
    start: note.time,
    duration: Math.max(.08, note.duration),
    midi: note.midi,
  })))
  const alto = normalized.length >= 3 ? normalized[1] : normalized[normalized.length - 1]
  const parts: Record<VoicePartId, NoteEvent[]> = {
    soprano: normalized.length >= 2 ? normalized[0] : syntheticPart(alto, 'soprano'),
    alto,
    bass: normalized.length >= 3 ? normalized[2] : syntheticPart(alto, 'bass'),
  }
  const firstStart = Math.min(...Object.values(parts).flat().map((note) => note.start))
  Object.values(parts).forEach((notes) => notes.forEach((note) => { note.start -= firstStart }))
  const duration = Math.max(...Object.values(parts).flat().map((note) => note.start + note.duration))
  const segmentDuration = duration / 5
  const segments: PracticeSegment[] = Array.from({ length: 5 }, (_, segmentIndex) => {
    const start = segmentIndex * segmentDuration
    const end = segmentIndex === 4 ? duration + .001 : start + segmentDuration
    const segmentParts = Object.fromEntries((['soprano', 'alto', 'bass'] as VoicePartId[]).map((part) => [part, parts[part]
      .filter((note) => note.start < end && note.start + note.duration > start)
      .map((note) => ({ ...note, id: `segment-${segmentIndex + 1}-${note.id}`, start: Math.max(0, note.start - start), duration: Math.min(note.start + note.duration, end) - Math.max(note.start, start) }))])) as Record<VoicePartId, NoteEvent[]>
    return { id: `local-segment-${segmentIndex + 1}`, name: `第 ${segmentIndex + 1} 段`, duration: segmentDuration, notes: segmentParts }
  })

  return {
    id: `local-midi-${Date.now()}`,
    title: file.name.replace(/\.(mid|midi)$/i, ''),
    artist: '你的本地文件',
    songwriter: '由文件提供者确认',
    segments,
    rights: { status: 'user-provided', notice: '仅在当前浏览器内解析，文件未上传；请确保你拥有使用权' },
  }
}
