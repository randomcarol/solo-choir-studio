import type { NoteEvent, RecordingTrack, VoicePartId } from '../types/music'
import { resumeAudioContext } from './audioContext'
import { ReferenceTonePlayer } from './referenceTone'

export type ReverbPreset = 'hall' | 'intimate'

export class MultiTrackPlayer {
  private sources: AudioBufferSourceNode[] = []
  private tonePlayer = new ReferenceTonePlayer()

  async play(tracks: RecordingTrack[], placeholderNotes: Record<VoicePartId, NoteEvent[]>, preset: ReverbPreset): Promise<void> {
    this.stop()
    const context = await resumeAudioContext()
    const anySolo = tracks.some((track) => track.solo)
    const reverb = this.createReverb(context, preset)
    const wetGain = context.createGain()
    wetGain.gain.value = preset === 'hall' ? .24 : .1
    reverb.connect(wetGain).connect(context.destination)

    const decoded = new Map<VoicePartId, AudioBuffer>()
    await Promise.all(tracks.map(async (track) => {
      if (!track.blob) return
      const data = await track.blob.arrayBuffer()
      decoded.set(track.id, await context.decodeAudioData(data.slice(0)))
    }))
    const startAt = context.currentTime + .1

    await Promise.all(tracks.map(async (track) => {
      const audible = !track.muted && (!anySolo || track.solo)
      if (!audible) return
      const gain = context.createGain()
      gain.gain.value = track.volume
      gain.connect(context.destination)
      gain.connect(reverb)
      const buffer = decoded.get(track.id)
      if (buffer) {
        const source = context.createBufferSource()
        source.buffer = buffer
        source.connect(gain)
        const trim = Math.min(track.alignment?.trimSeconds ?? 0, Math.max(0, buffer.duration - .02))
        source.start(startAt, trim)
        this.sources.push(source)
      } else {
        await this.tonePlayer.schedule({ notes: placeholderNotes[track.id], gain: .065, timbre: 'voice', destination: gain, when: startAt })
      }
    }))
  }

  async playSingle(track: RecordingTrack): Promise<void> {
    if (!track.blob) return
    this.stop()
    const context = await resumeAudioContext()
    const buffer = await context.decodeAudioData((await track.blob.arrayBuffer()).slice(0))
    const source = context.createBufferSource()
    const gain = context.createGain()
    gain.gain.value = track.volume
    source.buffer = buffer
    source.connect(gain).connect(context.destination)
    const trim = Math.min(track.alignment?.trimSeconds ?? 0, Math.max(0, buffer.duration - .02))
    source.start(context.currentTime + .04, trim)
    this.sources.push(source)
  }

  stop(): void {
    this.sources.forEach((source) => { try { source.stop() } catch { /* already stopped */ } })
    this.sources = []
    this.tonePlayer.stop()
  }

  private createReverb(context: AudioContext, preset: ReverbPreset): ConvolverNode {
    const convolver = context.createConvolver()
    const duration = preset === 'hall' ? 1.7 : .55
    const length = Math.floor(context.sampleRate * duration)
    const impulse = context.createBuffer(2, length, context.sampleRate)
    for (let channel = 0; channel < 2; channel += 1) {
      const values = impulse.getChannelData(channel)
      for (let i = 0; i < length; i += 1) {
        const decay = (1 - i / length) ** (preset === 'hall' ? 2.2 : 3.8)
        values[i] = (Math.random() * 2 - 1) * decay * .55
      }
    }
    convolver.buffer = impulse
    return convolver
  }
}
