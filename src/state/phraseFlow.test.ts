import { describe, expect, it } from 'vitest'
import { practiceSegments } from '../data/demoSong'
import { getComfortableRange } from './assessmentFlow'
import { createSimulatedPitchPoints } from './practiceFlow'

describe('整句测评与跟唱流程', () => {
  it('从整句音高采样估算舒适区间并忽略两端偶发值', () => {
    const samples = [42, 55, 55.2, 57, 58, 59, 60, 62, 64, 65, 65.1, 78]
    expect(getComfortableRange(samples)).toEqual({ min: 55, max: 65 })
  })

  it('采样不足时返回安全的 Demo 区间', () => {
    expect(getComfortableRange([60, 60.1])).toEqual({ min: 55, max: 74 })
  })

  it('为整句而不是单个音符生成连续模拟轨迹', () => {
    const segment = practiceSegments[0]
    const points = createSimulatedPitchPoints(segment.notes.alto, segment.duration)
    expect(points.length).toBeGreaterThan(segment.notes.alto.length * 2)
    expect(points.every((point) => point.time >= 0 && point.time <= segment.duration)).toBe(true)
    expect(new Set(points.map((point) => Math.round(point.midi))).size).toBeGreaterThan(3)
  })
})
