import type { NoteEvent } from '../types/music'

export interface PitchPoint { time: number; midi: number }

export function PitchLane({ notes, duration, elapsed, pitchPoints }: { notes: NoteEvent[]; duration: number; elapsed: number; pitchPoints: PitchPoint[] }) {
  const minMidi = 45
  const maxMidi = 72
  const y = (midi: number) => 88 - ((midi - minMidi) / (maxMidi - minMidi)) * 76
  const points = pitchPoints.map((point) => `${(point.time / duration) * 100},${y(point.midi)}`).join(' ')
  return (
    <div className="pitch-lane" aria-label="横轴为时间、纵轴为音高的练习轨道">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="蓝色为目标音符，绿色为你的音高">
        {[18, 35, 52, 69, 86].map((line) => <line key={line} x1="0" x2="100" y1={line} y2={line} className="grid-line" />)}
        {notes.map((note) => <rect key={note.id} x={(note.start / duration) * 100} y={y(note.midi) - 2.4} width={Math.max(3, (note.duration / duration) * 100)} height="4.8" rx="2" className="target-note" />)}
        {points && <polyline points={points} className="user-pitch" />}
        <line x1={(elapsed / duration) * 100} x2={(elapsed / duration) * 100} y1="4" y2="94" className="playhead" />
      </svg>
      <span className="lane-high">高</span><span className="lane-low">低</span>
      <div className="lane-legend"><span><i className="blue" />目标音</span><span><i className="green" />你的声音</span></div>
    </div>
  )
}
