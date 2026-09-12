import { useEffect, useRef, useState } from 'react'
import { analyzeRecordingAlignment } from '../audio/alignment'
import { resumeAudioContext } from '../audio/audioContext'
import { MultiTrackPlayer, type ReverbPreset } from '../audio/multitrackPlayer'
import { SessionRecorder } from '../audio/recordingManager'
import { ReferenceTonePlayer } from '../audio/referenceTone'
import { combineSongSegments } from '../data/songLibrary'
import type { RecordingTrack, Song, VoicePartId } from '../types/music'
import { CopyrightNote, PageIntro, StageDots, StepBrief } from './Chrome'

export function RecordPage({ song, tracks, setTracks, onRecorded, onComplete }: {
  song: Song
  tracks: RecordingTrack[]
  setTracks: React.Dispatch<React.SetStateAction<RecordingTrack[]>>
  onRecorded: (id: VoicePartId) => void
  onComplete: () => void
}) {
  const recorder = useRef(new SessionRecorder())
  const multiPlayer = useRef(new MultiTrackPlayer())
  const guidePlayer = useRef(new ReferenceTonePlayer())
  const expectedOnsets = useRef(new Map<VoicePartId, number>())
  const [activeTrack, setActiveTrack] = useState<VoicePartId | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [reverb, setReverb] = useState<ReverbPreset>('hall')
  const [playingAll, setPlayingAll] = useState(false)
  const segment = combineSongSegments(song)

  useEffect(() => () => { recorder.current.dispose(); multiPlayer.current.stop(); guidePlayer.current.stop() }, [])

  function updateTrack(id: VoicePartId, patch: Partial<RecordingTrack>) {
    setTracks((current) => current.map((track) => track.id === id ? { ...track, ...patch } : track))
  }

  async function startRecording(id: VoicePartId) {
    setError('')
    multiPlayer.current.stop()
    let captureStarted = false
    try {
      await recorder.current.prepare()
      const captureStartedAt = await recorder.current.start()
      captureStarted = true
      setActiveTrack(id)
      updateTrack(id, { status: 'counting' })
      for (let beat = 4; beat >= 1; beat -= 1) {
        setCountdown(beat)
        await guidePlayer.current.playNote(72, .1, .07)
        await new Promise((resolve) => setTimeout(resolve, 620))
      }
      setCountdown(null)
      const context = await resumeAudioContext()
      const musicalStartAt = context.currentTime + .06
      expectedOnsets.current.set(id, Math.max(0, musicalStartAt - captureStartedAt))
      updateTrack(id, { status: 'recording', startedAt: captureStartedAt, alignment: undefined })
      const otherParts = tracks.filter((track) => track.id !== id)
      await Promise.all(otherParts.map((track) => guidePlayer.current.schedule({ notes: segment.notes[track.id], gain: .048, timbre: 'voice', when: musicalStartAt })))
    } catch {
      if (captureStarted) {
        try {
          const abandoned = await recorder.current.stop()
          URL.revokeObjectURL(abandoned.objectUrl)
        } catch { /* recorder already stopped */ }
      }
      setCountdown(null)
      setActiveTrack(null)
      updateTrack(id, { status: 'empty' })
      setError('没有取得麦克风权限。请在浏览器地址栏允许后重试；也可以保留合成哼唱占位，继续体验合唱。')
    }
  }

  async function stopRecording() {
    if (!activeTrack) return
    guidePlayer.current.stop()
    try {
      const result = await recorder.current.stop()
      const expectedOnset = expectedOnsets.current.get(activeTrack) ?? 0
      let alignment
      try {
        alignment = await analyzeRecordingAlignment(result.blob, expectedOnset)
      } catch {
        alignment = {
          expectedOnset,
          detectedOnset: expectedOnset,
          offsetSeconds: 0,
          trimSeconds: expectedOnset,
          confidence: 0,
        }
      }
      const previous = tracks.find((track) => track.id === activeTrack)
      if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl)
      updateTrack(activeTrack, { status: 'ready', ...result, alignment })
      onRecorded(activeTrack)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '录音未能保存，请重试。')
    }
    setActiveTrack(null)
  }

  function deleteTrack(id: VoicePartId) {
    const track = tracks.find((item) => item.id === id)
    if (track?.objectUrl) URL.revokeObjectURL(track.objectUrl)
    expectedOnsets.current.delete(id)
    updateTrack(id, { status: 'empty', blob: undefined, objectUrl: undefined, duration: undefined, startedAt: undefined, alignment: undefined })
  }

  async function playTrack(track: RecordingTrack) {
    await multiPlayer.current.playSingle(track)
  }

  function alignmentLabel(track: RecordingTrack): string {
    if (!track.alignment || track.alignment.confidence === 0) return '已按倒计时拍点对齐'
    const milliseconds = Math.round(Math.abs(track.alignment.offsetSeconds) * 1000)
    if (milliseconds < 45) return '进入很准 · 已自动对齐'
    return track.alignment.offsetSeconds > 0
      ? `晚进入 ${milliseconds}ms · 合唱时已前移`
      : `早进入 ${milliseconds}ms · 合唱时已后移`
  }

  async function toggleAll() {
    if (playingAll) {
      multiPlayer.current.stop()
      setPlayingAll(false)
      return
    }
    try {
      await multiPlayer.current.play(tracks, segment.notes, reverb)
      setPlayingAll(true)
      window.setTimeout(() => setPlayingAll(false), segment.duration * 1000 + 200)
    } catch {
      setError('有一条录音暂时无法解码，删除后重新录制即可。')
    }
  }

  return (
    <section className="page record-page">
      <StageDots page="record" />
      <PageIntro eyebrow={`第 3 步 · ${song.title}`} title="先录中声部，再听三个你。" description="四拍后从头唱完整旋律；即使进早或进晚，合唱试听也会自动对齐。" />
      <StepBrief action="至少录下推荐的中声部" outcome="高、低声部想唱时再替换，不是必做；录完直接点底部听合唱。" />
      {countdown !== null && <div className="countdown-overlay" role="status" aria-live="assertive"><small>准备吸气</small><strong>{countdown}</strong><span>四拍后开始</span></div>}
      {error && <div className="inline-error" role="alert"><p>{error}</p><button onClick={() => setError('')}>知道了</button></div>}

      <div className="track-list">
        {tracks.map((track) => (
          <article className={`track-card ${track.id === 'alto' ? 'recommended' : ''}`} key={track.id}>
            <div className="track-heading">
              <span className="part-chip" style={{ background: track.part.color }}>{track.part.shortName}</span>
              <div>
                <h2>{track.part.name}{track.id === 'alto' && <em>先录这个</em>}</h2>
                <p>{track.status === 'ready' ? `你的独立录音 · ${Math.max(0, (track.duration ?? 0) - (track.alignment?.trimSeconds ?? 0)).toFixed(1)} 秒` : track.status === 'recording' ? '正在录制你的声音…' : track.status === 'counting' ? '已经收音 · 四拍倒计时…' : '柔和合成哼唱占位（非真人）'}</p>
              </div>
              <div className={`level-bars ${track.status === 'recording' ? 'moving' : ''}`} aria-hidden="true">{[2, 4, 7, 5, 3].map((n, i) => <i key={i} style={{ height: `${n * 3}px` }} />)}</div>
            </div>
            {track.status === 'ready' && <p className="alignment-note">{alignmentLabel(track)}。原始音轨保持不变。</p>}
            <div className={`track-actions ${track.status === 'ready' ? 'three-actions' : 'one-action'}`}>
              {track.status === 'recording' ? (
                <button className="record-stop" onClick={stopRecording} aria-label={`停止录制${track.part.name}`}><span aria-hidden="true">■</span> 唱完了，停止录制</button>
              ) : track.status === 'ready' ? (
                <>
                  <button onClick={() => playTrack(track)} aria-label={`播放${track.part.name}录音`}><span aria-hidden="true">▶</span> 播放</button>
                  <button onClick={() => startRecording(track.id)} disabled={activeTrack !== null} aria-label={`重新录制${track.part.name}`}><span aria-hidden="true">●</span> 重录</button>
                  <button onClick={() => deleteTrack(track.id)} aria-label={`删除${track.part.name}录音`}><span aria-hidden="true">×</span> 删除</button>
                </>
              ) : (
                <button onClick={() => startRecording(track.id)} disabled={activeTrack !== null} aria-label={`录制${track.part.name}`}><span aria-hidden="true">●</span> {track.id === 'alto' ? '录制推荐中声部' : `替换${track.part.name}占位`}</button>
              )}
            </div>
            <details className="track-mix">
              <summary>声音设置</summary>
              <div className="mix-controls">
                <label>音量 <input aria-label={`${track.part.name}音量`} type="range" min="0" max="1" step="0.05" value={track.volume} onChange={(event) => updateTrack(track.id, { volume: Number(event.target.value) })} /></label>
                <button className={track.muted ? 'active' : ''} onClick={() => updateTrack(track.id, { muted: !track.muted })} aria-pressed={track.muted}>静音</button>
                <button className={track.solo ? 'active' : ''} onClick={() => updateTrack(track.id, { solo: !track.solo })} aria-pressed={track.solo}>独奏</button>
              </div>
            </details>
          </article>
        ))}
      </div>

      <details className="optional-mix">
        <summary>混音设置（可选）</summary>
        <div className="mix-footer">
          <fieldset><legend>房间声音</legend><button className={reverb === 'hall' ? 'active' : ''} onClick={() => setReverb('hall')}>排练厅</button><button className={reverb === 'intimate' ? 'active' : ''} onClick={() => setReverb('intimate')}>亲密房间</button></fieldset>
          <label className="tune-placeholder"><input type="checkbox" disabled /> <span><strong>轻度修音</strong><small>功能占位 · 尚未实现</small></span></label>
        </div>
      </details>
      <button className="secondary-button listen-all" onClick={toggleAll}>{playingAll ? '停止合唱' : '先试听三个声部'} <span aria-hidden="true">{playingAll ? '■' : '▶'}</span></button>
      <button className="primary-button page-action" onClick={onComplete}>完成录音，听见三个我 <span aria-hidden="true">→</span></button>
      <CopyrightNote song={song} />
    </section>
  )
}
