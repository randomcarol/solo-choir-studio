import { useEffect, useMemo, useRef, useState } from 'react'
import { assessmentMidi } from '../data/demoSong'
import { LocalPitchTracker, midiToNoteName } from '../audio/pitchDetection'
import { ReferenceTonePlayer } from '../audio/referenceTone'
import type { PitchReading } from '../types/music'
import { CopyrightNote, PageIntro, StageDots } from './Chrome'

type AssessmentStatus = 'idle' | 'listening' | 'result' | 'error'

export function AssessmentPage({ onComplete }: { onComplete: () => void }) {
  const tracker = useRef(new LocalPitchTracker())
  const player = useRef(new ReferenceTonePlayer())
  const [status, setStatus] = useState<AssessmentStatus>('idle')
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<'up' | 'down'>('up')
  const [reading, setReading] = useState<PitchReading | null>(null)
  const [captured, setCaptured] = useState<number[]>([])
  const [error, setError] = useState('')
  const sequence = useMemo(() => direction === 'up' ? assessmentMidi : [...assessmentMidi].reverse(), [direction])

  useEffect(() => () => { tracker.current.stop(); player.current.stop() }, [])

  async function begin() {
    setError('')
    try {
      await tracker.current.start(setReading)
      setStatus('listening')
      setStep(0)
      setCaptured([])
      await player.current.playNote(sequence[0])
    } catch (reason) {
      setError(reason instanceof Error && reason.message.includes('support') ? reason.message : '没有取得麦克风权限。请在浏览器地址栏允许麦克风后重试，或使用模拟结果继续。')
      setStatus('error')
    }
  }

  async function next(useDetected = true) {
    const value = useDetected && reading ? reading.midi : sequence[step]
    const nextCaptured = [...captured, value]
    setCaptured(nextCaptured)
    if (step >= sequence.length - 1) {
      tracker.current.stop()
      setStatus('result')
      return
    }
    const nextStep = step + 1
    setStep(nextStep)
    setReading(null)
    await player.current.playNote(sequence[nextStep])
  }

  function simulate() {
    tracker.current.stop()
    setCaptured([...assessmentMidi])
    setStatus('result')
  }

  const minMidi = captured.length ? Math.round(Math.min(...captured)) : 55
  const maxMidi = captured.length ? Math.round(Math.max(...captured)) : 74
  const centsText = reading ? `${reading.cents > 0 ? '+' : ''}${reading.cents} 音分` : '等待声音'

  return (
    <section className="page assessment-page">
      <StageDots page="assessment" />
      <PageIntro eyebrow="01 · 测声音" title={status === 'result' ? '你的声音，适合从这里出发。' : '轻轻唱，不必用力够到。'} description={status === 'result' ? '这只是体验版的舒适区间判断，不是专业声乐鉴定。' : '我们会播放五个逐步变化的虚构示例音。听过以后，用“嗯”轻轻跟唱。'} />

      {status === 'idle' && (
        <div className="focus-panel assessment-start">
          <div className="breath-orb" aria-hidden="true"><span>♪</span></div>
          <fieldset className="direction-choice">
            <legend>示例音走向</legend>
            <button className={direction === 'up' ? 'selected' : ''} onClick={() => setDirection('up')} aria-pressed={direction === 'up'}>由低到高</button>
            <button className={direction === 'down' ? 'selected' : ''} onClick={() => setDirection('down')} aria-pressed={direction === 'down'}>由高到低</button>
          </fieldset>
          <p className="permission-copy">点击后才会申请麦克风权限，声音只在本机处理。</p>
          <button className="primary-button" onClick={begin}>开始测声音 <span aria-hidden="true">→</span></button>
          <button className="quiet-button" onClick={simulate}>没有麦克风，使用模拟结果继续</button>
        </div>
      )}

      {status === 'error' && (
        <div className="focus-panel error-panel" role="alert">
          <span className="status-icon" aria-hidden="true">!</span><h2>麦克风还没有准备好</h2><p>{error}</p>
          <button className="primary-button" onClick={begin}>再次请求麦克风</button>
          <button className="quiet-button" onClick={simulate}>使用模拟结果继续</button>
        </div>
      )}

      {status === 'listening' && (
        <div className="focus-panel listening-panel">
          <div className="test-progress" aria-label={`第 ${step + 1} 个音，共 5 个`}><span>{step + 1}</span><i style={{ background: `linear-gradient(90deg, var(--rose) ${(step + 1) * 20}%, #e5dcd4 ${(step + 1) * 20}%)` }} /><small>5</small></div>
          <button className="reference-note" onClick={() => player.current.playNote(sequence[step])} aria-label={`重播参考音 ${midiToNoteName(sequence[step])}`}>
            <small>参考音 · 点按重播</small><strong>{midiToNoteName(sequence[step])}</strong><span aria-hidden="true">▶</span>
          </button>
          <div className={`pitch-reading ${reading?.stable ? 'stable' : ''}`} aria-live="polite">
            <small>识别到</small><strong>{reading?.noteName ?? '—'}</strong><span>{centsText}</span>
            <em>{reading?.stable ? '声音很稳定' : reading ? '保持一下这个音' : '请轻轻唱“嗯”'}</em>
          </div>
          <button className="primary-button" disabled={!reading?.stable} onClick={() => next(true)}>{step === 4 ? '完成测评' : '记下这个音'} <span aria-hidden="true">→</span></button>
          <button className="quiet-button" onClick={() => next(false)}>环境嘈杂，跳过这个音</button>
        </div>
      )}

      {status === 'result' && (
        <div className="focus-panel result-card">
          <span className="result-kicker">Demo 结果</span><p>舒适音域</p><h2>{midiToNoteName(minMidi)}–{midiToNoteName(maxMidi)}</h2>
          <div className="range-rail"><i /><span style={{ left: '22%' }} /><span style={{ left: '76%' }} /></div>
          <div className="recommendation"><small>《彩虹》练习建议</small><strong>建议中声部，整体降低两个半音</strong><p>接下来的练习会使用虚构示例旋律。</p></div>
          <button className="primary-button" onClick={onComplete}>开始练中声部 <span aria-hidden="true">→</span></button>
          <button className="quiet-button" onClick={() => setStatus('idle')}>重新测一次</button>
        </div>
      )}
      <CopyrightNote />
    </section>
  )
}
