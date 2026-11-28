import { useInstance } from '@renderer-shared/shards'
import { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'
import { computed, reactive } from 'vue'

export interface AramPreset {
  id: string
  name: string
  /** 该预设包含的英雄 id 列表 */
  championIds: number[]
}

const NAMESPACE = 'aram-tools'

/**
 * 模块级单例状态，保证多个组件实例共享同一份预设数据
 */
const state = reactive<{
  presets: AramPreset[]
  activePresetId: string | null
}>({
  presets: [],
  activePresetId: null
})

let initPromise: Promise<void> | null = null

function genId() {
  return `aram-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createDefaultPreset(): AramPreset {
  return { id: genId(), name: '默认预设', championIds: [] }
}

/**
 * 常玩英雄预设管理，数据通过 League Akari 的本地设置存储持久化
 */
export function useAramPresets() {
  const settingUtils = useInstance(SettingUtilsRenderer)

  if (!initPromise) {
    initPromise = (async () => {
      await settingUtils.savedPropVue(NAMESPACE, state, 'presets', {
        watchOptions: { deep: true }
      })
      await settingUtils.savedPropVue(NAMESPACE, state, 'activePresetId')

      if (!state.presets.length) {
        const preset = createDefaultPreset()
        state.presets.push(preset)
        state.activePresetId = preset.id
      }

      if (!state.presets.some((preset) => preset.id === state.activePresetId)) {
        state.activePresetId = state.presets[0]?.id ?? null
      }
    })()
  }

  const activePreset = computed(
    () => state.presets.find((preset) => preset.id === state.activePresetId) ?? null
  )

  const setActivePreset = (id: string | null) => {
    state.activePresetId = id
  }

  const createPreset = (name?: string) => {
    const preset: AramPreset = {
      id: genId(),
      name: name?.trim() || `预设 ${state.presets.length + 1}`,
      championIds: []
    }
    state.presets.push(preset)
    state.activePresetId = preset.id
    return preset
  }

  const renamePreset = (id: string, name: string) => {
    const preset = state.presets.find((item) => item.id === id)
    if (preset) {
      preset.name = name
    }
  }

  const removePreset = (id: string) => {
    const index = state.presets.findIndex((item) => item.id === id)
    if (index === -1) {
      return
    }

    state.presets.splice(index, 1)

    if (!state.presets.length) {
      const preset = createDefaultPreset()
      state.presets.push(preset)
      state.activePresetId = preset.id
      return
    }

    if (state.activePresetId === id) {
      state.activePresetId = state.presets[Math.min(index, state.presets.length - 1)].id
    }
  }

  const setPresetChampions = (id: string, championIds: number[]) => {
    const preset = state.presets.find((item) => item.id === id)
    if (preset) {
      preset.championIds = [...championIds]
    }
  }

  return {
    state,
    activePreset,
    setActivePreset,
    createPreset,
    renamePreset,
    removePreset,
    setPresetChampions
  }
}
