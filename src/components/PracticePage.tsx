import { useEffect, useRef, useState } from 'react'
import { LocalPitchTracker } from '../audio/pitchDetection'
import { ReferenceTonePlayer, type GuideMode } from '../audio/referenceTone'
import { practiceSegments } from '../data/demoSong'
import type { PitchReading } from '../types/music'
import { CopyrightNote, PageIntro, StageDots } from './Chrome'
import { PitchLane, type PitchPoint } from './PitchLane'

const modes: { id: GuideMode; label: string }[] = [
  { id: 'piano', label: '钢琴导唱' }, { id: 'choir', label: '完整合唱' }, { id: 'others', label: '只听其他声部' },
]

export function PracticePage({ onPracticed, onComplete }: { onPracticed: (id: string) => void; onComplete: () => void }) {
  const player = useRef(new ReferenceTonePlayer())
  const tracker = useRef(new LocalPitchTracker())
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [looping, setLooping] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [mode, setMode] = useState<GuideMode>('piano')
  const [pitch, setPitch] = useState<PitchReading | null>(null)
  const [pitchPoints, setPitchPoints] = useState<PitchPoint[]>([])
  const [micActive, setMicActive] = useState(false)
  const [micError, setMicError] = useState('')
  const frame = useRef(0)
  const lastTick = useRef(0)
  const elapsedRef = useRef(0)
  const segment = practiceSegments[segmentIndex]

  useEffect(() => { elapsedRef.current = elapsed }, [elapsed])
  useEffect(() => () => { player.current.stop(); tracker.current.stop(); cancelAnimationFrame(frame.current) }, [])
  useEffect(() => {
    if (!playing) return
    lastTick.current = performance.now()
    const tick = (now: number) => {
      const next = elapsedRef.current + ((now - lastTick.current) / 1000) * speed
      lastTick.current = now
      if (next >= segment.duration) {
        onPracticed(segment.id)
        if (looping) {
          elapsedRef.current = 0
          setElapsed(0)
          scheduleGuides(0)
          frame.current = requestAnimationFrame(tick)
        } else {
          elapsedRef.current = segment.duration
          setElapsed(segment.duration)
          setPlaying(false)
        }
        return
      }
      elapsedRef.current = next
      setElapsed(next)
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [playing, speed, segment, looping, onPracticed])

  useEffect(() => {
    if (micActive && pitch && playing) {
      setPitchPoints((points) => [...points.slice(-110), { time: elapsed, midi: pitch.midi }])
    }
  }, [pitch, elapsed, micActive, playing])

  async function scheduleGuides(offset: number) {
    player.current.stop()
    if (mode === 'piano') await player.current.schedule({ notes: segment.notes.alto, offset, speed, gain: .15 })
    if (mode === 'choir') {
      await Promise.all(Object.values(segment.notes).map((notes) => player.current.schedule({ notes, offset, speed, gain: .055, timbre: 'voice' })))
    }
    if (mode === 'others') {
      await Promise.all([segment.notes.soprano, segment.notes.bass].map((notes) => player.current.schedule({ notes, offset, speed, gain: .075, timbre: 'voice' })))
    }
  }

  async function togglePlay() {
    if (playing) { player.current.stop(); setPlaying(false); return }
    if (elapsed >= segment.duration) { setElapsed(0); elapsedRef.current = 0 }
    await scheduleGuides(elapsed >= segment.duration ? 0 : elapsed)
    setPlaying(true)
  }

  function restart() {
    player.current.stop(); setPlaying(false); setElapsed(0); elapsedRef.current = 0; setPitchPoints([])
  }

  function selectSegment(index: number) {
    restart(); setSegmentIndex(index)
  }

  async function enableMic() {
    setMicError('')
    try { await tracker.current.start(setPitch); setMicActive(true) }
    catch { setMicError('麦克风不可用。可以继续只听导唱练习，或在浏览器地址栏允许后重试。') }
  }

  const feedback = !playing ? '准备好时，听一遍再跟唱。' : pitch?.stable ? '这个长音很稳定' : pitch ? Math.abs(pitch.cents) < 25 ? '很接近，保持住' : '再靠近一点' : elapsed < .8 ? '别急，等指针靠近第一个音' : elapsed > 1.4 ? '进入稍晚，下一个音提前吸气' : '跟着蓝色音符轻轻唱'

  return (
    <section className="page practice-page">
      <StageDots page="practice" />
      <PageIntro eyebrow="02 · 练声部" title="让声音落在蓝色轨道上。" description="不用追求分数。先听清走向，再让每个音舒服地连起来。" />
      <div className="segment-tabs" role="tablist" aria-label="练习段落">
        {practiceSegments.map((item, index) => <button key={item.id} role="tab" aria-selected={index === segmentIndex} className={index === segmentIndex ? 'active' : ''} onClick={() => selectSegment(index)}>{item.name}</button>)}
      </div>
      <div className="practice-surface">
        <div className="mode-select" aria-label="导唱模式">{modes.map((item) => <button key={item.id} className={mode === item.id ? 'active' : ''} aria-pressed={mode === item.id} onClick={() => { setMode(item.id); if (playing) { player.current.stop(); scheduleGuides(elapsed) } }}>{item.label}</button>)}</div>
        <PitchLane notes={segment.notes.alto} duration={segment.duration} elapsed={elapsed} pitchPoints={pitchPoints} />
        <div className="time-row"><span>{elapsed.toFixed(1)}s</span><strong>{segment.name} · 中声部</strong><span>{segment.duration.toFixed(1)}s</span></div>
        <p className="live-feedback" aria-live="polite"><span aria-hidden="true">♪</span>{feedback}</p>
        <div className="transport-controls">
          <button onClick={restart} aria-label="重新开始本段"><span aria-hidden="true">↺</span><small>重来</small></button>
          <button className="play-button" onClick={togglePlay} aria-label={playing ? '暂停练习' : '播放练习'}><span aria-hidden="true">{playing ? 'Ⅱ' : '▶'}</span></button>
          <button className={looping ? 'active' : ''} onClick={() => setLooping(!looping)} aria-pressed={looping} aria-label="循环本段"><span aria-hidden="true">↻</span><small>循环</small></button>
        </div>
        <div className="speed-row" aria-label="播放速度">{[.6, .8, 1].map((value) => <button key={value} className={speed === value ? 'active' : ''} onClick={() => { setSpeed(value); if (playing) { player.current.stop(); scheduleGuides(elapsed) } }}>{value.toFixed(1)}×</button>)}</div>
      </div>
      <div className="mic-row">
        <div><strong>{micActive ? '跟唱检测已打开' : '想看见自己的音高？'}</strong><p>{micError || (micActive ? '绿色曲线会随你的声音出现。' : '只在本机分析，不会上传。')}</p></div>
        <button className="outline-button" onClick={enableMic}>{micActive ? '重新连接' : '打开检测'}</button>
      </div>
      <button className="primary-button page-action" onClick={() => { onPracticed(segment.id); onComplete() }}>去录我的声部 <span aria-hidden="true">→</span></button>
      <CopyrightNote />
    </section>
  )
}
