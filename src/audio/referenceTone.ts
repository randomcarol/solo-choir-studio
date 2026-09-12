import type { NoteEvent } from '../types/music'
import { resumeAudioContext } from './audioContext'

export const midiToFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

export type GuideMode = 'piano' | 'choir' | 'others'

interface ScheduleOptions {
  notes: NoteEvent[]
  offset?: number
  speed?: number
  gain?: number
  timbre?: 'piano' | 'voice'
  destination?: AudioNode
  when?: number
}

export class ReferenceTonePlayer {
  private active: AudioScheduledSourceNode[] = []

  async playNote(midi: number, duration = .72, gain = .18): Promise<void> {
    const context = await resumeAudioContext()
    this.scheduleOscillator(context, midi, context.currentTime + .02, duration, gain, 'piano', context.destination)
  }

  async schedule({ notes, offset = 0, speed = 1, gain = .13, timbre = 'piano', destination, when }: ScheduleOptions): Promise<number> {
    const context = await resumeAudioContext()
    const startAt = when ?? context.currentTime + .06
    const output = destination ?? context.destination
    notes.filter((note) => note.start + note.duration > offset).forEach((note) => {
      const clippedStart = Math.max(note.start, offset)
      const delay = (clippedStart - offset) / speed
      const duration = (note.duration - Math.max(0, offset - note.start)) / speed
      this.scheduleOscillator(context, note.midi, startAt + delay, duration, gain, timbre, output)
    })
    return startAt
  }

  stop(): void {
    this.active.forEach((node) => {
      try { node.stop() } catch { /* source already stopped */ }
    })
    this.active = []
  }

  private scheduleOscillator(context: AudioContext, midi: number, start: number, duration: number, peak: number, timbre: 'piano' | 'voice', output: AudioNode): void {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = timbre === 'voice' ? 'sine' : 'triangle'
    oscillator.frequency.value = midiToFrequency(midi)
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + .025)
    gain.gain.exponentialRampToValueAtTime(.0001, start + Math.max(.08, duration))
    oscillator.connect(gain).connect(output)
    oscillator.start(start)
    oscillator.stop(start + duration + .04)
    this.active.push(oscillator)
    oscillator.onended = () => { this.active = this.active.filter((item) => item !== oscillator) }
  }
}
