const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function isSupportedByList(value, list) {
  if (!Array.isArray(list) || list.length === 0) {
    return true
  }

  if (list.includes(`!${value}`)) {
    return false
  }

  const allowedValues = list.filter((item) => !item.startsWith('!'))
  return allowedValues.length === 0 || allowedValues.includes(value)
}

function isSupportedByCurrentPlatform(packageJson) {
  return (
    isSupportedByList(process.platform, packageJson.os) &&
    isSupportedByList(process.arch, packageJson.cpu)
  )
}

function toRebuildModuleNames(packageRoot, packageName) {
  const names = new Set()

  if (packageName) {
    names.add(packageName)
  }

  const relativePath = path.relative(repoRoot, packageRoot)
  if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
    names.add(relativePath.split(path.sep).join('/'))
  }

  return names
}

function collectUnsupportedNativeWorkspaceModules() {
  const rootPackageJson = readJson(path.join(repoRoot, 'package.json'))
  const workspacePaths = Array.isArray(rootPackageJson.workspaces)
    ? rootPackageJson.workspaces
    : rootPackageJson.workspaces?.packages

  if (!Array.isArray(workspacePaths)) {
    return []
  }

  const unsupportedModules = new Set()

  for (const workspacePath of workspacePaths) {
    if (workspacePath.includes('*')) {
      continue
    }

    const packageRoot = path.join(repoRoot, workspacePath)
    const packageJsonPath = path.join(packageRoot, 'package.json')
    const bindingGypPath = path.join(packageRoot, 'binding.gyp')

    if (!fs.existsSync(packageJsonPath) || !fs.existsSync(bindingGypPath)) {
      continue
    }

    const packageJson = readJson(packageJsonPath)
    if (isSupportedByCurrentPlatform(packageJson)) {
      continue
    }

    for (const name of toRebuildModuleNames(packageRoot, packageJson.name)) {
      unsupportedModules.add(name)
    }
  }

  return [...unsupportedModules].sort()
}

async function rebuildElectronNativeDependencies() {
  const { rebuild } = await import('@electron/rebuild')
  const electronVersion = readJson(
    path.join(repoRoot, 'node_modules', 'electron', 'package.json')
  ).version
  const ignoreModules = collectUnsupportedNativeWorkspaceModules()

  if (ignoreModules.length) {
    console.log(
      `[clear-electron-rebuild-metadata] Skipping native modules unsupported on ${process.platform}-${process.arch}: ${ignoreModules.join(', ')}`
    )
  }

  await rebuild({
    buildPath: repoRoot,
    electronVersion,
    arch: process.arch,
    platform: process.platform,
    projectRootPath: repoRoot,
    mode: 'sequential',
    disablePreGypCopy: true,
    ignoreModules
  })
}

// better-sqlite3 can refresh the .node file for host Node while leaving an
// Electron rebuild marker behind. Drop only that marker so the Electron rebuild
// performs normally instead of incorrectly skipping it.
const staleMetadataPaths = [
  path.join(repoRoot, 'node_modules', 'better-sqlite3', 'build', 'Release', '.forge-meta')
]

for (const metadataPath of staleMetadataPaths) {
  if (fs.existsSync(metadataPath)) {
    fs.rmSync(metadataPath, { force: true })
    console.log(
      `[clear-electron-rebuild-metadata] Removed ${path.relative(repoRoot, metadataPath)}`
    )
  }
}

rebuildElectronNativeDependencies().catch((error) => {
  console.error(error)
  process.exit(1)
})
