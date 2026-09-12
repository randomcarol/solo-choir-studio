import { describe, expect, it } from 'vitest'
import { combineSongSegments } from '../data/songLibrary'
import { importLocalMusicXml } from './musicXmlImport'

const score = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <part-list><score-part id="P1"><part-name>旋律</part-name></score-part></part-list>
  <part id="P1"><measure number="1">
    <attributes><divisions>2</divisions></attributes>
    <direction><sound tempo="120"/></direction>
    <note><pitch><step>C</step><octave>4</octave></pitch><duration>2</duration></note>
    <note><pitch><step>D</step><alter>1</alter><octave>4</octave></pitch><duration>2</duration></note>
    <note><rest/><duration>2</duration></note>
    <note><pitch><step>E</step><octave>4</octave></pitch><duration>4</duration></note>
  </measure></part>
</score-partwise>`

describe('本地 MusicXML 导入', () => {
  it('解析音高、升降号、休止和速度并生成五段练习', async () => {
    const file = new File([score], '授权合唱谱.musicxml', { type: 'application/vnd.recordare.musicxml+xml' })
    const song = await importLocalMusicXml(file)
    const alto = song.segments.flatMap((segment) => segment.notes.alto)
    expect(song.title).toBe('授权合唱谱')
    expect(song.rights?.status).toBe('user-provided')
    expect(song.segments).toHaveLength(5)
    expect(alto.map((note) => note.midi)).toContain(60)
    expect(alto.map((note) => note.midi)).toContain(63)
    expect(alto.map((note) => note.midi)).toContain(64)
    expect(Math.max(...combineSongSegments(song).notes.alto.map((note) => note.start))).toBeGreaterThan(.5)
  })

  it('拒绝不是 score-partwise 的 XML', async () => {
    const file = new File(['<html/>'], '错误.xml', { type: 'application/xml' })
    await expect(importLocalMusicXml(file)).rejects.toThrow('score-partwise')
  })
})
