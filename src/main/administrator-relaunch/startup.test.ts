import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  wait: vi.fn(),
  lock: vi.fn(),
  bootstrap: vi.fn(),
  quit: vi.fn(),
  exit: vi.fn(),
  showErrorBox: vi.fn()
}))
vi.mock('@main/administrator-relaunch', () => ({ waitForAdministratorRelaunchParent: mocks.wait }))
vi.mock('../bootstrap', () => ({ bootstrap: mocks.bootstrap }))
vi.mock('electron', () => ({
  app: {
    setAppUserModelId: vi.fn(),
    requestSingleInstanceLock: mocks.lock,
    quit: mocks.quit,
    exit: mocks.exit
  },
  dialog: { showErrorBox: mocks.showErrorBox }
}))

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
  mocks.lock.mockReturnValue(true)
})

it('waits for the predecessor before taking the lock and bootstrapping the app', async () => {
  await import('../main.js')
  expect(mocks.wait).toHaveBeenCalledBefore(mocks.lock)
  expect(mocks.lock).toHaveBeenCalledBefore(mocks.bootstrap)
})

it('does not initialize another app or open its database after a failed handoff', async () => {
  mocks.wait.mockImplementation(() => {
    throw new Error('predecessor did not exit')
  })
  await import('../main.js')
  expect(mocks.showErrorBox).toHaveBeenCalledTimes(1)
  expect(mocks.exit).toHaveBeenCalledWith(1)
  expect(mocks.lock).not.toHaveBeenCalled()
  expect(mocks.bootstrap).not.toHaveBeenCalled()
})

it('preserves the normal single-instance rejection path', async () => {
  mocks.lock.mockReturnValue(false)
  await import('../main.js')
  expect(mocks.quit).toHaveBeenCalledTimes(1)
  expect(mocks.bootstrap).not.toHaveBeenCalled()
})
