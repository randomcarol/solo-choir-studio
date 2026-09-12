import type { AppPage, SavedProject, VoicePartId } from '../types/music'

export const STORAGE_KEY = 'heshengli-project-v1'

export interface ProjectState {
  page: AppPage
  assessmentComplete: boolean
  practicedSegments: string[]
  recordedParts: VoicePartId[]
}

export type ProjectAction =
  | { type: 'navigate'; page: AppPage }
  | { type: 'complete-assessment' }
  | { type: 'practice-segment'; segmentId: string }
  | { type: 'record-part'; partId: VoicePartId }
  | { type: 'remove-recording'; partId: VoicePartId }
  | { type: 'restore'; project: SavedProject }

export const initialProjectState: ProjectState = {
  page: 'home', assessmentComplete: false, practicedSegments: [], recordedParts: [],
}

export function projectReducer(state: ProjectState, action: ProjectAction): ProjectState {
  switch (action.type) {
    case 'navigate': return { ...state, page: action.page }
    case 'complete-assessment': return { ...state, assessmentComplete: true, page: 'practice' }
    case 'practice-segment': return { ...state, practicedSegments: [...new Set([...state.practicedSegments, action.segmentId])] }
    case 'record-part': return { ...state, recordedParts: [...new Set([...state.recordedParts, action.partId])] }
    case 'remove-recording': return { ...state, recordedParts: state.recordedParts.filter((id) => id !== action.partId) }
    case 'restore': return {
      page: action.project.page,
      assessmentComplete: action.project.assessmentComplete,
      practicedSegments: action.project.practicedSegments,
      recordedParts: action.project.recordedParts,
    }
  }
}

export function loadSavedProject(): SavedProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as SavedProject : null
  } catch { return null }
}

export function saveProject(state: ProjectState, songId = 'ode-to-joy'): SavedProject {
  const value: SavedProject = { songId, ...state, updatedAt: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  return value
}
