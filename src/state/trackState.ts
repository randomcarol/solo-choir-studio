import { voiceParts } from '../data/demoSong'
import type { RecordingTrack, VoicePartId } from '../types/music'

export function createInitialTracks(): RecordingTrack[] {
  return (['alto', 'soprano', 'bass'] as VoicePartId[]).map((id) => ({
    id,
    part: voiceParts[id],
    status: 'empty',
    volume: id === 'alto' ? .9 : .72,
    muted: false,
    solo: false,
  }))
}
