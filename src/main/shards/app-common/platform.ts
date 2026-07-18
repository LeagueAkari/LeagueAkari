export function canRelaunchAsAdministrator(platform: NodeJS.Platform = process.platform) {
  return platform === 'win32'
}
