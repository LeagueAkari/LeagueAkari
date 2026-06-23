const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const repoRoot = path.resolve(__dirname, '..')

// better-sqlite3 can refresh the .node file for host Node while leaving an
// Electron rebuild marker behind. Drop only that marker so install-app-deps
// performs a normal Electron rebuild instead of incorrectly skipping it.
const staleMetadataPaths = [
  path.join(repoRoot, 'node_modules', 'better-sqlite3', 'build', 'Release', '.forge-meta')
]

for (const metadataPath of staleMetadataPaths) {
  if (fs.existsSync(metadataPath)) {
    fs.rmSync(metadataPath, { force: true })
    console.log(`[clear-electron-rebuild-metadata] Removed ${path.relative(repoRoot, metadataPath)}`)
  }
}

const executableName = process.platform === 'win32' ? 'electron-builder.cmd' : 'electron-builder'
const localExecutable = path.join(repoRoot, 'node_modules', '.bin', executableName)
const command = fs.existsSync(localExecutable) ? localExecutable : executableName
const result = spawnSync(command, ['install-app-deps'], {
  cwd: repoRoot,
  shell: process.platform === 'win32',
  stdio: 'inherit'
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

if (typeof result.status === 'number') {
  process.exit(result.status)
}

if (result.signal) {
  console.error(`electron-builder install-app-deps exited with signal ${result.signal}`)
  process.exit(1)
}
