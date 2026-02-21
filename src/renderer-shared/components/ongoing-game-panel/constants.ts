import BronzeMedal from '@renderer-shared/assets/ranked-icons/bronze.png'
import ChallengerMedal from '@renderer-shared/assets/ranked-icons/challenger.png'
import DiamondMedal from '@renderer-shared/assets/ranked-icons/diamond.png'
import EmeraldMedal from '@renderer-shared/assets/ranked-icons/emerald.png'
import GoldMedal from '@renderer-shared/assets/ranked-icons/gold.png'
import GrandmasterMedal from '@renderer-shared/assets/ranked-icons/grandmaster.png'
import IronMedal from '@renderer-shared/assets/ranked-icons/iron.png'
import MasterMedal from '@renderer-shared/assets/ranked-icons/master.png'
import PlatinumMedal from '@renderer-shared/assets/ranked-icons/platinum.png'
import SilverMedal from '@renderer-shared/assets/ranked-icons/silver.png'

export const IQR_THRESHOLD = 0.65

export const RANKED_MEDAL_MAP: Record<string, string> = {
  IRON: IronMedal,
  BRONZE: BronzeMedal,
  SILVER: SilverMedal,
  GOLD: GoldMedal,
  PLATINUM: PlatinumMedal,
  EMERALD: EmeraldMedal,
  DIAMOND: DiamondMedal,
  MASTER: MasterMedal,
  GRANDMASTER: GrandmasterMedal,
  CHALLENGER: ChallengerMedal
}

export const CHINESE_NUMBERS = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

export const PREMADE_TEAMS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z'
]

export const PREMADE_TEAM_COLORS = {
  A: { foregroundColor: '#48e5db', color: '#000', borderColor: '#48e5dbd0' },
  B: { foregroundColor: '#628aff', color: '#000', borderColor: '#628affd0' },
  C: { foregroundColor: '#d4de17', color: '#000', borderColor: '#d4de17d0' },
  D: { foregroundColor: '#2eda3e', color: '#000', borderColor: '#2eda3ed0' },
  E: { foregroundColor: '#ff9f1c', color: '#000', borderColor: '#ff9f1cd0' },
  F: { foregroundColor: '#da4e2e', color: '#fff', borderColor: '#da4e2ed0' },
  G: { foregroundColor: '#bc2ebc', color: '#fff', borderColor: '#bc2ebcd0' },
  H: { foregroundColor: '#fa4e80', color: '#000', borderColor: '#fa4e80d0' },
  I: { foregroundColor: '#0b3d91', color: '#fff', borderColor: '#0b3d91d0' },
  J: { foregroundColor: '#7f0000', color: '#fff', borderColor: '#7f0000d0' },
  K: { foregroundColor: '#8b4513', color: '#fff', borderColor: '#8b4513d0' },
  L: { foregroundColor: '#555555', color: '#fff', borderColor: '#555555d0' }
}

export const PREMADE_TEAM_COLORS_LIGHT = {
  A: { foregroundColor: '#0f6f68', color: '#fff', borderColor: '#0f6f68d0' },
  B: { foregroundColor: '#1f3fa6', color: '#fff', borderColor: '#1f3fa6d0' },
  C: { foregroundColor: '#5c6000', color: '#fff', borderColor: '#5c6000d0' },
  D: { foregroundColor: '#1a7a2a', color: '#fff', borderColor: '#1a7a2ad0' },
  E: { foregroundColor: '#8a4400', color: '#fff', borderColor: '#8a4400d0' },
  F: { foregroundColor: '#8a2a00', color: '#fff', borderColor: '#8a2a00d0' },
  G: { foregroundColor: '#6a0d6a', color: '#fff', borderColor: '#6a0d6ad0' },
  H: { foregroundColor: '#a2133f', color: '#fff', borderColor: '#a2133fd0' },
  I: { foregroundColor: '#0b3d91', color: '#fff', borderColor: '#0b3d91d0' },
  J: { foregroundColor: '#7f0000', color: '#fff', borderColor: '#7f0000d0' },
  K: { foregroundColor: '#5a2a0b', color: '#fff', borderColor: '#5a2a0bd0' },
  L: { foregroundColor: '#333333', color: '#fff', borderColor: '#333333d0' }
}

export const FIXED_CARD_WIDTH_PX_LITERAL = '240px'
export const FIXED_CARD_WIDTH_PX_NUMBER = 240

export const POSITION_ORDER = {
  NONE: 0,
  TOP: 1,
  MIDDLE: 3,
  JUNGLE: 2,
  BOTTOM: 4,
  UTILITY: 5
}

export const WIN_RATE_TEAM_MIN_MATCHES = 13
export const WIN_RATE_TEAM_OTHER_MEMBER_WIN_STREAK = 4
export const WIN_RATE_TEAM_MIN_SIZE = 3
export const LOSS_RATE_TEAM_MIN_SIZE = 2
export const WIN_RATE_TEAM_MIN_WIN_RATE = 0.9
export const LOSS_RATE_TEAM_MAX_WIN_RATE = 0.25

export const STARRED_CHAMPION_LEVEL = 60
