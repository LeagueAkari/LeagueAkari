import { app } from 'electron'

export const ADMINISTRATOR_RELAUNCH_SWITCH = 'akari-administrator-relaunch'

export function supportsAdministratorRelaunch(platform = process.platform) {
  return platform === 'win32'
}

export function getAdministratorRelaunchParentPid(
  argv = process.argv,
  platform = process.platform
) {
  if (!supportsAdministratorRelaunch(platform)) {
    return null
  }

  const value = argv.find((arg) => arg.startsWith(`--${ADMINISTRATOR_RELAUNCH_SWITCH}=`))
  const pidText = value?.slice(ADMINISTRATOR_RELAUNCH_SWITCH.length + 3)
  if (!pidText || !/^[1-9]\d*$/.test(pidText)) {
    return null
  }

  const pid = Number(pidText)
  return Number.isSafeInteger(pid) && pid <= 0xffffffff && pid !== process.pid ? pid : null
}

const administratorRelaunchParentPid = getAdministratorRelaunchParentPid()

export function wasRelaunchedAsAdministrator() {
  return administratorRelaunchParentPid !== null
}

/** Wait before Electron's first tick: bootstrap must still register schemes and GPU flags pre-ready. */
export function waitForAdministratorRelaunchParent(
  parentPid = administratorRelaunchParentPid,
  timeoutMs = 30_000
) {
  if (parentPid === null || !supportsAdministratorRelaunch()) {
    return
  }

  // This is a one-shot handoff, not an argument for future ordinary app.relaunch() calls.
  app.commandLine.removeSwitch(ADMINISTRATOR_RELAUNCH_SWITCH)
  process.argv = process.argv.filter(
    (arg) => !arg.startsWith(`--${ADMINISTRATOR_RELAUNCH_SWITCH}=`)
  )

  const deadline = Date.now() + timeoutMs
  const sleepArray = new Int32Array(new SharedArrayBuffer(4))
  while (true) {
    try {
      process.kill(parentPid, 0)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
        return
      }
      throw error
    }

    if (Date.now() >= deadline) {
      throw new Error(
        'The previous League Akari process has not exited. Please close it and retry.'
      )
    }
    Atomics.wait(sleepArray, 0, 0, 50)
  }
}
