const fs = require('node:fs')
const path = require('node:path')

const PACKAGED_APP_REMOVALS = [
  path.join(
    'resources',
    'app.asar.unpacked',
    'node_modules',
    'league-akari-native-win32',
    'src'
  ),
  path.join(
    'resources',
    'app.asar.unpacked',
    'node_modules',
    'league-akari-native-win32',
    'dist',
    'tsconfig.tsbuildinfo'
  )
]

module.exports = async function trimPackagedApp(context) {
  for (const relativePath of PACKAGED_APP_REMOVALS) {
    fs.rmSync(path.join(context.appOutDir, relativePath), {
      force: true,
      recursive: true
    })
  }
}
