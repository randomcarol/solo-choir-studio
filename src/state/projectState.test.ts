import { beforeEach, describe, expect, it } from 'vitest'
import { initialProjectState, loadSavedProject, projectReducer, saveProject, STORAGE_KEY } from './projectState'

describe('项目流程状态', () => {
  beforeEach(() => localStorage.clear())

  it('能从测评依次进入练习并记录完成内容', () => {
    const assessed = projectReducer(initialProjectState, { type: 'complete-assessment' })
    expect(assessed.page).toBe('practice')
    const practiced = projectReducer(assessed, { type: 'practice-segment', segmentId: 'segment-1' })
    const recorded = projectReducer(practiced, { type: 'record-part', partId: 'alto' })
    expect(recorded.practicedSegments).toEqual(['segment-1'])
    expect(recorded.recordedParts).toEqual(['alto'])
  })

  it('不会重复记录同一个段落或声部', () => {
    const once = projectReducer(initialProjectState, { type: 'practice-segment', segmentId: 'segment-1' })
    const twice = projectReducer(once, { type: 'practice-segment', segmentId: 'segment-1' })
    expect(twice.practicedSegments).toHaveLength(1)
  })

  it('把不含音频 Blob 的进度保存到本机', () => {
    const saved = saveProject({ ...initialProjectState, page: 'result', assessmentComplete: true, recordedParts: ['alto'] })
    expect(localStorage.getItem(STORAGE_KEY)).toContain('ode-to-joy')
    expect(loadSavedProject()).toEqual(saved)
  })
})
