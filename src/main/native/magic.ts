import path from 'node:path'

interface MagicAddon {
  magic: (value: string) => string
}

let addon: MagicAddon | null | undefined

export function resolveMagicAddonPath(
  platform: NodeJS.Platform,
  architecture: string,
  baseDir: string
) {
  const addonFilename =
    platform === 'win32' && architecture === 'x64'
      ? 'magic.win32-x64.node'
      : platform === 'darwin' && architecture === 'arm64'
        ? 'magic.darwin-arm64.node'
        : null

  if (!addonFilename) {
    return null
  }

  return path
    .join(baseDir, '../../resources/magic', addonFilename)
    .replace('app.asar', 'app.asar.unpacked')
}

export function magic(value: string) {
  if (addon === undefined) {
    const addonPath = resolveMagicAddonPath(process.platform, process.arch, __dirname)

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
