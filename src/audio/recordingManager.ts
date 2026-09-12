import { resumeAudioContext } from './audioContext'

export interface RecordingResult {
  blob: Blob
  objectUrl: string
  duration: number
  startedAt: number
}

function supportedMimeType(): string | undefined {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return candidates.find((type) => MediaRecorder.isTypeSupported(type))
}

export class SessionRecorder {
  private stream: MediaStream | null = null
  private recorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private startedAt = 0

  async prepare(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      throw new Error('当前浏览器不支持录音，请使用模拟占位继续体验')
    }
    if (!this.stream || this.stream.getTracks().every((track) => track.readyState === 'ended')) {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    }
  }

  async start(): Promise<number> {
    await this.prepare()
    const context = await resumeAudioContext()
    const mimeType = supportedMimeType()
    this.chunks = []
    this.recorder = new MediaRecorder(this.stream!, mimeType ? { mimeType } : undefined)
    this.recorder.ondataavailable = (event) => { if (event.data.size) this.chunks.push(event.data) }
    this.startedAt = context.currentTime
    this.recorder.start(100)
    return this.startedAt
  }

  stop(): Promise<RecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || this.recorder.state === 'inactive') {
        reject(new Error('当前没有正在进行的录音'))
        return
      }
      const recorder = this.recorder
      recorder.onerror = () => reject(new Error('录音中断，请重新尝试'))
      recorder.onstop = async () => {
        const context = await resumeAudioContext()
        const blob = new Blob(this.chunks, { type: recorder.mimeType || 'audio/webm' })
        resolve({ blob, objectUrl: URL.createObjectURL(blob), duration: context.currentTime - this.startedAt, startedAt: this.startedAt })
      }
      recorder.stop()
    })
  }

  dispose(): void {
    if (this.recorder?.state === 'recording') this.recorder.stop()
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.recorder = null
  }
}
