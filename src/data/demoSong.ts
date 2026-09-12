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
  [0, 1.1, 2.05, 3.2, 4.2, 5.15],
  [0, .9, 2, 3.05, 4.4, 5.25],
  [0, 1.25, 2.15, 3.05, 4.15, 5.1],
  [0, 1, 1.9, 3.1, 4.05, 5.2],
  [0, 1.1, 2.25, 3.15, 4.15, 5.05],
]

function createNotes(segment: number, part: VoicePartId, offset: number): NoteEvent[] {
  return altoPatterns[segment].map((midi, index) => ({
    id: `${segment + 1}-${part}-${index + 1}`,
    start: rhythms[segment][index],
    duration: index === 5 ? 1.45 : index % 2 === 0 ? .82 : .68,
    midi: midi + offset,
  }))
}

export const practiceSegments: PracticeSegment[] = altoPatterns.map((_, index) => ({
  id: `segment-${index + 1}`,
  name: `第 ${index + 1} 段`,
  duration: 7,
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
