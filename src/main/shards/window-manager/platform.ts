export function shouldShowOverlayOnAllWorkspaces(platform: NodeJS.Platform = process.platform) {
  return platform === 'darwin'
}
