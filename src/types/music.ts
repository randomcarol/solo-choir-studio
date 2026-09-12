export type AppPage = 'home' | 'assessment' | 'practice' | 'record' | 'result'

export type VoicePartId = 'soprano' | 'alto' | 'bass'

export interface NoteEvent {
  id: string
  start: number
  duration: number
  midi: number
}

export interface VoicePart {
  id: VoicePartId
  name: string
  shortName: string
  color: string
}

export interface PracticeSegment {
  id: string
  name: string
  duration: number
  notes: Record<VoicePartId, NoteEvent[]>
}

export interface Song {
  id: string
  title: string
  artist: string
  songwriter: string
  segments: PracticeSegment[]
}

export interface PitchReading {
  frequency: number
  midi: number
  noteName: string
  cents: number
  clarity: number
  stable: boolean
  capturedAt: number
}

export interface TrackAlignment {
  /** 倒计时结束的拍点在原始录音中的位置。 */
  expectedOnset: number
  /** 本地能量检测找到的第一次稳定发声。 */
  detectedOnset: number
  /** 正数表示唱晚了，负数表示唱早了。 */
  offsetSeconds: number
  /** 合唱试听时从原始音轨的这个位置开始播放。 */
  trimSeconds: number
  confidence: number
}

export interface RecordingTrack {
  id: VoicePartId
  part: VoicePart
  status: 'empty' | 'counting' | 'recording' | 'ready'
  blob?: Blob
  objectUrl?: string
  duration?: number
  volume: number
  muted: boolean
  solo: boolean
  startedAt?: number
  alignment?: TrackAlignment
}

export interface SavedProject {
  songId: string
  page: AppPage
  assessmentComplete: boolean
  practicedSegments: string[]
  recordedParts: VoicePartId[]
  updatedAt: string
}

export interface AuthorizedMusicAsset {
  kind: 'musicxml' | 'midi' | 'stem-audio'
  url: string
  part?: VoicePartId
}
