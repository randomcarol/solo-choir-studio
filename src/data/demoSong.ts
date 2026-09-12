import type { NoteEvent, PracticeSegment, Song, VoicePart, VoicePartId } from '../types/music'

export const voiceParts: Record<VoicePartId, VoicePart> = {
  soprano: { id: 'soprano', name: '高声部', shortName: '高', color: '#a8797d' },
  alto: { id: 'alto', name: '中声部', shortName: '中', color: '#7898b1' },
  bass: { id: 'bass', name: '低声部', shortName: '低', color: '#8e8173' },
}

const altoPatterns = [
  [60, 62, 64, 62, 59, 60],
  [57, 60, 62, 65, 64, 62],
  [64, 64, 62, 60, 59, 57],
  [60, 63, 65, 67, 65, 63],
  [62, 60, 57, 59, 60, 60],
]

const rhythms = [
  [0, .68, 1.34, 2.08, 2.76, 3.46],
  [0, .62, 1.32, 2.02, 2.82, 3.52],
  [0, .72, 1.4, 2.06, 2.78, 3.48],
  [0, .66, 1.3, 2.04, 2.72, 3.5],
  [0, .7, 1.42, 2.1, 2.8, 3.46],
]

function createNotes(segment: number, part: VoicePartId, offset: number): NoteEvent[] {
  return altoPatterns[segment].map((midi, index) => ({
    id: `${segment + 1}-${part}-${index + 1}`,
    start: rhythms[segment][index],
    duration: index === 5 ? 1.18 : index % 2 === 0 ? .58 : .52,
    midi: midi + offset,
  }))
}

export const practiceSegments: PracticeSegment[] = altoPatterns.map((_, index) => ({
  id: `segment-${index + 1}`,
  name: `第 ${index + 1} 段`,
  duration: 5,
  notes: {
    soprano: createNotes(index, 'soprano', 7),
    alto: createNotes(index, 'alto', 0),
    bass: createNotes(index, 'bass', -12),
  },
}))

export const demoSong: Song = {
  id: 'caihong-demo',
  title: '彩虹',
  artist: '上海彩虹室内合唱团',
  songwriter: '金承志',
  segments: practiceSegments,
}

export const assessmentMidi = [55, 58, 60, 62, 65]

export const assessmentPhraseNotes: NoteEvent[] = assessmentMidi.map((midi, index) => ({
  id: `assessment-phrase-${index + 1}`,
  start: index * .72,
  duration: index === assessmentMidi.length - 1 ? 1.1 : .58,
  midi,
}))

export const assessmentPhraseDuration = 4.2

export const COPYRIGHT_NOTICE = '当前为产品体验版，示例旋律并非原曲。'

export const AUTHORIZED_ASSET_ADAPTER: AuthorizedAssetAdapter = {
  musicXml: null,
  midi: null,
  stems: {},
}

export interface AuthorizedAssetAdapter {
  musicXml: string | null
  midi: string | null
  stems: Partial<Record<VoicePartId, string>>
}
