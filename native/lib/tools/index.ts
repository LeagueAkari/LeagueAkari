import _addon from '../../addons/akari-tools-win64.node'
import type {
  AkariToolsBinding,
  FixLeagueClientWindowConfig,
  LeagueClientWindowPlacementInfo
} from '../bindings'

export type { FixLeagueClientWindowConfig, LeagueClientWindowPlacementInfo }

const addon = _addon as AkariToolsBinding
export default addon
