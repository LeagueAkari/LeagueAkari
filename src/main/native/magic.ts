import darwinArm64Path from '@resources/magic/magic.darwin-arm64.node?asset&asarUnpack'
import win32X64Path from '@resources/magic/magic.win32-x64.node?asset&asarUnpack'

interface MagicAddon {
  magic: (value: string) => string
}

let addon: MagicAddon | null | undefined

export function magic(value: string) {
  if (addon === undefined) {
    const addonPath =
      process.platform === 'win32' && process.arch === 'x64'
        ? win32X64Path
        : process.platform === 'darwin' && process.arch === 'arm64'
          ? darwinArm64Path
          : null

    try {
      addon = addonPath ? (require(addonPath) as MagicAddon) : null
    } catch {
      addon = null
    }
  }

  try {
    return addon?.magic(value) || ''
  } catch {
    return ''
  }
}
