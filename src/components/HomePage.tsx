import type { SavedProject } from '../types/music'
import { CopyrightNote } from './Chrome'

const steps = [
  ['01', '测声音', '找到唱起来最舒服的位置'],
  ['02', '练声部', '跟着虚构示例旋律熟悉音高'],
  ['03', '合起来', '录下三个自己，听见和声'],
]

const pageProgress = { home: 0, assessment: 1, practice: 2, record: 3, result: 4 }

export function HomePage({ saved, onStart, onResume }: { saved: SavedProject | null; onStart: () => void; onResume: () => void }) {
  const progress = saved ? pageProgress[saved.page] : 0
  return (
    <section className="home" id="top">
      <p className="eyebrow">一个人的合唱团</p>
      <h1>先听见自己的声音，<br />再遇见另外两个你。</h1>

      <article className="song-card" aria-label="歌曲：彩虹">
        <div className="record-art" aria-hidden="true"><span /></div>
        <div className="song-copy">
          <span className="tiny-label">本次练习曲目</span>
          <h2>彩虹</h2>
          <p>上海彩虹室内合唱团</p>
          <small>词曲 · 金承志</small>
        </div>
      </article>

      <button className={`resume-strip ${saved ? '' : 'empty'}`} onClick={saved ? onResume : onStart} aria-label={saved ? '继续最近一次项目' : '开始第一个项目'}>
        <span><small>最近一次</small><strong>{saved ? (progress === 4 ? '已完成一次合唱' : `进行到第 ${progress + 1} 步`) : '还没有保存的项目'}</strong></span>
        <span className="resume-line"><i style={{ width: `${saved ? Math.max(18, progress * 25) : 0}%` }} /></span>
        <span aria-hidden="true">→</span>
      </button>

      <ol className="steps" aria-label="体验步骤">
        {steps.map(([num, title, copy]) => (
          <li key={num}><span className="step-num">{num}</span><div><strong>{title}</strong><p>{copy}</p></div></li>
        ))}
      </ol>

      <button className="primary-button" type="button" onClick={onStart}>开始测声音 <span aria-hidden="true">→</span></button>
      <CopyrightNote />
    </section>
  )
}
