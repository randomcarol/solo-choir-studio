import { useState } from 'react'
import { importLocalMidi } from '../audio/midiImport'
import type { SavedProject, Song } from '../types/music'
import { CopyrightNote } from './Chrome'

const steps = [
  ['01', '测声音', '听一句、唱一句，找到舒适音域'],
  ['02', '练声部', '逐句听唱，熟悉完整旋律'],
  ['03', '合起来', '先录中声部，再听见三个自己'],
]

const pageProgress = { home: 0, assessment: 1, practice: 2, record: 3, result: 4 }

export function HomePage({ songs, rainbowSong, selectedSong, saved, onSelectSong, onImportSong, onStart, onResume }: {
  songs: Song[]
  rainbowSong: Song
  selectedSong: Song
  saved: SavedProject | null
  onSelectSong: (song: Song) => void
  onImportSong: (song: Song) => void
  onStart: () => void
  onResume: () => void
}) {
  const progress = saved ? pageProgress[saved.page] : 0
  const [confirmed, setConfirmed] = useState(false)
  const [importError, setImportError] = useState('')

  async function importMidi(file: File | undefined) {
    if (!file) return
    setImportError('')
    try { onImportSong(await importLocalMidi(file)) }
    catch (reason) { setImportError(reason instanceof Error ? reason.message : '这个 MIDI 暂时无法解析') }
  }
  return (
    <section className="home" id="top">
      <p className="eyebrow">一个人的合唱团</p>
      <h1>先听见自己的声音，<br />再遇见另外两个你。</h1>

      <article className="song-card" aria-label={`当前歌曲：${selectedSong.title}`}>
        <div className="record-art" aria-hidden="true"><span /></div>
        <div className="song-copy">
          <span className="tiny-label">当前练习曲目</span>
          <h2>{selectedSong.title}</h2>
          <p>{selectedSong.artist}</p>
          <small>{selectedSong.songwriter}</small>
        </div>
      </article>

      <section className="song-library" aria-labelledby="song-library-title">
        <div className="library-heading"><div><small>可立即体验</small><h2 id="song-library-title">选择一首完整旋律</h2></div><span>3 首公版</span></div>
        <div className="song-options">
          {songs.map((song) => <button key={song.id} className={selectedSong.id === song.id ? 'selected' : ''} onClick={() => onSelectSong(song)} aria-pressed={selectedSong.id === song.id}><strong>{song.title}</strong><small>{song.songwriter}</small><em>{selectedSong.id === song.id ? '已选择' : '公版可用'}</em></button>)}
        </div>
        <div className="pending-song"><span><strong>{rainbowSong.title}</strong><small>{rainbowSong.artist} · {rainbowSong.songwriter}</small></span><em>授权申请中</em></div>
      </section>

      <details className="local-import">
        <summary>使用我有权使用的本地 MIDI</summary>
        <p>文件只在当前浏览器解析，不会上传。优先读取三个有音符的轨道；单轨文件会生成合成和声占位。</p>
        <label className="rights-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />我确认拥有该文件的测试和使用权</label>
        <label className={`file-picker ${confirmed ? '' : 'disabled'}`}>选择 MIDI 文件<input type="file" accept=".mid,.midi,audio/midi,audio/x-midi" disabled={!confirmed} onChange={(event) => void importMidi(event.target.files?.[0])} /></label>
        {importError && <p className="import-error" role="alert">{importError}</p>}
      </details>

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
      <CopyrightNote song={selectedSong} />
    </section>
  )
}
