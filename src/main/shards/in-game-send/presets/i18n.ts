import type { TOptions } from 'i18next'
import i18next from 'i18next'

const PRESET_I18N_KEY_PREFIX = 'in-game-send-main.presets'

export function presetT(key: string, options?: TOptions) {
  return String(i18next.t(`${PRESET_I18N_KEY_PREFIX}.${key}`, options))
}

export function presetCommonT(key: string, options?: TOptions) {
  return presetT(`common.${key}`, options)
}

export function presetPunctuation(
  key: 'lineSeparator' | 'listSeparator' | 'memberSeparator' | 'groupSeparator'
) {
  return presetT(`punctuation.${key}`)
}

export function presetPositionName(position: string) {
  return String(i18next.t(`positions.${position}`, { ns: 'common', defaultValue: position }))
}

export function joinPresetList(values: string[]) {
  return values.join(presetPunctuation('listSeparator'))
}

export function joinPresetMembers(values: string[]) {
  return values.join(presetPunctuation('memberSeparator'))
}
