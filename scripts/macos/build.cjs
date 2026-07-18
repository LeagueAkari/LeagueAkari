/* eslint-disable no-console */
const { spawnSync } = require('node:child_process')

const ACCEPTED_KEYCHAIN_IDENTITIES = [
  'Developer ID Application:',
  '3rd Party Mac Developer Application:',
  'Mac Developer:'
]

function hasExplicitSigningIdentity(env = process.env) {
  return Boolean(env.CSC_LINK || (env.CSC_NAME && env.CSC_NAME !== '-'))
}

function hasUsableKeychainIdentity() {
  const result = spawnSync('security', ['find-identity', '-v', '-p', 'codesigning'], {
    encoding: 'utf8'
  })

  if (result.error || result.status !== 0) {
    return false
  }

  return ACCEPTED_KEYCHAIN_IDENTITIES.some((identity) => result.stdout.includes(identity))
}

function shouldUseAdHocSigning(env = process.env) {
  if (env.CSC_NAME === '-') {
    return true
  }

  if (hasExplicitSigningIdentity(env)) {
    return false
  }

  if (env.CSC_IDENTITY_AUTO_DISCOVERY === 'false') {
    return true
  }

  return !hasUsableKeychainIdentity()
}

function buildElectronBuilderArgs(useAdHocSigning, extraArgs = []) {
  const args = ['--mac', '--arm64', '--config']

  if (useAdHocSigning) {
    args.push('--config.mac.identity=-', '--config.mac.hardenedRuntime=false')
  }

  return [...args, ...extraArgs]
}

function run() {
  if (process.platform !== 'darwin') {
    throw new Error('The macOS package must be built on macOS')
  }

  const useAdHocSigning = shouldUseAdHocSigning()
  if (useAdHocSigning) {
    console.log('[macos-build] No signing identity found; using an ad-hoc local signature')
  } else {
    console.log('[macos-build] Using the configured or keychain signing identity')
  }

  const electronBuilderCli = require.resolve('electron-builder/out/cli/cli.js')
  const result = spawnSync(
    process.execPath,
    [electronBuilderCli, ...buildElectronBuilderArgs(useAdHocSigning, process.argv.slice(2))],
    { stdio: 'inherit' }
  )

  if (result.error) {
    throw result.error
  }

  process.exitCode = result.status ?? 1
}

if (require.main === module) {
  try {
    run()
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

module.exports = {
  buildElectronBuilderArgs,
  hasExplicitSigningIdentity,
  shouldUseAdHocSigning
}
