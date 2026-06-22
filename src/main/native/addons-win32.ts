export type Win32Addons = typeof import('league-akari-native-win32')

export let addons: Win32Addons

if (process.platform === 'win32') {
  addons = require('league-akari-native-win32') as Win32Addons

  if (addons.tools.isElevated()) {
    try {
      addons.input.instance.install()

      process.on('exit', () => {
        addons.input.instance.uninstall()
      })
    } catch (error) {
      console.warn('Failed to install native input hook:', error)
    }
  }
}
