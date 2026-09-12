let sharedContext: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!sharedContext) {
    const Context = window.AudioContext || window.webkitAudioContext
    sharedContext = new Context()
  }
  return sharedContext
}

export async function resumeAudioContext(): Promise<AudioContext> {
  const context = getAudioContext()
  if (context.state === 'suspended') await context.resume()
  return context
}

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}
