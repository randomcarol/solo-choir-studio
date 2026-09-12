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
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = timbre === 'voice' ? 1650 : 2800
    filter.Q.value = timbre === 'voice' ? .65 : .25
    if (timbre === 'voice') {
      const real = new Float32Array(6)
      const imaginary = new Float32Array([0, 1, .24, .1, .045, .018])
      oscillator.setPeriodicWave(context.createPeriodicWave(real, imaginary))
    } else {
      oscillator.type = 'triangle'
    }
    oscillator.frequency.value = midiToFrequency(midi)
    const end = start + Math.max(.08, duration)
    const attackEnd = start + Math.min(timbre === 'voice' ? .075 : .018, duration * .3)
    const releaseStart = Math.max(attackEnd + .005, end - Math.min(timbre === 'voice' ? .13 : .08, duration * .35))
    gain.gain.setValueAtTime(.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, attackEnd)
    gain.gain.setValueAtTime(peak * (timbre === 'voice' ? .82 : .58), releaseStart)
    gain.gain.exponentialRampToValueAtTime(.0001, end)
    oscillator.connect(filter).connect(gain).connect(output)

    let vibrato: OscillatorNode | undefined
    if (timbre === 'voice') {
      vibrato = context.createOscillator()
      const vibratoDepth = context.createGain()
      vibrato.frequency.value = 5.1
      vibratoDepth.gain.value = 4.2
      vibrato.connect(vibratoDepth).connect(oscillator.detune)
      vibrato.start(start)
      vibrato.stop(end + .03)
      this.active.push(vibrato)
    }
    oscillator.start(start)
    oscillator.stop(end + .03)
    this.active.push(oscillator)
    oscillator.onended = () => {
      this.active = this.active.filter((item) => item !== oscillator && item !== vibrato)
    }
  }
}
