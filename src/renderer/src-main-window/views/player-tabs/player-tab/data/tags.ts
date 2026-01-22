import { useComponentName } from '@renderer-shared/composables/useComponentName'
import { useInstance } from '@renderer-shared/shards'
import { useLeagueClientStore } from '@renderer-shared/shards/league-client/store'
import { LoggerRenderer } from '@renderer-shared/shards/logger'
import { SavedPlayerRenderer } from '@renderer-shared/shards/saved-player'
import { PlayerTagDto } from '@shared/types/shards/saved-player'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  inject,
  markRaw,
  provide,
  ref,
  shallowRef,
  toRef,
  watch
} from 'vue'

export type TagsContext = {
  tags: Readonly<Ref<PlayerTagDto[]>>
  isLoading: Readonly<Ref<boolean>>
  loadTags: () => Promise<void>

  /**
   * 删除标记
   * @param puuid 被删除标记的玩家的 puuid
   * @param selfPuuid 删除标记的玩家的 puuid
   * @returns 是否删除成功
   */
  removeTag: (puuid: string, selfPuuid: string) => Promise<boolean>

  /**
   * 编辑标记
   * @param tag 新的标记
   */
  editTag: (tag: string) => Promise<boolean>
}

export const TagsContextKey: InjectionKey<TagsContext> = Symbol('PlayerTabTagsContext')

export function provideTags(props: { puuid: MaybeRefOrGetter<string> }) {
  const puuid = toRef(props.puuid)

  const sp = useInstance(SavedPlayerRenderer)
  const log = useInstance(LoggerRenderer)

  const lcs = useLeagueClientStore()

  const componentName = useComponentName()

  const isLoading = ref(false)
  const tags = shallowRef<PlayerTagDto[]>([])

  const loadTags = async () => {
    if (isLoading.value || !lcs.summoner.me) return

    isLoading.value = true

    try {
      const data = await sp.getPlayerTags({
        puuid: puuid.value,
        selfPuuid: lcs.summoner.me.puuid
      })

      tags.value = markRaw(data)
    } catch (error: any) {
      log.warn(componentName, error)
    } finally {
      isLoading.value = false
    }
  }

  const removeTag = async (puuid: string, selfPuuid: string): Promise<boolean> => {
    isLoading.value = true

    try {
      await sp.updatePlayerTag({
        puuid,
        selfPuuid,
        tag: null
      })

      return true
    } catch (error) {
      log.warn(componentName, error)

      return false
    } finally {
      isLoading.value = false
    }
  }

  const editTag = async (tag: string) => {
    if (!lcs.summoner.me || !lcs.auth) {
      return false
    }

    try {
      await sp.updatePlayerTag({
        puuid: puuid.value,
        selfPuuid: lcs.summoner.me.puuid,
        tag: tag,
        rsoPlatformId: lcs.auth.rsoPlatformId,
        region: lcs.auth.region
      })

      loadTags().catch((error) => log.warn(componentName, error))

      return true
    } catch (error: any) {
      log.warn(componentName, error)

      return false
    }
  }

  watch(
    [puuid, () => lcs.summoner.me?.puuid],
    () => {
      loadTags()
    },
    { immediate: true }
  )

  provide(TagsContextKey, {
    tags,
    isLoading,
    loadTags,
    removeTag,
    editTag
  })

  return { tags, isLoading, loadTags, removeTag, editTag }
}

export function useTags() {
  const context = inject(TagsContextKey)

  if (!context) {
    throw new Error('useTags must be used within a PlayerTab')
  }

  return context
}
