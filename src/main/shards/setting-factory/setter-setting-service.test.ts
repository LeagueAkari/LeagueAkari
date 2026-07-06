import { describe, expect, it, vi } from 'vitest'

import type { SettingPath, SettingSchema } from '.'
import { SetterSettingService } from './setter-setting-service'

function createService<T extends object>(
  schema: SettingSchema<T>,
  obj: T,
  storageValues: Partial<Record<string, unknown>> = {}
) {
  const settingFactory = {
    _delayed: {
      add: vi.fn(),
      remove: vi.fn()
    },
    _getFromStorage: vi.fn(
      async (_namespace: string, key: SettingPath<T>, defaultValue: unknown) =>
        Object.hasOwn(storageValues, key) ? storageValues[key] : defaultValue
    ),
    _saveToStorage: vi.fn(async (_namespace: string, key: string, value: unknown) => {
      storageValues[key] = value
    }),
    _removeFromStorage: vi.fn(async (_namespace: string, key: string) => {
      delete storageValues[key]
    }),
    _getByPrefixFromStorage: vi.fn(),
    _removeByPrefixFromStorage: vi.fn(),
    _setJsonValue: vi.fn(),
    _removeJsonValue: vi.fn(),
    readFromJsonConfigFile: vi.fn(),
    writeToJsonConfigFile: vi.fn(),
    jsonConfigFileExists: vi.fn()
  }

  return {
    service: new SetterSettingService(settingFactory as any, 'test-main', schema, obj),
    settingFactory
  }
}

