import { AppThemeId } from '@shared/types/app-theme'
import { GlobalThemeOverrides } from 'naive-ui'

import { AURORA_THEME_OVERRIDES } from './aurora'
import { BUTTER_THEME_OVERRIDES } from './butter'
import { CYBER_THEME_OVERRIDES } from './cyber'
import { DARK_THEME_OVERRIDES } from './dark'
import { GRAPHITE_THEME_OVERRIDES } from './graphite'
import { LIGHT_THEME_OVERRIDES } from './light'
import { MINT_THEME_OVERRIDES } from './mint'
import { SAKURA_THEME_OVERRIDES } from './sakura'

/**
 * Akari-base theme experiment, currently inactive.
 *
 * The live app intentionally uses the classic Naive UI overrides in `../naive-ui.ts`.
 * Keep this directory as a resume point for the Akari-base pass: it splits the large
 * Naive UI override table by theme and rewrites the default light/dark primary colors
 * around the Akari palette while preserving neutral backgrounds.
 *
 * To resume:
 * 1. Import these exports from `../naive-ui.ts` and route `getNaiveUiThemeOverrides`
 *    through `AKARI_BASE_THEME_OVERRIDES`.
 * 2. Reintroduce the app accent CSS variables in `theme-system.css` only if the
 *    scattered component color pass is also restored.
 * 3. Component color pass targets from the experiment were: sidebar active rail,
 *    player-tab spectator pulse/badge, search progress bar, ChampionIcon fallback
 *    ring, auto-select configured marks, filter builder AND/example accents,
 *    in-game-send enabled marks, OP.GG counter switch, and several validation
 *    controls that had used Naive UI `success` state only for a green border.
 */
export { THEME_OVERRIDES_SMALL_SIZED } from './compact'

export const AKARI_BASE_THEME_OVERRIDES: Record<AppThemeId, GlobalThemeOverrides> = {
  light: LIGHT_THEME_OVERRIDES,
  dark: DARK_THEME_OVERRIDES,
  graphite: GRAPHITE_THEME_OVERRIDES,
  cyber: CYBER_THEME_OVERRIDES,
  sakura: SAKURA_THEME_OVERRIDES,
  mint: MINT_THEME_OVERRIDES,
  aurora: AURORA_THEME_OVERRIDES,
  butter: BUTTER_THEME_OVERRIDES
}
