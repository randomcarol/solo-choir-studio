import { useEffect, useRef, useState } from 'react'
import { MultiTrackPlayer } from '../audio/multitrackPlayer'
import { practiceSegments } from '../data/demoSong'
import type { RecordingTrack } from '../types/music'
import { CopyrightNote, StageDots } from './Chrome'

export function ResultPage({ tracks, onBack, onSave }: { tracks: RecordingTrack[]; onBack: () => void; onSave: () => void }) {
  const player = useRef(new MultiTrackPlayer())
  const [playing, setPlaying] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => () => player.current.stop(), [])

  async function toggle() {
    if (playing) { player.current.stop(); setPlaying(false); return }
    await player.current.play(tracks, practiceSegments[0].notes, 'hall')
    setPlaying(true)
    window.setTimeout(() => setPlaying(false), practiceSegments[0].duration * 1000 + 200)
  }

  function save() { onSave(); setSaved(true); window.setTimeout(() => setSaved(false), 2200) }

  return (
    <section className="page result-page">
      <StageDots page="result" />
      <div className="result-hero">
        <p className="eyebrow">一次小小的相遇</p><h1>三个你，<br />正在合唱。</h1>
        <button className={`result-play ${playing ? 'playing' : ''}`} onClick={toggle} aria-label={playing ? '停止播放合唱' : '重新播放合唱'}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
      </div>
      <div className={`wave-stage ${playing ? 'playing' : ''}`} aria-label="三条声部的音量动画">
        {tracks.map((track, index) => (
          <div className="wave-row" key={track.id} style={{ '--delay': `${index * .13}s` } as React.CSSProperties}>
            <span style={{ background: track.part.color }}>{track.part.shortName}</span>
            <div>{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * (index + 3)) % 17)}px` }} />)}</div>
            <small>{track.blob ? '你的录音' : 'AI 占位'}</small>
          </div>
        ))}
      </div>
      <p className="result-disclaimer">这是一段浏览器内的体验合成，不是正式《彩虹》作品。你的录音不会上传。</p>
      <div className="download-list">
        {tracks.some((track) => track.blob) ? tracks.filter((track) => track.blob).map((track) => (
          <a key={track.id} href={track.objectUrl} download={`我的${track.part.name}.${track.blob?.type.includes('mp4') ? 'm4a' : 'webm'}`} aria-label={`下载自己录制的${track.part.name}`}>下载我的{track.part.name} <span aria-hidden="true">↓</span></a>
        )) : <p>当前使用合成占位。返回重录后，可分别下载自己的音轨。</p>}
      </div>
      <button className="primary-button page-action" onClick={toggle}>{playing ? '停止播放' : '重新播放'} <span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
      <div className="result-actions"><button className="outline-button" onClick={onBack}>返回重录</button><button className="outline-button" onClick={save}>{saved ? '已保存' : '保存本次状态'}</button></div>
      <CopyrightNote />
    </section>
  )
}
