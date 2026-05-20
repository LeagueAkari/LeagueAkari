import { IntervalTask } from '@main/utils/timer'
import { ReleaseOverridesPlainObjectSchema } from '@shared/schemas/remote-config'
import { LatestReleaseInfo, ReleaseArchiveFile } from '@shared/types/akari'
import { GithubApiLatestRelease } from '@shared/types/github'
import { isAxiosError } from 'axios'
import { app } from 'electron'
import { comparer } from 'mobx'
import { gt } from 'semver'

import {
  REMOTE_CONFIG_VOLATILE_RESOURCE_UPDATE_INTERVAL,
  type RemoteConfigMainContext
} from './context'
import { hasReachedRemoteRateLimit } from './rate-limit'

export class RemoteConfigReleaseController {
  private readonly _latestReleaseTask = new IntervalTask(this._updateFromRemote.bind(this), {
    interval: REMOTE_CONFIG_VOLATILE_RESOURCE_UPDATE_INTERVAL
  })

  constructor(private readonly _context: RemoteConfigMainContext) {}

  watch() {
    const { appCommon, mobxUtils, settings } = this._context

    // 版本更新开关切换时需要重新获取版本更新。
    mobxUtils.reaction(
      () => ({
        source: settings.preferredSource,
        locale: appCommon.settings.locale,
        updateLatestRelease: settings.updateLatestRelease
      }),
      ({ updateLatestRelease }) => {
        if (updateLatestRelease) {
          this._latestReleaseTask.start({ runImmediately: true })
        } else {
          this._latestReleaseTask.cancel()
        }
      },
      { fireImmediately: true, equals: comparer.shallow }
    )
  }

  /**
   * 手动执行一次独立的版本更新检查。
   *
   * 如果查询成功，则会立即替换当前的 latestRelease，同时重启定时任务。
   */
  async updateLatestReleaseManually() {
    const { logger, repository, settings, state } = this._context

    if (state.isUpdatingLatestRelease) {
      return state.latestRelease
    }

    state.setUpdatingLatestRelease(true)
    this._latestReleaseTask.cancel()

    try {
      logger.info('Updating Latest Release.. Manually', settings.preferredSource)

      const { data } = await repository.getLatestRelease({
        source: settings.preferredSource,
        repo: 'akari'
      })

      const release = await this._completeReleaseInfo(data)
      state.setLatestRelease(release)
      this._latestReleaseTask.start()
    } catch (error) {
      if (hasReachedRemoteRateLimit(error, logger)) {
        return
      }

      // 同上
      if (isAxiosError(error) && error.response) {
        try {
          state.setLatestRelease(await this.getLatestReleaseFromLastResort())

          logger.info('Updated Latest Release from last resort (manual)')
        } catch (error) {
          logger.warn('Failed to get latest release from last resort (manual)', error)
        }
      }

      logger.warn('Update Latest Release failed (manual)', error)
    } finally {
      state.setUpdatingLatestRelease(false)
    }

    return state.latestRelease
  }

  async getLatestReleaseFromLastResort(): Promise<LatestReleaseInfo> {
    const { akariApi, appCommon, settings } = this._context
    const { data } = await akariApi.getLastResortLatestRelease()

    // 最终的希望
    if (
      !data.version ||
      !data.publishedAt ||
      !data.descriptions ||
      !data.archiveFileGitHub ||
      !data.archiveFileGitee
    ) {
      throw new Error('Invalid last resort latest release')
    }

    const currentVersion = app.getVersion()
    const locale = appCommon.settings.locale as 'zh-CN' | 'en'
    const source = settings.preferredSource

    return {
      version: data.version,
      currentVersion,
      isNew: gt(data.version, currentVersion),
      source: 'last-resort',
      publishedAt: data.publishedAt,
      description: data.descriptions[locale] ?? '',
      archiveFile: source === 'gitee' ? data.archiveFileGitee : data.archiveFileGitHub
    }
  }

