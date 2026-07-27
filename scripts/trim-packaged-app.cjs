const fs = require('node:fs')
const path = require('node:path')
const { Arch } = require('builder-util')

const PACKAGED_RESOURCE_REMOVALS = [
  path.join('app.asar.unpacked', 'node_modules', 'league-akari-native-win32', 'src'),
  path.join(
    'app.asar.unpacked',
    'node_modules',
    'league-akari-native-win32',
    'dist',
    'tsconfig.tsbuildinfo'
  )
]

function getBetterSqlite3PrebuildsToKeep(platformName, arch) {
  const archName = Arch[arch]

  if (archName === 'universal' && ['darwin', 'mas'].includes(platformName)) {
    return new Set(['darwin-x64.node', 'darwin-arm64.node'])
  }

  if (!['x64', 'arm64'].includes(archName)) {
    return null
  }

  switch (platformName) {
    case 'win32':
      return new Set([`win32-${archName}.node`])
    case 'darwin':
    case 'mas':
      return new Set([`darwin-${archName}.node`])
    case 'linux':
      return new Set([`linux-${archName}.node`, `linuxmusl-${archName}.node`])
    default:
      return null
  }
}

function trimBetterSqlite3Prebuilds(resourcesDir, platformName, arch) {
  const prebuildsDir = path.join(
    resourcesDir,
    'app.asar.unpacked',
    'node_modules',
    'better-sqlite3',
    'prebuilds'
  )

  if (!fs.existsSync(prebuildsDir)) {
    return
  }

  const prebuildsToKeep = getBetterSqlite3PrebuildsToKeep(platformName, arch)
  if (!prebuildsToKeep) {
    return
  }

  const entries = fs.readdirSync(prebuildsDir, { withFileTypes: true })
  const availablePrebuilds = new Set(
    entries.filter((entry) => entry.isFile()).map((entry) => entry.name)
  )

  for (const prebuildToKeep of prebuildsToKeep) {
    if (!availablePrebuilds.has(prebuildToKeep)) {
      throw new Error(
        `Missing better-sqlite3 prebuild for ${platformName}/${Arch[arch]}: ${prebuildToKeep}`
      )
    }
  }

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.node') && !prebuildsToKeep.has(entry.name)) {
      fs.rmSync(path.join(prebuildsDir, entry.name), { force: true })
    }
  }
}

module.exports = async function trimPackagedApp(context) {
  const resourcesDir = context.packager.getResourcesDir(context.appOutDir)

  for (const relativePath of PACKAGED_RESOURCE_REMOVALS) {
    fs.rmSync(path.join(resourcesDir, relativePath), {
      force: true,
      recursive: true
    })
  }

  trimBetterSqlite3Prebuilds(resourcesDir, context.electronPlatformName, context.arch)
}
