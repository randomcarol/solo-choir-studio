import { useEffect, useMemo, useReducer, useState } from 'react'
import { AppHeader } from './components/Chrome'
import { HomePage } from './components/HomePage'
import { AssessmentPage } from './components/AssessmentPage'
import { PracticePage } from './components/PracticePage'
import { RecordPage } from './components/RecordPage'
import { ResultPage } from './components/ResultPage'
import { initialProjectState, loadSavedProject, projectReducer, saveProject } from './state/projectState'
import { createInitialTracks } from './state/trackState'
import type { AppPage, SavedProject } from './types/music'

function previousPage(page: AppPage): AppPage {
  return { home: 'home', assessment: 'home', practice: 'assessment', record: 'practice', result: 'record' }[page] as AppPage
}

export default function App() {
  const initialSaved = useMemo(loadSavedProject, [])
  const [project, dispatch] = useReducer(projectReducer, {
    ...initialProjectState,
    assessmentComplete: initialSaved?.assessmentComplete ?? false,
    practicedSegments: initialSaved?.practicedSegments ?? [],
    recordedParts: initialSaved?.recordedParts ?? [],
  })
  const [saved, setSaved] = useState<SavedProject | null>(initialSaved)
  const [tracks, setTracks] = useState(createInitialTracks)

  function navigate(page: AppPage) {
    dispatch({ type: 'navigate', page })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function persist() {
    const value = saveProject({ ...project, page: 'result' })
    setSaved(value)
  }

  useEffect(() => {
    const context = document.modelContext
    if (!context?.registerTool) return
    const lifecycle = new AbortController()
    void Promise.resolve(context.registerTool({
      name: 'read_heshengli_progress', title: '读取和声里进度', description: '读取当前和声里体验的步骤与已完成内容。',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false }, execute: () => ({ ...project }),
    }, { signal: lifecycle.signal })).catch(() => undefined)
    void Promise.resolve(context.registerTool({
      name: 'navigate_heshengli_stage', title: '切换和声里步骤', description: '在和声里 Demo 中切换到指定体验步骤。',
      inputSchema: { type: 'object', properties: { page: { type: 'string', enum: ['home', 'assessment', 'practice', 'record', 'result'] } }, required: ['page'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false }, execute: (input) => {
        const page = (input as { page?: AppPage }).page
        if (!page || !['home', 'assessment', 'practice', 'record', 'result'].includes(page)) throw new Error('无效步骤')
        dispatch({ type: 'navigate', page })
        return { page }
      },
    }, { signal: lifecycle.signal })).catch(() => undefined)
    return () => lifecycle.abort()
  }, [project])

  return (
    <main className="app-shell">
      <AppHeader page={project.page} onHome={() => navigate('home')} onBack={() => navigate(previousPage(project.page))} />
      {project.page === 'home' && <HomePage saved={saved} onStart={() => navigate('assessment')} onResume={() => navigate(saved?.page === 'home' ? 'assessment' : saved?.page ?? 'assessment')} />}
      {project.page === 'assessment' && <AssessmentPage onComplete={() => dispatch({ type: 'complete-assessment' })} />}
      {project.page === 'practice' && <PracticePage onPracticed={(segmentId) => dispatch({ type: 'practice-segment', segmentId })} onComplete={() => navigate('record')} />}
      {project.page === 'record' && <RecordPage tracks={tracks} setTracks={setTracks} onRecorded={(partId) => dispatch({ type: 'record-part', partId })} onComplete={() => navigate('result')} />}
      {project.page === 'result' && <ResultPage tracks={tracks} onBack={() => navigate('record')} onSave={persist} />}
    </main>
  )
}