  /**
   * 补全此 release 的信息。
   *
   * 优先以 overrides.json 中的信息为准:
   *
   * - 对于 description，优先级 overrides.json > changelog.md >  release body
   * - 对于 publishedAt，优先级 overrides.json > release.published_at
   * - 对于 version，优先级 overrides.json > release.tag_name
   * - 对于 archiveFile，优先级 overrides.json > release.assets 中找到的文件
   */
  private async _completeReleaseInfo(release: GithubApiLatestRelease): Promise<LatestReleaseInfo> {
    const { appCommon, logger, repository, settings } = this._context
    const currentVersion = app.getVersion()
    const locale = appCommon.settings.locale as 'zh-CN' | 'en'
    const source = settings.preferredSource
    const configRepoRequest = {
      source,
      repo: 'akari-config' as const,
      branch: 'main'
    }

    const [changelogResp, overridesResp] = await Promise.allSettled([
      repository.getRawContent(`/releases/${release.tag_name}/${locale}.md`, configRepoRequest),
      repository.getRawContent(`/releases/${release.tag_name}/overrides.json`, configRepoRequest)
    ])

    // 从 assets 中找到归档包文件，在没有默认覆盖的情况下就用这个
    const archiveAsset = release.assets.find((asset) => {
      return (
        // for github
        ((asset.content_type === 'application/x-compressed' ||
          asset.content_type === 'application/x-7z-compressed') &&
          asset.name.includes('win')) ||
        // for gitee，它没有 content_type 字段
        asset.browser_download_url.endsWith('win.7z')
      )
    })

    // overrides
    let description = changelogResp.status === 'fulfilled' ? changelogResp.value.data : release.body
    let publishedAt = release.published_at || release.created_at
    let version = release.tag_name
    let archiveFile: ReleaseArchiveFile | null = archiveAsset
      ? {
          name: archiveAsset.name,
          size: archiveAsset.size,
          downloadUrl: archiveAsset.browser_download_url,
          contentType: archiveAsset.content_type
        }
      : null

    if (overridesResp.status === 'fulfilled') {
      const { success, data, error } = ReleaseOverridesPlainObjectSchema.safeParse(
        overridesResp.value.data
      )

      logger.info('Got overrides.json for release ', data)

      if (success) {
        if (source === 'gitee' && data.archiveFileGitee) {
          archiveFile = data.archiveFileGitee
        } else if (source === 'github' && data.archiveFileGitHub) {
          archiveFile = data.archiveFileGitHub
        }

        if (data.descriptions && data.descriptions[locale]) {
          description = data.descriptions[locale]
        }

        if (data.version) {
          version = data.version
        }

        if (data.publishedAt) {
          publishedAt = data.publishedAt
        }
      } else {
        // 没有 overrides
        logger.warn('Failed to parse overrides.json for release ' + release.tag_name, error)
      }
    } else {
      logger.info('No release overrides found for release ' + release.tag_name)
    }

    // 红线：必须要有 archiveFile
    if (!archiveFile) {
      logger.warn('No archive file found for release ' + release.tag_name)
      throw new Error('No archive file found for release ' + release.tag_name)
    }

    return {
      version,
      currentVersion,
      publishedAt,
      isNew: gt(version, currentVersion),
      source,
      description,
      archiveFile
    }
  }

  /**
   * 更新最新版本，不会保存到本地。
   */
  private async _updateFromRemote() {
    const { logger, repository, settings, state } = this._context

    if (state.isUpdatingLatestRelease) {
      return
    }

    state.setUpdatingLatestRelease(true)

    try {
      const { data } = await repository.getLatestRelease({
        source: settings.preferredSource,
        repo: 'akari'
      })

      state.setLatestRelease(await this._completeReleaseInfo(data))

      logger.info('Updated Latest Release', settings.preferredSource)
    } catch (error) {
      if (hasReachedRemoteRateLimit(error, logger)) {
        return
      }

      // 走 last-resort 逻辑，疑似目标仓库出现问题，使用备用方案
      if (isAxiosError(error) && error.response) {
        try {
          state.setLatestRelease(await this.getLatestReleaseFromLastResort())

          logger.info('Updated Latest Release from last resort')
        } catch (error) {
          logger.warn('Failed to get latest release from last resort', error)
        }

        return
      }

      logger.warn('Update Latest Release failed', error)
    } finally {
      state.setUpdatingLatestRelease(false)
    }
  }
}
