export type Win32Addons = typeof import('@leagueakari/league-akari-addons')

export let addons: Win32Addons

if (process.platform === 'win32') {
  addons = require('@leagueakari/league-akari-addons') as Win32Addons

  if (addons.tools.isElevated()) {
    addons.input.instance.install()

    process.on('exit', () => {
      addons.input.instance.uninstall()
    })
  }
}
