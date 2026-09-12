import type { AppPage } from '../types/music'
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
  const stages: AppPage[] = ['assessment', 'practice', 'record', 'result']
  const current = Math.max(0, stages.indexOf(page))
  return (
    <div className="stage-dots" aria-label={`体验进度，第 ${current + 1} 步，共 4 步`}>
      {stages.map((stage, index) => <span key={stage} className={index <= current ? 'active' : ''} />)}
    </div>
  )
}

export function CopyrightNote() {
  return <p className="copyright-note">{COPYRIGHT_NOTICE}</p>
}

export function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p></div>
}
