import type { Song } from '../types/music'
import { importLocalMidi } from './midiImport'
import { importLocalMusicXml } from './musicXmlImport'

export async function importLocalScore(file: File): Promise<Song> {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'mid' || extension === 'midi') return importLocalMidi(file)
  if (extension === 'musicxml' || extension === 'xml') return importLocalMusicXml(file)
  throw new Error('请选择 .mid、.midi、.musicxml 或 .xml 文件')
}
