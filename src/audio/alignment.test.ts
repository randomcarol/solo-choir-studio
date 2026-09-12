import { describe, expect, it } from 'vitest'
import { detectVocalOnset } from './alignment'

function signalWithOnset(sampleRate: number, duration: number, onset: number): Float32Array {
  const samples = new Float32Array(sampleRate * duration)
  for (let index = Math.floor(onset * sampleRate); index < samples.length; index += 1) {
    samples[index] = Math.sin(index * .19) * .18
  }
  return samples
}

describe('detectVocalOnset', () => {
  it('识别晚进入并给出试听裁切位置', () => {
    const alignment = detectVocalOnset(signalWithOnset(8000, 4, 2.22), 8000, 2)
    expect(alignment.offsetSeconds).toBeCloseTo(.22, 1)
    expect(alignment.trimSeconds).toBeCloseTo(2.18, 1)
    expect(alignment.confidence).toBeGreaterThan(.5)
  })

  it('识别早进入', () => {
    const alignment = detectVocalOnset(signalWithOnset(8000, 4, 1.82), 8000, 2)
    expect(alignment.offsetSeconds).toBeCloseTo(-.18, 1)
    expect(alignment.trimSeconds).toBeCloseTo(1.78, 1)
  })

  it('静音时退回倒计时拍点', () => {
    const alignment = detectVocalOnset(new Float32Array(32000), 8000, 2)
    expect(alignment.detectedOnset).toBe(2)
    expect(alignment.trimSeconds).toBe(2)
    expect(alignment.confidence).toBe(0)
  })
})
