import { describe, expect, it } from 'vitest'
import { combineSongSegments, publicDomainSongs } from './songLibrary'

describe('公版完整曲库', () => {
  it('提供三首有来源记录的完整旋律', () => {
    expect(publicDomainSongs).toHaveLength(3)
    publicDomainSongs.forEach((song) => {
      expect(song.rights?.status).toBe('public-domain')
      expect(song.rights?.sourceUrl).toMatch(/^https:/)
      expect(song.segments).toHaveLength(5)
      expect(song.segments.flatMap((segment) => segment.notes.alto).length).toBeGreaterThan(35)
    })
  })

  it('录音阶段会拼接全部段落，而不是只播放第一段', () => {
    const song = publicDomainSongs[0]
    const complete = combineSongSegments(song)
    const practicedNoteCount = song.segments.reduce((sum, segment) => sum + segment.notes.alto.length, 0)
    expect(complete.notes.alto).toHaveLength(practicedNoteCount)
    expect(complete.duration).toBeGreaterThan(song.segments[0].duration)
    expect(complete.notes.alto.at(-1)!.start).toBeGreaterThan(song.segments[0].duration)
  })
})
