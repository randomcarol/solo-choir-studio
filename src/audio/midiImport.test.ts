import { Midi } from '@tonejs/midi'
import { describe, expect, it } from 'vitest'
import { importLocalMidi } from './midiImport'

describe('本地 MIDI 导入', () => {
  it('把单轨 MIDI 切成五段并生成和声占位', async () => {
    const midi = new Midi()
    const track = midi.addTrack()
    for (let index = 0; index < 20; index += 1) track.addNote({ midi: 60 + index % 5, time: index * .25, duration: .22 })
    const encoded = Uint8Array.from(midi.toArray()).buffer
    const file = new File([encoded], '我的合法测试.mid', { type: 'audio/midi' })
    const song = await importLocalMidi(file)
    expect(song.title).toBe('我的合法测试')
    expect(song.rights?.status).toBe('user-provided')
    expect(song.segments).toHaveLength(5)
    expect(song.segments.flatMap((segment) => segment.notes.alto).length).toBeGreaterThanOrEqual(20)
    expect(song.segments.flatMap((segment) => segment.notes.soprano)).not.toHaveLength(0)
    expect(song.segments.flatMap((segment) => segment.notes.bass)).not.toHaveLength(0)
  })
})
