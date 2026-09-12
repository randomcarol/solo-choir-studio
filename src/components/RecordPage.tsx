import { useEffect, useRef, useState } from 'react'
import { MultiTrackPlayer, type ReverbPreset } from '../audio/multitrackPlayer'
import { SessionRecorder } from '../audio/recordingManager'
import { ReferenceTonePlayer } from '../audio/referenceTone'
import { practiceSegments } from '../data/demoSong'
import type { RecordingTrack, VoicePartId } from '../types/music'
import { CopyrightNote, PageIntro, StageDots } from './Chrome'

export function RecordPage({ tracks, setTracks, onRecorded, onComplete }: {
  tracks: RecordingTrack[]
  setTracks: React.Dispatch<React.SetStateAction<RecordingTrack[]>>
  onRecorded: (id: VoicePartId) => void
  onComplete: () => void
}) {
  const recorder = useRef(new SessionRecorder())
  const multiPlayer = useRef(new MultiTrackPlayer())
  const guidePlayer = useRef(new ReferenceTonePlayer())
  const [activeTrack, setActiveTrack] = useState<VoicePartId | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [reverb, setReverb] = useState<ReverbPreset>('hall')
  const [playingAll, setPlayingAll] = useState(false)
  const segment = practiceSegments[0]

  useEffect(() => () => { recorder.current.dispose(); multiPlayer.current.stop(); guidePlayer.current.stop() }, [])

  function updateTrack(id: VoicePartId, patch: Partial<RecordingTrack>) {
    setTracks((current) => current.map((track) => track.id === id ? { ...track, ...patch } : track))
  }

  async function startRecording(id: VoicePartId) {
    setError('')
    multiPlayer.current.stop()
    try {
      await recorder.current.prepare()
      setActiveTrack(id)
      updateTrack(id, { status: 'counting' })
      for (let beat = 4; beat >= 1; beat -= 1) {
        setCountdown(beat)
        await guidePlayer.current.playNote(72, .1, .07)
        await new Promise((resolve) => setTimeout(resolve, 620))
      }
      setCountdown(null)
      const startedAt = await recorder.current.start()
      updateTrack(id, { status: 'recording', startedAt })
      const otherParts = tracks.filter((track) => track.id !== id)
      await Promise.all(otherParts.map((track) => guidePlayer.current.schedule({ notes: segment.notes[track.id], gain: .055, timbre: 'voice', when: startedAt + .05 })))
    } catch {
      setCountdown(null); setActiveTrack(null); updateTrack(id, { status: 'empty' })
      setError('没有取得麦克风权限。请在浏览器地址栏允许后重试；也可以保留 AI 哼唱占位，继续体验合唱。')
    }
  }

  async function stopRecording() {
    if (!activeTrack) return
    guidePlayer.current.stop()
    try {
      const result = await recorder.current.stop()
      const previous = tracks.find((track) => track.id === activeTrack)
      if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl)
      updateTrack(activeTrack, { status: 'ready', ...result })
      onRecorded(activeTrack)
    } catch (reason) { setError(reason instanceof Error ? reason.message : '录音未能保存，请重试。') }
    setActiveTrack(null)
  }

  function deleteTrack(id: VoicePartId) {
    const track = tracks.find((item) => item.id === id)
    if (track?.objectUrl) URL.revokeObjectURL(track.objectUrl)
    updateTrack(id, { status: 'empty', blob: undefined, objectUrl: undefined, duration: undefined, startedAt: undefined })
  }

  async function playTrack(track: RecordingTrack) {
    if (!track.objectUrl) return
    const audio = new Audio(track.objectUrl)
    audio.volume = track.volume
    await audio.play()
  }

  async function toggleAll() {
    if (playingAll) { multiPlayer.current.stop(); setPlayingAll(false); return }
    try {
      await multiPlayer.current.play(tracks, segment.notes, reverb)
      setPlayingAll(true)
      window.setTimeout(() => setPlayingAll(false), segment.duration * 1000 + 200)
    } catch { setError('有一条录音暂时无法解码，删除后重新录制即可。') }
  }

  return (
    <section className="page record-page">
      <StageDots page="record" />
      <PageIntro eyebrow="03 · 合起来" title="把另外两个你，也录进来。" description="中声部是你的默认位置。其他声部先用合成哼唱占位，随时可以替换。" />
      {countdown !== null && <div className="countdown-overlay" role="status" aria-live="assertive"><small>准备吸气</small><strong>{countdown}</strong><span>四拍后开始</span></div>}
      {error && <div className="inline-error" role="alert"><p>{error}</p><button onClick={() => setError('')}>知道了</button></div>}

      <div className="track-list">
        {tracks.map((track) => (
          <article className={`track-card ${track.id === 'alto' ? 'recommended' : ''}`} key={track.id}>
            <div className="track-heading">
              <span className="part-chip" style={{ background: track.part.color }}>{track.part.shortName}</span>
              <div><h2>{track.part.name}{track.id === 'alto' && <em>推荐</em>}</h2><p>{track.status === 'ready' ? `你的录音 · ${track.duration?.toFixed(1)} 秒` : track.status === 'recording' ? '正在录制你的声音…' : 'AI 哼唱占位'}</p></div>
              <div className={`level-bars ${track.status === 'recording' ? 'moving' : ''}`} aria-hidden="true">{[2, 4, 7, 5, 3].map((n, i) => <i key={i} style={{ height: `${n * 3}px` }} />)}</div>
            </div>
            <div className="track-actions">
              {track.status === 'recording' ? <button className="record-stop" onClick={stopRecording} aria-label={`停止录制${track.part.name}`}><span aria-hidden="true">■</span> 停止</button> : <button onClick={() => startRecording(track.id)} disabled={activeTrack !== null} aria-label={`${track.status === 'ready' ? '重新录制' : '录制'}${track.part.name}`}><span aria-hidden="true">●</span> {track.status === 'ready' ? '重录' : '录制'}</button>}
              <button onClick={() => playTrack(track)} disabled={!track.objectUrl} aria-label={`播放${track.part.name}录音`}><span aria-hidden="true">▶</span> 播放</button>
              <button onClick={() => deleteTrack(track.id)} disabled={!track.blob} aria-label={`删除${track.part.name}录音`}><span aria-hidden="true">×</span> 删除</button>
            </div>
            <div className="mix-controls">
              <label>音量 <input aria-label={`${track.part.name}音量`} type="range" min="0" max="1" step="0.05" value={track.volume} onChange={(event) => updateTrack(track.id, { volume: Number(event.target.value) })} /></label>
              <button className={track.muted ? 'active' : ''} onClick={() => updateTrack(track.id, { muted: !track.muted })} aria-pressed={track.muted}>静音</button>
              <button className={track.solo ? 'active' : ''} onClick={() => updateTrack(track.id, { solo: !track.solo })} aria-pressed={track.solo}>独奏</button>
            </div>
          </article>
        ))}
      </div>

      <div className="mix-footer">
        <fieldset><legend>房间声音</legend><button className={reverb === 'hall' ? 'active' : ''} onClick={() => setReverb('hall')}>排练厅</button><button className={reverb === 'intimate' ? 'active' : ''} onClick={() => setReverb('intimate')}>亲密房间</button></fieldset>
        <label className="tune-placeholder"><input type="checkbox" disabled /> <span><strong>轻度修音</strong><small>功能占位 · 尚未实现</small></span></label>
      </div>
      <button className="secondary-button listen-all" onClick={toggleAll}>{playingAll ? '停止合唱' : '试听全部声部'} <span aria-hidden="true">{playingAll ? '■' : '▶'}</span></button>
      <button className="primary-button page-action" onClick={onComplete}>听见三个我 <span aria-hidden="true">→</span></button>
      <CopyrightNote />
    </section>
  )
}
