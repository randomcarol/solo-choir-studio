import { PitchDetector } from 'pitchy'
import type { PitchReading } from '../types/music'
import { resumeAudioContext } from './audioContext'

const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']

export function frequencyToMidi(frequency: number): number {
  return 69 + 12 * Math.log2(frequency / 440)
}

export function midiToNoteName(midi: number): string {
  const rounded = Math.round(midi)
  const pitchClass = ((rounded % 12) + 12) % 12
  return `${NOTE_NAMES[pitchClass]}${Math.floor(rounded / 12) - 1}`
}

export function centsFromNearestNote(midi: number): number {
  return Math.round((midi - Math.round(midi)) * 100)
}

export class LocalPitchTracker {
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private analyser: AnalyserNode | null = null
  private frame = 0
  private recentMidi: number[] = []

  async start(onReading: (reading: PitchReading | null) => void): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('当前浏览器不支持麦克风访问')
    this.stop()
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
    })
    const context = await resumeAudioContext()
    this.source = context.createMediaStreamSource(this.stream)
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = .15
    this.source.connect(this.analyser)
    const buffer = new Float32Array(this.analyser.fftSize)
    const detector = PitchDetector.forFloat32Array(buffer.length)
    detector.minVolumeDecibels = -42

    const tick = () => {
      if (!this.analyser) return
      this.analyser.getFloatTimeDomainData(buffer)
      const [frequency, clarity] = detector.findPitch(buffer, context.sampleRate)
      if (frequency >= 70 && frequency <= 1100 && clarity > .78) {
        const midi = frequencyToMidi(frequency)
        this.recentMidi.push(midi)
        if (this.recentMidi.length > 7) this.recentMidi.shift()
        const spread = Math.max(...this.recentMidi) - Math.min(...this.recentMidi)
        onReading({
          frequency,
          midi,
          noteName: midiToNoteName(midi),
          cents: centsFromNearestNote(midi),
          clarity,
          stable: this.recentMidi.length >= 5 && spread < .38,
          capturedAt: performance.now(),
        })
      } else {
        this.recentMidi = []
        onReading(null)
      }
      this.frame = requestAnimationFrame(tick)
    }
    tick()
  }

  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame)
    this.source?.disconnect()
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.source = null
    this.analyser = null
    this.recentMidi = []
  }
}
