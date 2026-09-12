import { useEffect, useRef, useState } from 'react'
import { LocalPitchTracker } from '../audio/pitchDetection'
import { ReferenceTonePlayer } from '../audio/referenceTone'
import { practiceSegments } from '../data/demoSong'
import { createSimulatedPitchPoints } from '../state/practiceFlow'
import type { PitchReading } from '../types/music'
import { CopyrightNote, PageIntro, StageDots, StepBrief } from './Chrome'
import { PitchLane, type PitchPoint } from './PitchLane'

type PhrasePhase = 'listen-ready' | 'listening' | 'sing-ready' | 'singing' | 'review' | 'mic-error'

export function PracticePage({ onPracticed, onComplete }: { onPracticed: (id: string) => void; onComplete: () => void }) {
  const player = useRef(new ReferenceTonePlayer())
  const tracker = useRef(new LocalPitchTracker())
  const frame = useRef(0)
  const lastTick = useRef(0)
  const elapsedRef = useRef(0)
  const [sentenceIndex, setSentenceIndex] = useState(0)
  const [phase, setPhase] = useState<PhrasePhase>('listen-ready')
  const [elapsed, setElapsed] = useState(0)
  const [pitch, setPitch] = useState<PitchReading | null>(null)
  const [pitchPoints, setPitchPoints] = useState<PitchPoint[]>([])
  const [micError, setMicError] = useState('')
  const segment = practiceSegments[sentenceIndex]
  const running = phase === 'listening' || phase === 'singing'

  useEffect(() => { elapsedRef.current = elapsed }, [elapsed])
  useEffect(() => () => {
    player.current.stop()
    tracker.current.stop()
    cancelAnimationFrame(frame.current)
  }, [])

  useEffect(() => {
    if (!running) return
    lastTick.current = performance.now()
    const tick = (now: number) => {
      const next = elapsedRef.current + (now - lastTick.current) / 1000
      lastTick.current = now
      if (next >= segment.duration) {
        elapsedRef.current = segment.duration
        setElapsed(segment.duration)
        player.current.stop()
        if (phase === 'listening') setPhase('sing-ready')
        if (phase === 'singing') {
          tracker.current.stop()
          onPracticed(segment.id)
          setPhase('review')
        }
        return
      }
      elapsedRef.current = next
      setElapsed(next)
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [running, phase, segment, onPracticed])

  useEffect(() => {
    if (phase === 'singing' && pitch) {
      setPitchPoints((points) => [...points.slice(-150), { time: elapsed, midi: pitch.midi }])
    }
  }, [pitch, elapsed, phase])

  function resetRun() {
    player.current.stop()
    cancelAnimationFrame(frame.current)
    setElapsed(0)
    elapsedRef.current = 0
  }

  async function listenPhrase() {
    resetRun()
    setPhase('listening')
    await player.current.schedule({ notes: segment.notes.alto, gain: .16 })
  }

  async function singPhrase() {
    resetRun()
    setMicError('')
    setPitch(null)
    setPitchPoints([])
    try {
      await tracker.current.start(setPitch)
      setPhase('singing')
      await player.current.schedule({ notes: segment.notes.alto, gain: .055 })
    } catch {
      setMicError('没有取得麦克风权限。请在浏览器地址栏允许后重试，或用模拟跟唱继续。')
      setPhase('mic-error')
    }
  }

  function simulatePhrase() {
    tracker.current.stop()
    resetRun()
    setPitchPoints(createSimulatedPitchPoints(segment.notes.alto, segment.duration))
    setElapsed(segment.duration)
    elapsedRef.current = segment.duration
    onPracticed(segment.id)
    setPhase('review')
  }

  function advance() {
    if (sentenceIndex === practiceSegments.length - 1) {
      onComplete()
      return
    }
    setSentenceIndex((index) => index + 1)
    setPitchPoints([])
    setPitch(null)
    setElapsed(0)
    elapsedRef.current = 0
    setPhase('listen-ready')
  }

  function retryPhrase() {
    setPitchPoints([])
    setElapsed(0)
    elapsedRef.current = 0
    setPhase('sing-ready')
  }

  const feedback = pitchPoints.length > 18 ? '整句已经连起来了，这个长音也很稳定。' : '这一句已经完成。下一句继续保持自然呼吸。'
  const phaseLabel = phase === 'listen-ready' || phase === 'listening' ? '① 先听' : phase === 'sing-ready' || phase === 'singing' || phase === 'mic-error' ? '② 跟唱' : '✓ 完成'

  return (
    <section className="page practice-page phrase-practice-page">
      <StageDots page="practice" />
      <PageIntro eyebrow="第 2 步 · 练声部" title="一句一句，听完就跟唱。" description="共 5 句虚构旋律。每句完整听一遍、完整唱一遍，不再逐个音停顿。" />
      <StepBrief action="完成 5 句整句跟唱" outcome="每句约 5 秒；完成当前句后，唯一的主按钮会带你去下一句。" />

      <div className="sentence-status">
        <div><small>中声部练习</small><strong>第 {sentenceIndex + 1} 句 <em>/ 共 {practiceSegments.length} 句</em></strong></div>
        <span>{phaseLabel}</span>
      </div>
      <div className="sentence-progress" aria-label={`已到第 ${sentenceIndex + 1} 句，共 ${practiceSegments.length} 句`}>
        {practiceSegments.map((item, index) => <i key={item.id} className={index < sentenceIndex ? 'done' : index === sentenceIndex ? 'active' : ''} />)}
      </div>

      <div className="practice-surface phrase-surface">
        <div className="phrase-task">
          <small>{phase === 'listening' ? '现在只听，不用唱' : phase === 'singing' ? '现在从头跟唱，不要停' : phase === 'review' ? '这一句完成了' : '练习口型'}</small>
          <strong>{phase === 'review' ? '很好，整句唱完了' : '啦 — 啦啦 — 啦 —'}</strong>
        </div>

        {phase === 'listen-ready' && <div className="single-action"><p><strong>先做这件事：</strong>完整听一遍，记住旋律走向。</p><button className="light-primary" onClick={listenPhrase}>听第 {sentenceIndex + 1} 句 <span aria-hidden="true">▶</span></button></div>}
        {phase === 'listening' && <p className="phrase-running" role="status"><span className="pulse-dot" />正在播放整句，请先听…</p>}
        {phase === 'sing-ready' && <div className="single-action"><p><strong>轮到你：</strong>用“啦”从头唱到尾，途中不用点任何按钮。</p><button className="light-primary" onClick={singPhrase}>开始跟唱第 {sentenceIndex + 1} 句 <span aria-hidden="true">→</span></button><button className="surface-link" onClick={listenPhrase}>再听一遍</button><button className="surface-link quiet" onClick={simulatePhrase}>没有麦克风，模拟跟唱</button></div>}
        {phase === 'singing' && <div className="phrase-running-block"><p className="phrase-running" role="status"><span className="pulse-dot" />正在跟唱整句，唱完会自动停止</p><strong>{pitch?.stable ? '声音很稳定，继续往后唱' : pitch ? '再靠近蓝色音符一点' : '跟着导唱继续唱“啦”'}</strong></div>}
        {phase === 'mic-error' && <div className="single-action error-on-dark" role="alert"><p>{micError}</p><button className="light-primary" onClick={singPhrase}>重新连接麦克风</button><button className="surface-link" onClick={simulatePhrase}>模拟跟唱并继续</button></div>}
        {phase === 'review' && <div className="single-action phrase-review"><p><strong>{feedback}</strong><span>{sentenceIndex === practiceSegments.length - 1 ? '五句都完成了，下一步开始录制声部。' : `接下来听第 ${sentenceIndex + 2} 句。`}</span></p><button className="light-primary" onClick={advance}>{sentenceIndex === practiceSegments.length - 1 ? '下一步：开始录音' : `下一句：第 ${sentenceIndex + 2} 句`} <span aria-hidden="true">→</span></button><button className="surface-link" onClick={retryPhrase}>再唱一次这句</button></div>}
        <PitchLane notes={segment.notes.alto} duration={segment.duration} elapsed={elapsed} pitchPoints={pitchPoints} />
        <div className="time-row"><span>{elapsed.toFixed(1)}s</span><strong>第 {sentenceIndex + 1} 句 · 中声部</strong><span>{segment.duration.toFixed(1)}s</span></div>
      </div>
      <CopyrightNote />
    </section>
  )
}
