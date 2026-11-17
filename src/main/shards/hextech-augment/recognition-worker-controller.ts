import type { OcrFrame, OcrWord } from '@shared/types/hextech-augment'
import { app } from 'electron'
import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process'
import path from 'node:path'
import { type Interface, createInterface } from 'node:readline'

export type RecognitionWorkerMessage =
  | OcrFrame
  | { type: 'absent'; capturedAt: number }
  | { type: 'hidden' }
  | { type: 'ready' }
  | { type: 'error'; message: string }

/** Single persistent offline OCR process. One request at a time; no screenshot queue or uploads. */
export class RecognitionWorkerController {
  private _process: ChildProcessWithoutNullStreams | null = null
  private _lines: Interface | null = null
  private _timeout: ReturnType<typeof setTimeout> | null = null
  private _ready = false
  private _busy = false

  constructor(private readonly _onMessage: (message: RecognitionWorkerMessage) => void) {}

  start() {
    if (this._process || process.platform !== 'win32') return
    const script = app.isPackaged
      ? path.join(process.resourcesPath, 'app.asar.unpacked/resources/hextech/recognize.ps1')
      : path.join(app.getAppPath(), 'resources/hextech/recognize.ps1')
    const executable = path.join(
      process.env.SystemRoot ?? 'C:/Windows',
      'System32/WindowsPowerShell/v1.0/powershell.exe'
    )
    const child = spawn(
      executable,
      ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script],
      { windowsHide: true, stdio: 'pipe' }
    )
    this._process = child
    this._lines = createInterface({ input: child.stdout })
    this._lines.on('line', (line) => {
      if (this._process !== child) return
      try {
        const message = JSON.parse(line) as RecognitionWorkerMessage
        if (!['ready', 'hidden', 'absent', 'frame', 'error'].includes(message.type)) return
        if (this._timeout) clearTimeout(this._timeout)
        this._timeout = null
        this._busy = false
        if (message.type === 'ready') this._ready = true
        this._onMessage(message)
      } catch {
        this._onMessage({ type: 'error', message: 'Invalid OCR worker response' })
      }
    })
    child.stderr.on('data', () => {
      // Raw PowerShell errors may include local paths. Report a bounded, non-sensitive diagnostic.
      if (this._process === child)
        this._onMessage({
          type: 'error',
          message: 'Windows OCR worker failed; check installed OCR language support'
        })
    })
    child.stdin.on('error', () => {
      if (this._process !== child) return
      this.stop()
      this._onMessage({ type: 'error', message: 'Windows OCR worker input closed' })
    })
    child.on('error', () => {
      if (this._process === child) {
        this.stop()
        this._onMessage({ type: 'error', message: 'Cannot start Windows OCR worker' })
      }
    })
    child.on('exit', () => {
      if (this._process !== child) return
      this.stop()
      this._onMessage({ type: 'error', message: 'Windows OCR worker exited' })
    })
    this._timeout = setTimeout(() => {
      this.stop()
      this._onMessage({ type: 'error', message: 'Windows OCR worker startup timed out' })
    }, 15000)
  }

  capture(focused = false, regions: Pick<OcrWord, 'x' | 'y' | 'width' | 'height'>[] = []) {
    if (!this._ready || !this._process || this._busy) return
    this._busy = true
    this._process.stdin.write(`${JSON.stringify({ type: 'capture', focused, regions })}\n`)
    this._timeout = setTimeout(() => {
      this.stop()
      this._onMessage({ type: 'error', message: 'Windows OCR capture timed out' })
    }, 8000)
  }

  stop() {
    const child = this._process
    this._process = null
    this._ready = false
    this._busy = false
    if (this._timeout) clearTimeout(this._timeout)
    this._timeout = null
    this._lines?.close()
    this._lines = null
    child?.kill()
  }
}
