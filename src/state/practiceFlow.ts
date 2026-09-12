import type { NoteEvent } from '../types/music'
import type { PitchPoint } from '../components/PitchLane'

export function createSimulatedPitchPoints(notes: NoteEvent[], duration: number): PitchPoint[] {
  const points: PitchPoint[] = []
  notes.forEach((note, noteIndex) => {
    const samples = Math.max(3, Math.round(note.duration * 9))
    for (let index = 0; index < samples; index += 1) {
      const time = note.start + (index / samples) * note.duration
      if (time <= duration) points.push({ time, midi: note.midi + Math.sin(index * .7 + noteIndex) * .08 })
    }
  })
  return points
}
