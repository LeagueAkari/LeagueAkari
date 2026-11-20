import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { RecognitionWorkerController } from './recognition-worker-controller'

const mocks = vi.hoisted(() => ({ spawn: vi.fn() }))
vi.mock('electron', () => ({ app: { isPackaged: false, getAppPath: () => '.' } }))
vi.mock('node:child_process', () => ({ spawn: mocks.spawn }))

describe.skipIf(process.platform !== 'win32')('recognition worker capture protocol', () => {
  afterEach(() => vi.clearAllMocks())

  it('accepts disappearance checks and keeps only one capture in flight', () => {
    const child = Object.assign(new EventEmitter(), {
      stdin: new PassThrough(),
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      kill: vi.fn()
    })
    mocks.spawn.mockReturnValue(child)
    const onMessage = vi.fn()
    const worker = new RecognitionWorkerController(onMessage)
    const write = vi.spyOn(child.stdin, 'write')
    try {
      worker.start()
      child.stdout.write('{"type":"ready"}\n')
      worker.capture()
      worker.capture()
      expect(write).toHaveBeenCalledTimes(1)
      child.stdout.write('{"type":"absent","capturedAt":1234}\n')
      expect(onMessage).toHaveBeenLastCalledWith({ type: 'absent', capturedAt: 1234 })
      worker.capture(false, [], true)
      expect(write).toHaveBeenCalledTimes(2)
      expect(JSON.parse(String(write.mock.lastCall![0]))).toEqual({
        type: 'capture',
        focused: false,
        regions: [],
        reuseCapture: true
      })
      worker.stop()
      child.stdout.write('{"type":"absent","capturedAt":1235}\n')
      expect(onMessage).toHaveBeenCalledTimes(2)
      expect(child.kill).toHaveBeenCalledOnce()
    } finally {
      worker.stop()
      child.stdin.destroy()
      child.stdout.destroy()
      child.stderr.destroy()
    }
  })
})
