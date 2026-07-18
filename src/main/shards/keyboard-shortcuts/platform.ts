export function shouldUseElectronGlobalShortcuts(platform: NodeJS.Platform = process.platform) {
  return platform === 'darwin'
}
