export class NotSupportedPlatformError extends Error {
  constructor(feature: string, platform: string) {
    super(`${feature} is not supported on platform ${platform}`)
    this.name = 'NotSupportedPlatformError'
  }
}