describe('SetterSettingService', () => {
  it('applies storage values as-is without restore', async () => {
    const obj = { tags: { enabled: true, showSelf: true } }
    const { service, settingFactory } = createService(
      {
        tags: {
          default: obj.tags
        }
      },
      obj,
      {
        tags: { enabled: false }
      }
    )

    await service.applyToState()

    expect(obj.tags).toEqual({ enabled: false })
    expect(settingFactory._delayed.add).not.toHaveBeenCalled()
  })

  it('uses explicit restore output before applying storage values to state', async () => {
    const obj = { tags: { enabled: true, showSelf: true } }
    const transform = vi.fn(({ value }) => value)
    const sideEffect = vi.fn()
    const { service, settingFactory } = createService(
      {
        tags: {
          default: obj.tags,
          restore: ({ value, defaultValue }) => ({
            ...defaultValue,
            ...(value as Partial<typeof defaultValue>)
          }),
          transform,
          sideEffect
        }
      },
      obj,
      {
        tags: { enabled: false }
      }
    )

    await service.applyToState()

    expect(obj.tags).toEqual({ enabled: false, showSelf: true })
    expect(transform).not.toHaveBeenCalled()
    expect(sideEffect).not.toHaveBeenCalled()
    expect(settingFactory._delayed.add).not.toHaveBeenCalled()
  })

  it('commits transformed values', async () => {
    const obj = { count: 1 }
    const { service, settingFactory } = createService(
      {
        count: {
          default: 1,
          transform: ({ value }) => Math.max(0, value)
        }
      },
      obj
    )

    await service.set('count', -1)

    expect(obj.count).toBe(0)
    expect(settingFactory._delayed.add).toHaveBeenCalledWith(
      'test-main/count',
      expect.any(Function),
      1000
    )
  })

  it('runs side effects before commit with transformed value', async () => {
    const obj = { count: 1 }
    const sideEffect = vi.fn(({ oldValue, value }) => {
      expect(obj.count).toBe(1)
      expect(oldValue).toBe(1)
      expect(value).toBe(2)
    })
    const { service } = createService(
      {
        count: {
          default: 1,
          transform: ({ value }) => value + 1,
          sideEffect
        }
      },
      obj
    )

    await service.set('count', 1)

    expect(sideEffect).toHaveBeenCalledTimes(1)
    expect(obj.count).toBe(2)
  })

  it('blocks commits when side effects throw', async () => {
    const obj = { count: 1 }
    const { service, settingFactory } = createService(
      {
        count: {
          default: 1,
          sideEffect: () => {
            throw new Error('side effect failed')
          }
        }
      },
      obj
    )

    await expect(service.set('count', 2)).rejects.toThrow('side effect failed')

    expect(obj.count).toBe(1)
    expect(settingFactory._delayed.add).not.toHaveBeenCalled()
  })

  it('does not restore values on set', async () => {
    const obj = { count: 1 }
    const restore = vi.fn(({ value }) => Number(value))
    const { service } = createService(
      {
        count: {
          default: 1,
          restore
        }
      },
      obj
    )

    await service.set('count', 2)

    expect(restore).not.toHaveBeenCalled()
    expect(obj.count).toBe(2)
  })

  it('returns pending setting saves before the delayed task is flushed', async () => {
    const obj = { count: 1 }
    const { service, settingFactory } = createService(
      {
        count: {
          default: 1
        }
      },
      obj,
      {
        count: 1
      }
    )

    await service.set('count', 2)

    expect(settingFactory._saveToStorage).not.toHaveBeenCalled()
    expect(await service._getFromStorage('count')).toBe(2)

    const delayedTask = settingFactory._delayed.add.mock.calls[0][1]
    await delayedTask()

    expect(settingFactory._saveToStorage).toHaveBeenCalledWith('test-main', 'count', 2)
  })

  it('returns defaults for pending setting removals before the delayed task is flushed', async () => {
    const obj = { shortcut: 'Ctrl+K' as string | null }
    const { service, settingFactory } = createService(
      {
        shortcut: {
          default: null
        }
      },
      obj,
      {
        shortcut: 'Ctrl+K'
      }
    )

    await service.set('shortcut', null)

    expect(settingFactory._removeFromStorage).not.toHaveBeenCalled()
    expect(await service._getFromStorage('shortcut')).toBeUndefined()
    expect(await service._getFromStorage('shortcut', 'fallback')).toBe('fallback')

    const delayedTask = settingFactory._delayed.add.mock.calls[0][1]
    await delayedTask()

    expect(settingFactory._removeFromStorage).toHaveBeenCalledWith('test-main', 'shortcut')
  })

  it('returns pending delayed storage saves before the delayed task is flushed', async () => {
    const obj = { trackedBounds: null as Electron.Rectangle | null }
    const oldBounds = { x: 0, y: 0, width: 100, height: 100 }
    const newBounds = { x: 10, y: 20, width: 300, height: 240 }
    const storageValues = {
      trackedBounds: oldBounds
    }
    const { service, settingFactory } = createService({}, obj, storageValues)
    // @ts-expect-error delay requires explicit milliseconds
    const invalidDelayConfig: Parameters<typeof service._saveToStorage>[2] = { delay: true }
    void invalidDelayConfig

    await service._saveToStorage('trackedBounds', newBounds, { delay: 1000 })

    expect(settingFactory._saveToStorage).not.toHaveBeenCalled()
    expect(await service._getFromStorage('trackedBounds')).toEqual(newBounds)

    const delayedTask = settingFactory._delayed.add.mock.calls[0][1]
    await delayedTask()

    expect(settingFactory._saveToStorage).toHaveBeenCalledWith(
      'test-main',
      'trackedBounds',
      newBounds
    )
    storageValues.trackedBounds = oldBounds
    expect(await service._getFromStorage('trackedBounds')).toEqual(oldBounds)
  })

  it('cancels a pending delayed storage save when an immediate save supersedes it', async () => {
    const obj = { trackedBounds: null as Electron.Rectangle | null }
    const delayedBounds = { x: 10, y: 20, width: 300, height: 240 }
    const immediateBounds = { x: 30, y: 40, width: 500, height: 360 }
    const { service, settingFactory } = createService({}, obj)

    await service._saveToStorage('trackedBounds', delayedBounds, { delay: 1000 })
    await service._saveToStorage('trackedBounds', immediateBounds)

    expect(settingFactory._delayed.remove).toHaveBeenCalledWith('test-main/trackedBounds')
    expect(settingFactory._saveToStorage).toHaveBeenCalledWith(
      'test-main',
      'trackedBounds',
      immediateBounds
    )
    expect(await service._getFromStorage('trackedBounds')).toEqual(immediateBounds)
  })
})
