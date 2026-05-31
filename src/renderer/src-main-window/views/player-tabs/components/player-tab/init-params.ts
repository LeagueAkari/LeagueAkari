import mitt from 'mitt'
import {
  InjectionKey,
  MaybeRefOrGetter,
  Ref,
  computed,
  inject,
  provide,
  shallowRef,
  toValue,
  watch
} from 'vue'

import type { InitParams, MatchHistoryInitParams } from '@main-window/shards/player-tabs'
import { usePlayerTabsStore } from '@main-window/shards/player-tabs/store'

export type InitParamsContext = {
  pendingInitParams: Ref<InitParams>

  /** 立即获取并消费 MatchHistoryInitParams，如果没有则返回 null */
  consumeMatchHistoryInitParams: () => MatchHistoryInitParams | null

  onMatchHistoryInitParamsUpdate: (callback: (newParams: MatchHistoryInitParams) => void) => void
}

export const InitParamsContextKey: InjectionKey<InitParamsContext> = Symbol(
  'PlayerTabInitParamsToolContext'
)

/**
 * initParams 的每次非空更新会立即下发一次，并同步清除
 */
export function provideInitParamsTool(props: { id: MaybeRefOrGetter<string> }) {
  const pts = usePlayerTabsStore()

  const initParams = computed(() => {
    const tab = pts.getTab(toValue(props.id))!
    return tab.initParams
  })

  const pendingInitParams = shallowRef<InitParams>({})

  const writeAndClear = (initParams: InitParams) => {
    pendingInitParams.value = initParams
    pts.updateTabData(toValue(props.id), { initParams: null })
  }

  // 第一次同步进入不会推送事件，约定上，依赖各数据模块主动 consume 掉
  if (initParams.value) {
    writeAndClear(initParams.value)
  }

  const events = mitt<{
    update: undefined
  }>()

  // 后续的每次变化会导致回调触发一次
  watch(
    () => initParams.value,
    (params) => {
      if (params) {
        writeAndClear(params)
        events.emit('update')
      }
    }
  )

  const consumeMatchHistoryInitParams = () => {
    if (pendingInitParams.value.matchHistory) {
      const ret = pendingInitParams.value.matchHistory
      delete pendingInitParams.value.matchHistory
      return ret
    }

    return null
  }

  const onMatchHistoryInitParamsUpdate = (
    callback: (newParams: MatchHistoryInitParams) => void
  ) => {
    events.on('update', () => {
      const params = consumeMatchHistoryInitParams()
      if (params) {
        callback(params)
      }
    })
  }

  provide(InitParamsContextKey, {
    pendingInitParams,
    consumeMatchHistoryInitParams,
    onMatchHistoryInitParamsUpdate
  })

  return { pendingInitParams, consumeMatchHistoryInitParams, onMatchHistoryInitParamsUpdate }
}

export function useInitParamsTool() {
  const context = inject(InitParamsContextKey)

  if (!context) {
    throw new Error('useInitParamsTool must be used within a player tab component')
  }

  return context
}
