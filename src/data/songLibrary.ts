import type { NoteEvent, PracticeSegment, Song, VoicePartId } from '../types/music'

type PhraseNote = readonly [midi: number, beats: number]

function harmonyInterval(midi: number): number {
  return [0, 2, 4, 5, 7, 9, 11].includes(midi % 12) ? ([0, 4, 3, 4, 4, 3, 3] as const)[[0, 2, 4, 5, 7, 9, 11].indexOf(midi % 12)] : 3
}

function phraseToPart(notes: readonly PhraseNote[], secondsPerBeat: number, part: VoicePartId, phraseIndex: number): NoteEvent[] {
  let cursor = 0
  return notes.map(([melodyMidi, beats], noteIndex) => {
    const duration = beats * secondsPerBeat
    const midi = part === 'soprano' ? melodyMidi + harmonyInterval(melodyMidi) : part === 'bass' ? melodyMidi - 12 : melodyMidi
    const note = { id: `${phraseIndex + 1}-${part}-${noteIndex + 1}`, start: cursor, duration: Math.max(.12, duration * .9), midi }
    cursor += duration
    return note
  })
}

function createPublicDomainSong(config: {
  id: string
  title: string
  artist: string
  songwriter: string
  secondsPerBeat: number
  phrases: readonly (readonly PhraseNote[])[]
  sourceUrl: string
}): Song {
  const segments: PracticeSegment[] = config.phrases.map((phrase, phraseIndex) => {
    const duration = phrase.reduce((sum, [, beats]) => sum + beats * config.secondsPerBeat, 0)
    return {
      id: `${config.id}-segment-${phraseIndex + 1}`,
      name: `第 ${phraseIndex + 1} 段`,
      duration,
      notes: {
        soprano: phraseToPart(phrase, config.secondsPerBeat, 'soprano', phraseIndex),
        alto: phraseToPart(phrase, config.secondsPerBeat, 'alto', phraseIndex),
        bass: phraseToPart(phrase, config.secondsPerBeat, 'bass', phraseIndex),
      },
    }
  })
  return {
    id: config.id,
    title: config.title,
    artist: config.artist,
    songwriter: config.songwriter,
    segments,
    rights: {
      status: 'public-domain',
      notice: '公版作品旋律 · 本 Demo 自制三声部与合成导唱',
      sourceUrl: config.sourceUrl,
    },
  }
}

const twinkleA: PhraseNote[] = [[60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2]]
const twinkleB: PhraseNote[] = [[65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2]]
const twinkleMiddle: PhraseNote[] = [[67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2]]

const joyA: PhraseNote[] = [[64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [60, 1], [62, 1], [64, 1], [64, 1.5], [62, .5], [62, 2]]
const joyB: PhraseNote[] = [[64, 1], [64, 1], [65, 1], [67, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 1], [60, 1], [62, 1], [64, 1], [62, 1.5], [60, .5], [60, 2]]
const joyBridge: PhraseNote[] = [[62, 1], [62, 1], [64, 1], [60, 1], [62, 1], [64, .5], [65, .5], [64, 1], [60, 1], [62, 1], [64, .5], [65, .5], [64, 1], [62, 1], [60, 1], [62, 1], [55, 2]]

const auld1: PhraseNote[] = [[60, .5], [65, 1], [65, .5], [65, 1], [69, 1], [67, 1], [65, 1], [67, 1], [69, 1], [65, 1.5]]
const auld2: PhraseNote[] = [[65, .5], [69, 1], [72, 1], [74, 1.5], [74, .5], [72, 1], [69, 1], [69, 1], [65, 1], [67, 1], [65, 1.5]]
const auld3: PhraseNote[] = [[67, .5], [69, 1], [65, 1], [62, 1], [62, 1], [60, .5], [65, 2]]
const auld4: PhraseNote[] = [[74, .5], [72, 1], [69, 1], [69, 1], [65, 1], [67, 1], [65, 1], [67, 1], [69, 1], [65, 1.5]]
const auld5: PhraseNote[] = [[62, .5], [62, 1], [60, .5], [65, 1], [69, 1], [72, 1], [74, 2], [72, 1], [69, 1], [65, 2]]

export const publicDomainSongs: Song[] = [
  createPublicDomainSong({
    id: 'ode-to-joy', title: '欢乐颂', artist: '公版经典', songwriter: '路德维希·凡·贝多芬', secondsPerBeat: .52,
    phrases: [joyA, joyB, joyBridge, joyA, joyB],
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=528',
  }),
  createPublicDomainSong({
    id: 'twinkle', title: '小星星', artist: '法国传统旋律', songwriter: '传统曲调', secondsPerBeat: .5,
    phrases: [twinkleA, twinkleB, [...twinkleMiddle, ...twinkleMiddle], twinkleA, twinkleB],
    sourceUrl: 'https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=2236',
  }),
  createPublicDomainSong({
    id: 'auld-lang-syne', title: '友谊地久天长', artist: '苏格兰传统旋律', songwriter: '传统曲调', secondsPerBeat: .5,
    phrases: [auld1, auld2, auld3, auld4, auld5],
    sourceUrl: 'https://www.mutopiaproject.org/ftp/HoretzkyF/horetzky31/horetzky31-let.pdf',
  }),
]

export const rainbowPendingSong: Song = {
  id: 'caihong-pending',
  title: '彩虹',
  artist: '上海彩虹室内合唱团',
  songwriter: '金承志',
  segments: [],
  rights: { status: 'license-required', notice: '等待词曲与产品内交互使用授权，当前不提供旋律' },
}

export function combineSongSegments(song: Song): PracticeSegment {
  const notes: Record<VoicePartId, NoteEvent[]> = { soprano: [], alto: [], bass: [] }
  let cursor = 0
  song.segments.forEach((segment) => {
    ;(['soprano', 'alto', 'bass'] as VoicePartId[]).forEach((part) => {
      notes[part].push(...segment.notes[part].map((note) => ({ ...note, id: `${song.id}-${note.id}`, start: note.start + cursor })))
    })
    cursor += segment.duration + .28
  })
  return { id: `${song.id}-complete`, name: '完整旋律', duration: Math.max(0, cursor - .28), notes }
}
