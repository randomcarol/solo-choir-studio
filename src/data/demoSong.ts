import type { NoteEvent, PracticeSegment, Song, VoicePart, VoicePartId } from '../types/music'

export const voiceParts: Record<VoicePartId, VoicePart> = {
  soprano: { id: 'soprano', name: '高声部', shortName: '高', color: '#a8797d' },
  alto: { id: 'alto', name: '中声部', shortName: '中', color: '#7898b1' },
  bass: { id: 'bass', name: '低声部', shortName: '低', color: '#8e8173' },
}

// 完全虚构的五句示例：三条声部采用较平稳的三和声音型，避免机械式平行五度。
const partPatterns: Record<VoicePartId, number[][]> = {
  soprano: [
    [64, 65, 67, 71, 67, 65],
    [65, 67, 69, 72, 71, 67],
    [67, 71, 72, 71, 67, 65],
    [71, 72, 71, 67, 65, 64],
    [67, 65, 64, 65, 64, 64],
  ],
  alto: [
    [60, 62, 64, 67, 64, 62],
    [62, 64, 65, 69, 67, 64],
    [64, 67, 69, 67, 64, 62],
    [67, 69, 67, 64, 62, 60],
    [64, 62, 60, 62, 60, 60],
  ],
  bass: [
    [48, 50, 48, 43, 48, 50],
    [50, 48, 53, 53, 55, 48],
    [48, 43, 41, 43, 48, 50],
    [43, 41, 43, 48, 50, 48],
    [48, 50, 48, 43, 48, 48],
  ],
}

const rhythms = [
  [0, .68, 1.34, 2.08, 2.76, 3.46],
  [0, .62, 1.32, 2.02, 2.82, 3.52],
  [0, .72, 1.4, 2.06, 2.78, 3.48],
  [0, .66, 1.3, 2.04, 2.72, 3.5],
  [0, .7, 1.42, 2.1, 2.8, 3.46],
]

function createNotes(segment: number, part: VoicePartId): NoteEvent[] {
  return partPatterns[part][segment].map((midi, index) => ({
    id: `${segment + 1}-${part}-${index + 1}`,
    start: rhythms[segment][index],
    duration: index === 5 ? 1.18 : index % 2 === 0 ? .58 : .52,
    midi,
  }))
}

export const practiceSegments: PracticeSegment[] = partPatterns.alto.map((_, index) => ({
  id: `segment-${index + 1}`,
  name: `第 ${index + 1} 段`,
  duration: 5,
  notes: {
    soprano: createNotes(index, 'soprano'),
    alto: createNotes(index, 'alto'),
    bass: createNotes(index, 'bass'),
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
