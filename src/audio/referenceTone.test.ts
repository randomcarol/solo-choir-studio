import { describe, expect, it } from 'vitest'
import { midiToFrequency } from './referenceTone'

describe('合成导唱音高', () => {
  it('按十二平均律生成频率', () => {
    expect(midiToFrequency(69)).toBe(440)
    expect(midiToFrequency(57)).toBe(220)
  })
})
