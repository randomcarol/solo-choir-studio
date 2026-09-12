import type { AppPage, Song } from '../types/music'
import { COPYRIGHT_NOTICE } from '../data/demoSong'

const pageNames: Record<AppPage, string> = {
  home: '歌曲', assessment: '测声音', practice: '练声部', record: '录和声', result: '听合唱',
}

export function AppHeader({ page, onHome, onBack }: { page: AppPage; onHome: () => void; onBack?: () => void }) {
  return (
    <header className="topbar app-topbar">
      {page === 'home' ? (
        <button className="brand brand-button" onClick={onHome} aria-label="返回和声里首页">
          <span className="brand-mark" aria-hidden="true">和</span><span>和声里</span>
        </button>
      ) : (
        <button className="text-button back-button" onClick={onBack ?? onHome} aria-label="返回上一步"><span aria-hidden="true">←</span> 返回</button>
      )}
      <span className="header-page">{pageNames[page]}</span>
      <span className="demo-badge">体验版</span>
    </header>
  )
}

export function StageDots({ page }: { page: AppPage }) {
  const stages: { id: AppPage; label: string }[] = [
    { id: 'assessment', label: '测声音' },
    { id: 'practice', label: '跟唱' },
    { id: 'record', label: '录声部' },
    { id: 'result', label: '听合唱' },
  ]
  const current = Math.max(0, stages.findIndex((stage) => stage.id === page))
  return (
    <nav className="stage-progress" aria-label={`体验进度，第 ${current + 1} 步，共 4 步`}>
      <ol>{stages.map((stage, index) => (
        <li key={stage.id} className={index === current ? 'current' : index < current ? 'done' : ''} aria-current={index === current ? 'step' : undefined}>
          <span>{index < current ? '✓' : index + 1}</span><small>{stage.label}</small>
        </li>
      ))}</ol>
    </nav>
  )
}

export function StepBrief({ action, outcome }: { action: string; outcome: string }) {
  return <aside className="step-brief"><span aria-hidden="true">→</span><div><strong>这一步：{action}</strong><p>{outcome}</p></div></aside>
}

export function CopyrightNote({ song }: { song?: Song }) {
  return <p className="copyright-note">{song?.rights?.notice ?? COPYRIGHT_NOTICE}</p>
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p></div>
}
