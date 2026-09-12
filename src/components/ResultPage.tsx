import { useEffect, useRef, useState } from 'react'
import { MultiTrackPlayer } from '../audio/multitrackPlayer'
import { combineSongSegments } from '../data/songLibrary'
import type { RecordingTrack, Song } from '../types/music'
import { CopyrightNote, StageDots, StepBrief } from './Chrome'

export function ResultPage({ song, tracks, onBack, onSave }: { song: Song; tracks: RecordingTrack[]; onBack: () => void; onSave: () => void }) {
  const player = useRef(new MultiTrackPlayer())
  const [playing, setPlaying] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => () => player.current.stop(), [])

  async function toggle() {
    if (playing) { player.current.stop(); setPlaying(false); return }
    const completeSong = combineSongSegments(song)
    await player.current.play(tracks, completeSong.notes, 'hall')
    setPlaying(true)
    window.setTimeout(() => setPlaying(false), completeSong.duration * 1000 + 200)
  }

  function save() { onSave(); setSaved(true); window.setTimeout(() => setSaved(false), 2200) }

  return (
    <section className="page result-page">
      <StageDots page="result" />
      <StepBrief action="试听这次合唱" outcome="满意就保存项目状态；想换一条声部，返回重录即可。" />
      <div className="result-hero">
        <p className="eyebrow">一次小小的相遇</p><h1>三个你，<br />正在合唱。</h1>
        <button className={`result-play ${playing ? 'playing' : ''}`} onClick={toggle} aria-label={playing ? '停止播放合唱' : '重新播放合唱'}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
      </div>
      <div className={`wave-stage ${playing ? 'playing' : ''}`} aria-label="三条声部的音量动画">
        {tracks.map((track, index) => (
          <div className="wave-row" key={track.id} style={{ '--delay': `${index * .13}s` } as React.CSSProperties}>
            <span style={{ background: track.part.color }}>{track.part.shortName}</span>
            <div>{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * (index + 3)) % 17)}px` }} />)}</div>
            <small>{track.blob ? (track.alignment ? '你的录音 · 已对齐' : '你的录音') : '合成占位'}</small>
          </div>
        ))}
      </div>
      <p className="result-disclaimer">这是《{song.title}》旋律的浏览器内体验合成；没有使用商业录音，你的录音也不会上传。</p>
      <div className="download-list">
        {tracks.some((track) => track.blob) ? tracks.filter((track) => track.blob).map((track) => (
          <a key={track.id} href={track.objectUrl} download={`我的${track.part.name}.${track.blob?.type.includes('mp4') ? 'm4a' : 'webm'}`} aria-label={`下载自己录制的${track.part.name}`}>下载我的{track.part.name} <span aria-hidden="true">↓</span></a>
        )) : <p>当前使用合成占位。返回重录后，可分别下载自己的音轨。</p>}
      </div>
      {tracks.some((track) => track.blob) && <p className="raw-track-note">下载的是未经移动的独立原始音轨；合唱试听使用自动对齐版本。</p>}
      <button className="primary-button page-action" onClick={toggle}>{playing ? '停止播放' : '重新播放'} <span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
      <div className="result-actions"><button className="outline-button" onClick={onBack}>返回重录</button><button className="outline-button" onClick={save}>{saved ? '已保存' : '保存本次状态'}</button></div>
      <CopyrightNote song={song} />
    </section>
  )
}
