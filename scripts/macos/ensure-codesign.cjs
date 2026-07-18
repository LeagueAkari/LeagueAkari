/* eslint-disable no-console */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' })
  if (res.error) throw res.error
  return res.status ?? 1
}

function inspectSignature(appPath) {
  const result = spawnSync('codesign', ['--display', '--verbose=4', appPath], {
    encoding: 'utf8'
  })

  return {
    status: result.status ?? 1,
    output: `${result.stdout || ''}\n${result.stderr || ''}`
  }
}

function hasNamedSigningAuthority(signatureOutput) {
  return /^Authority=.+$/m.test(signatureOutput)
}

function ensureCodesign(appPath) {
  if (process.platform !== 'darwin') return

  if (!appPath) {
    throw new Error('Usage: node scripts/macos/ensure-codesign.cjs "<path-to-app>"')
  }

  if (!fs.existsSync(appPath)) {
    throw new Error(`App not found: ${appPath}`)
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

  const signature = inspectSignature(appPath)
  if (signature.status === 0 && hasNamedSigningAuthority(signature.output)) {
    throw new Error(
      '[ensure-codesign] A named signing identity produced an invalid bundle; refusing to replace it with an ad-hoc signature'
    )
  }

  console.log('[ensure-codesign] codesign verify failed; applying ad-hoc signature...')
  const signStatus = run('codesign', ['--force', '--deep', '--sign', '-', appPath])
  if (signStatus !== 0) {
    throw new Error(`[ensure-codesign] Ad-hoc signing failed with exit code ${signStatus}`)
  }

  const verify2Status = run('codesign', verifyArgs)
  if (verify2Status !== 0) {
    throw new Error(
      `[ensure-codesign] Ad-hoc signature verification failed with exit code ${verify2Status}`
    )
  }

  console.log('[ensure-codesign] ad-hoc signature applied and verified')
}

module.exports = async function ensureCodesignHook(context) {
  if (process.platform !== 'darwin' || context.electronPlatformName !== 'darwin') return

  const productFilename = context.packager.appInfo.productFilename
  ensureCodesign(path.join(context.appOutDir, `${productFilename}.app`))
}

if (require.main === module) {
  try {
    ensureCodesign(process.argv[2])
  } catch (error) {
    console.error(error)
    process.exitCode = 1
  }
}

module.exports.ensureCodesign = ensureCodesign
module.exports.hasNamedSigningAuthority = hasNamedSigningAuthority
