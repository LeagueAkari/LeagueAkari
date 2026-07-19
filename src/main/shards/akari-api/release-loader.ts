import {
  type AkariApiLanguage,
  type AkariRelease,
  AkariReleaseSchema
} from '@shared/shards/akari-api'

import type { AkariApiMainContext } from './context'

export class AkariApiReleaseLoader {
  private _updatePromise: Promise<AkariRelease> | null = null

  constructor(private readonly _context: AkariApiMainContext) {}

  updateLatestRelease(language: AkariApiLanguage) {
    if (this._updatePromise) {
      return this._updatePromise
    }

    this._context.state.setUpdatingLatestRelease(true)

    const updatePromise = this._fetchLatestRelease(language)
      .then((release) => {
        this._context.state.setLatestRelease(release)
        this._context.logger.info('Updated latest release')
        return release
      })
      .catch((error) => {
        this._context.logger.warn('Update latest release failed', error)
        throw error
      })
      .finally(() => {
        this._context.state.setUpdatingLatestRelease(false)
        if (this._updatePromise === updatePromise) {
          this._updatePromise = null
        }
      })

    this._updatePromise = updatePromise
    return updatePromise
  }

  private async _fetchLatestRelease(language: AkariApiLanguage): Promise<AkariRelease> {
    const response = await this._context.api.getLatestRelease(language)
    return AkariReleaseSchema.parse(response.data)
  }
}
