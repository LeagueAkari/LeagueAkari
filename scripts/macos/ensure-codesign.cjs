/* eslint-disable no-console */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' })
  if (res.error) throw res.error
  return res.status ?? 1
}

function main() {
  if (process.platform !== 'darwin') return

  const appPath = process.argv[2]
  if (!appPath) {
    console.error('Usage: node scripts/macos/ensure-codesign.cjs "<path-to-app>"')
    process.exit(2)
  }

  if (!fs.existsSync(appPath)) {
    console.error(`App not found: ${appPath}`)
    process.exit(2)
  }

  // When electron-builder can't sign (no identity), but Electron fuses are enabled,
  // the shipped signature may become invalid after fuses patching, causing macOS to SIGKILL on launch.
  // If verification fails, re-sign ad-hoc and verify again.
  const verifyArgs = ['--verify', '--deep', '--strict', '--verbose=2', appPath]
  const verifyStatus = run('codesign', verifyArgs)

  if (verifyStatus === 0) {
    console.log('[ensure-codesign] codesign verify ok; skip re-sign')
    return
  }

  console.log('[ensure-codesign] codesign verify failed; applying ad-hoc signature...')
  const signStatus = run('codesign', ['--force', '--deep', '--sign', '-', appPath])
  if (signStatus !== 0) process.exit(signStatus)

  const verify2Status = run('codesign', verifyArgs)
  if (verify2Status !== 0) process.exit(verify2Status)

  console.log('[ensure-codesign] ad-hoc signature applied and verified')
}

main()

