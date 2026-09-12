import type { TrackAlignment } from '../types/music'
import { resumeAudioContext } from './audioContext'

const FRAME_SECONDS = .02
const HOP_SECONDS = .01
const SEARCH_EARLY_SECONDS = .35
const SEARCH_LATE_SECONDS = 1.25
const VOCAL_LEAD_SECONDS = .04

function rms(samples: Float32Array, start: number, size: number): number {
  let sum = 0
  const end = Math.min(samples.length, start + size)
  for (let index = start; index < end; index += 1) sum += samples[index] ** 2
  return Math.sqrt(sum / Math.max(1, end - start))
}

function percentile(values: number[], ratio: number): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))]
}

/**
 * 在倒计时拍点附近寻找连续的有效能量，只返回对齐参数，不修改原始录音。
 */
export function detectVocalOnset(samples: Float32Array, sampleRate: number, expectedOnset: number): TrackAlignment {
  const frameSize = Math.max(32, Math.round(sampleRate * FRAME_SECONDS))
  const hopSize = Math.max(16, Math.round(sampleRate * HOP_SECONDS))
  const searchStart = Math.max(0, Math.round((expectedOnset - SEARCH_EARLY_SECONDS) * sampleRate))
  const searchEnd = Math.min(samples.length - frameSize, Math.round((expectedOnset + SEARCH_LATE_SECONDS) * sampleRate))
  const frames: Array<{ sample: number; level: number }> = []

  for (let start = searchStart; start <= searchEnd; start += hopSize) {
    frames.push({ sample: start, level: rms(samples, start, frameSize) })
  }

  const levels = frames.map((frame) => frame.level)
  // 取较低分位作为环境底噪，避免长音占满窗口时把歌声本身误当成底噪。
  const noiseFloor = percentile(levels, .08)
  const peak = levels.length ? Math.max(...levels) : 0
  const threshold = Math.max(.004, noiseFloor * 2.8, peak * .11)
  let detected: number | undefined

  for (let index = 0; index < frames.length - 2; index += 1) {
    const current = frames[index]
    const sustained = current.level >= threshold
      && frames[index + 1].level >= threshold
      && frames[index + 2].level >= threshold
    if (sustained) {
      detected = current.sample / sampleRate
      break
    }
  }

  if (detected === undefined || peak < .0045) {
    return {
      expectedOnset,
      detectedOnset: expectedOnset,
      offsetSeconds: 0,
      trimSeconds: Math.max(0, expectedOnset),
      confidence: 0,
    }
  }

  const offsetSeconds = detected - expectedOnset
  return {
    expectedOnset,
    detectedOnset: detected,
    offsetSeconds,
    trimSeconds: Math.max(0, detected - VOCAL_LEAD_SECONDS),
    confidence: Math.min(1, Math.max(0, (peak - threshold) / Math.max(peak, .0001))),
  }
}

export async function analyzeRecordingAlignment(blob: Blob, expectedOnset: number): Promise<TrackAlignment> {
  const context = await resumeAudioContext()
  const buffer = await context.decodeAudioData((await blob.arrayBuffer()).slice(0))
  const mono = new Float32Array(buffer.length)
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const values = buffer.getChannelData(channel)
    for (let index = 0; index < values.length; index += 1) mono[index] += values[index] / buffer.numberOfChannels
  }
  return detectVocalOnset(mono, buffer.sampleRate, expectedOnset)
}
