import { useEffect, useRef, useState } from 'react'
import { assessmentMidi, assessmentPhraseDuration, assessmentPhraseNotes } from '../data/demoSong'
import { LocalPitchTracker, midiToNoteName } from '../audio/pitchDetection'
import { ReferenceTonePlayer } from '../audio/referenceTone'
import { getComfortableRange } from '../state/assessmentFlow'
import type { PitchReading, Song } from '../types/music'
import { CopyrightNote, PageIntro, StageDots, StepBrief } from './Chrome'

type AssessmentStatus = 'intro' | 'demonstrating' | 'ready' | 'singing' | 'result' | 'error'

export function AssessmentPage({ song, onComplete }: { song: Song; onComplete: () => void }) {
  const tracker = useRef(new LocalPitchTracker())
  const player = useRef(new ReferenceTonePlayer())
  const timer = useRef<number | null>(null)
  const samplesRef = useRef<number[]>([])
  const [status, setStatus] = useState<AssessmentStatus>('intro')
  const [reading, setReading] = useState<PitchReading | null>(null)
  const [captured, setCaptured] = useState<number[]>([])
  const [error, setError] = useState('')

  useEffect(() => () => {
    tracker.current.stop()
    player.current.stop()
    if (timer.current) window.clearTimeout(timer.current)
  }, [])

  function playPhrase() {
    player.current.stop()
    setStatus('demonstrating')
    timer.current = window.setTimeout(() => setStatus('ready'), assessmentPhraseDuration * 1000)
    void player.current.schedule({ notes: assessmentPhraseNotes, gain: .16 }).catch(() => setStatus('ready'))
  }

  function finishMeasurement(values = samplesRef.current) {
    tracker.current.stop()
    player.current.stop()
    if (timer.current) window.clearTimeout(timer.current)
    setCaptured(values.length >= 8 ? values : assessmentMidi)
    setStatus('result')
  }

  async function beginSinging() {
    setError('')
    setReading(null)
    samplesRef.current = []
    try {
      await tracker.current.start((nextReading) => {
        setReading(nextReading)
        if (nextReading?.stable) samplesRef.current.push(nextReading.midi)
      })
      setStatus('singing')
      timer.current = window.setTimeout(() => finishMeasurement(), assessmentPhraseDuration * 1000 + 250)
      void player.current.schedule({ notes: assessmentPhraseNotes, gain: .055 }).catch(() => undefined)
    } catch {
      setError('没有取得麦克风权限。请在浏览器地址栏允许麦克风后重试，或使用模拟结果继续。')
      setStatus('error')
    }
  }

  function simulate() {
    samplesRef.current = [...assessmentMidi]
    finishMeasurement(assessmentMidi)
  }

  const range = getComfortableRange(captured)
  const isWorking = status === 'demonstrating' || status === 'singing'

  return (
    <section className="page assessment-page">
      <StageDots page="assessment" />
      <PageIntro
        eyebrow="第 1 步 · 测声音"
        title={status === 'result' ? '找到适合你的起点。' : '听一句，再完整跟唱一句。'}
        description={status === 'result' ? '这是体验版的舒适区间判断，不是专业声乐鉴定。' : '不用逐个音确认。示范句约 4 秒，用“啦”从头唱到尾就完成。'}
      />
      {status !== 'result' && <StepBrief action="先听完整示范，再跟唱一遍" outcome="完成后会直接给出舒适音域和推荐声部，约 15 秒。" />}

      {(status === 'intro' || status === 'demonstrating' || status === 'ready') && (
        <div className="focus-panel phrase-assessment">
          <div className={`phrase-orb ${isWorking ? 'playing' : ''}`} aria-hidden="true"><span>啦</span></div>
          <div className="phrase-visual" aria-label="一条由低到高的虚构示范旋律">
            {assessmentPhraseNotes.map((note, index) => <i key={note.id} style={{ transform: `translateY(${-index * 4}px)`, width: `${index === 4 ? 22 : 13}%` }} />)}
          </div>
          {status === 'intro' && <><p className="stage-instruction"><strong>现在：只需要听</strong><span>点下面按钮，完整听一遍旋律。</span></p><button className="primary-button" onClick={playPhrase}>听完整示范句 <span aria-hidden="true">▶</span></button></>}
          {status === 'demonstrating' && <p className="active-instruction" role="status"><span className="pulse-dot" />正在播放整句，请先听旋律走向…</p>}
          {status === 'ready' && <><p className="stage-instruction"><strong>接着：从头跟唱</strong><span>点开始后，用“啦”完整唱完这一句。</span></p><button className="primary-button" onClick={beginSinging}>开始跟唱整句 <span aria-hidden="true">→</span></button><button className="quiet-button" onClick={playPhrase}>再听一遍</button><button className="quiet-button muted-link" onClick={simulate}>没有麦克风，使用模拟结果</button></>}
        </div>
      )}

      {status === 'singing' && (
        <div className="focus-panel phrase-singing">
          <p className="active-instruction"><span className="pulse-dot" />正在听你唱完整一句</p>
          <div className={`pitch-reading ${reading?.stable ? 'stable' : ''}`} aria-live="polite">
            <small>当前音高</small><strong>{reading?.noteName ?? '—'}</strong>
            <span>{reading ? `${reading.cents > 0 ? '+' : ''}${reading.cents} 音分` : '跟着旋律唱“啦”'}</span>
            <em>{reading?.stable ? '很好，继续唱完整句' : '不用停下来确认，继续往后唱'}</em>
          </div>
          <p className="auto-note">唱完后会自动进入结果，无需点按。</p>
        </div>
      )}

      {status === 'error' && (
        <div className="focus-panel error-panel" role="alert">
          <span className="status-icon" aria-hidden="true">!</span><h2>麦克风还没有准备好</h2><p>{error}</p>
          <button className="primary-button" onClick={beginSinging}>重新开始跟唱</button>
          <button className="quiet-button" onClick={simulate}>使用模拟结果继续</button>
        </div>
      )}

      {status === 'result' && (
        <div className="focus-panel result-card">
          <span className="result-kicker">整句测评完成</span><p>舒适音域</p><h2>{midiToNoteName(range.min)}–{midiToNoteName(range.max)}</h2>
          <div className="range-rail"><i /><span style={{ left: '22%' }} /><span style={{ left: '76%' }} /></div>
          <div className="recommendation"><small>下一步会发生什么</small><strong>建议中声部，整体降低两个半音</strong><p>接下来练习《{song.title}》的 {song.segments.length} 个段落；每段都是“先听一遍、再跟唱一遍”。</p></div>
          <button className="primary-button" onClick={onComplete}>下一步：练完整旋律 <span aria-hidden="true">→</span></button>
          <button className="quiet-button" onClick={() => setStatus('intro')}>重新测一次</button>
        </div>
      )}
      <CopyrightNote song={song} />
    </section>
  )
}
