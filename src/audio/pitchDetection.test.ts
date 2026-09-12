import { describe, expect, it } from 'vitest'
import { centsFromNearestNote, frequencyToMidi, midiToNoteName } from './pitchDetection'

describe('音高换算', () => {
  it('将标准 A4 识别为 MIDI 69', () => {
    expect(frequencyToMidi(440)).toBeCloseTo(69, 6)
    expect(midiToNoteName(69)).toBe('A4')
  })

  it('输出最接近音符的音分偏差', () => {
    expect(centsFromNearestNote(60.24)).toBe(24)
    expect(centsFromNearestNote(59.72)).toBe(-28)
  })

  it('能够处理不同八度', () => {
    expect(midiToNoteName(55)).toBe('G3')
    expect(midiToNoteName(74)).toBe('D5')
  })
})
