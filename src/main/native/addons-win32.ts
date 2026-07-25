export type Win32Addons = typeof import('league-akari-native-win32')

export interface Win32AddonsInitializationResult {
  addons: Win32Addons
  isElevated: boolean
  inputInitializationError?: unknown
}

type RegisterExitListener = (listener: () => void) => void

function loadWin32AddonsPackage(): Win32Addons {
  return require('league-akari-native-win32') as Win32Addons
}

function registerProcessExitListener(listener: () => void) {
  process.once('exit', listener)
}

export function initializeWin32Addons(
  addons: Win32Addons = loadWin32AddonsPackage(),
  registerExitListener: RegisterExitListener = registerProcessExitListener
): Win32AddonsInitializationResult {
  addons.tools.load()

  const isElevated = addons.tools.isElevated()
  if (!isElevated) {
    return { addons, isElevated }
  }

  try {
    addons.input.load()
    addons.input.instance.install()

    registerExitListener(() => {
      if (addons.input.instance.isInstalled) {
        addons.input.instance.uninstall()
      }
    })

    return { addons, isElevated }
  } catch (inputInitializationError) {
    return { addons, isElevated, inputInitializationError }
  }
}
