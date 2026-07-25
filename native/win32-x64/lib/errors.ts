export type NativeAddonFeature = 'input' | 'tools'

export class AddonLoadError extends Error {
  public readonly feature: NativeAddonFeature
  public readonly cause: unknown

  constructor(feature: NativeAddonFeature, cause: unknown) {
    super(`Failed to load native ${feature} addon`)
    this.name = 'AddonLoadError'
    this.feature = feature
    this.cause = cause
  }
}

export class AddonNotLoadedError extends Error {
  public readonly feature: NativeAddonFeature

  constructor(feature: NativeAddonFeature) {
    super(`Native ${feature} addon is not loaded`)
    this.name = 'AddonNotLoadedError'
    this.feature = feature
  }
}
