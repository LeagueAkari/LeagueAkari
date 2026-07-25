import { AddonLoadError, AddonNotLoadedError, NativeAddonFeature } from './errors'

export class NativeAddonBinding<T> {
  private binding: T | undefined

  constructor(
    private readonly feature: NativeAddonFeature,
    private readonly loader: () => T
  ) {}

  load(): void {
    if (this.binding !== undefined) {
      return
    }

    try {
      const binding = this.loader()
      if (binding === undefined || binding === null) {
        throw new TypeError(`Native ${this.feature} addon returned no exports`)
      }
      this.binding = binding
    } catch (cause) {
      throw new AddonLoadError(this.feature, cause)
    }
  }

  isLoaded(): boolean {
    return this.binding !== undefined
  }

  get(): T {
    if (this.binding === undefined) {
      throw new AddonNotLoadedError(this.feature)
    }

    return this.binding
  }
}
