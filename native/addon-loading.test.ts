import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { initializeWin32Addons } from '../src/main/native/addons-win32'
import type { Win32Addons } from '../src/main/native/addons-win32'

const nativePackageEntry = path.resolve('native/win32-x64/dist/index.js')

function runNodeContract(scriptBody: string) {
  execFileSync(process.execPath, ['-e', scriptBody], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
    stdio: 'pipe'
  })
}

describe('native addon facade contract', () => {
  it('keeps imports side-effect free and loads each addon explicitly', () => {
    runNodeContract(`
      const assert = require('node:assert/strict')
      const Module = require('node:module')
      const path = require('node:path')
      const loaded = []
      const originalNodeLoader = Module._extensions['.node']

      Module._extensions['.node'] = (module, filename) => {
        loaded.push(path.basename(filename))
        module.exports = filename.includes('input')
          ? {
              install() {},
              uninstall() {},
              onKeyEvent() {},
              sendString() { return Promise.resolve() },
              sendKey() { return Promise.resolve() },
              getKeyStates() { return [] }
            }
          : {
              fixWindowMethodA() { return true },
              isElevated() { return false },
              getLeagueClientWindowPlacementInfo() { return null },
              getCommandLine1() { return '' },
              getPidsByName() { return [] },
              terminateProcess() { return false },
              isProcessForeground() { return false },
              isProcessRunning() { return true }
            }
      }

      try {
        const entry = ${JSON.stringify(nativePackageEntry)}
        const addons = require(entry)
        const input = require(path.join(path.dirname(entry), 'input/index.js'))
        const tools = require(path.join(path.dirname(entry), 'tools/index.js')).default

        assert.deepEqual(loaded, [])
        assert.equal(addons.input, input)
        assert.equal(addons.tools, tools)
        assert.equal(addons.tools.isLoaded(), false)
        assert.equal(addons.input.isLoaded(), false)
        assert.throws(
          () => addons.tools.isElevated(),
          (error) => error instanceof addons.AddonNotLoadedError && error.feature === 'tools'
        )
        assert.throws(
          () => addons.input.instance.getKeyStates(),
          (error) => error instanceof addons.AddonNotLoadedError && error.feature === 'input'
        )

        addons.tools.load()
        addons.tools.load()
        assert.equal(addons.tools.isLoaded(), true)
        assert.deepEqual(loaded, ['akari-tools-win64.node'])
        assert.equal(addons.tools.isElevated(), false)

        addons.input.load()
        addons.input.load()
        assert.equal(addons.input.isLoaded(), true)
        assert.deepEqual(loaded, ['akari-tools-win64.node', 'akari-input-win64.node'])
        assert.deepEqual(addons.input.instance.getKeyStates(), [])
      } finally {
        Module._extensions['.node'] = originalNodeLoader
      }
    `)
  })

  it('keeps failed loads uncached and exposes the original cause', () => {
    runNodeContract(`
      const assert = require('node:assert/strict')
      const Module = require('node:module')
      const originalNodeLoader = Module._extensions['.node']
      const loadFailure = new Error('simulated loader failure')
      let attempts = 0

      Module._extensions['.node'] = (module) => {
        attempts += 1
        if (attempts === 1) {
          throw loadFailure
        }
        module.exports = {
          fixWindowMethodA() { return true },
          isElevated() { return false },
          getLeagueClientWindowPlacementInfo() { return null },
          getCommandLine1() { return '' },
          getPidsByName() { return [] },
          terminateProcess() { return false },
          isProcessForeground() { return false },
          isProcessRunning() { return true }
        }
      }

      try {
        const addons = require(${JSON.stringify(nativePackageEntry)})
        assert.throws(
          () => addons.tools.load(),
          (error) =>
            error instanceof addons.AddonLoadError &&
            error.feature === 'tools' &&
            error.cause === loadFailure
        )
        assert.equal(addons.tools.isLoaded(), false)

        addons.tools.load()
        assert.equal(addons.tools.isLoaded(), true)
        assert.equal(attempts, 2)
      } finally {
        Module._extensions['.node'] = originalNodeLoader
      }
    `)
  })
})

describe.skipIf(process.platform !== 'win32')('Windows native addon integration', () => {
  it('initializes real addons according to the current process privileges', () => {
    const require = createRequire(__filename)
    const addons = require(nativePackageEntry) as Win32Addons
    const exitListeners: Array<() => void> = []

    expect(addons.tools.isLoaded()).toBe(false)
    expect(addons.input.isLoaded()).toBe(false)

    const result = initializeWin32Addons(addons, (listener) => exitListeners.push(listener))

    try {
      expect(addons.tools.isLoaded()).toBe(true)
      expect(addons.tools.isProcessRunning(process.pid)).toBe(true)
      expect(result.isElevated).toBe(addons.tools.isElevated())

      if (result.isElevated) {
        expect(result.inputInitializationError).toBeUndefined()
        expect(addons.input.isLoaded()).toBe(true)
        expect(addons.input.instance.isInstalled).toBe(true)
        expect(addons.input.instance.getKeyStates()).toHaveLength(256)
        expect(exitListeners).toHaveLength(1)
      } else {
        expect(addons.input.isLoaded()).toBe(false)
        expect(addons.input.instance.isInstalled).toBe(false)
        expect(exitListeners).toHaveLength(0)
      }
    } finally {
      for (const listener of exitListeners) {
        listener()
      }
    }

    expect(addons.input.instance.isInstalled).toBe(false)
  })
})
