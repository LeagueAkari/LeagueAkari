import {
  EarthOutline as AllIcon,
  ShieldHalf as EnemyIcon,
  People as FriendlyIcon
} from '@vicons/ionicons5'

import type { Preset, PresetTarget } from './types'

export const targets: PresetTarget[] = [
  {
    id: 'friendly',
    label: '发送我方',
    description: '发送的对象是我方已选成员',
    buttonType: 'default',
    icon: FriendlyIcon
  },
  {
    id: 'enemy',
    label: '发送敌方',
    description: '发送的对象是敌方已选成员',
    buttonType: 'default',
    icon: EnemyIcon
  },
  {
    id: 'all',
    label: '发送全体',
    description: '发送的对象是双方已选成员',
    buttonType: 'default',
    icon: AllIcon
  }
]

export const presets: Preset[] = [
  {
    id: 'rating',
    label: '表现评分',
    description: '统计每位玩家近期表现，输出 KDA/胜率/评分综合数据。',
    hasTeamSelection: true
  },
  {
    id: 'jungle',
    label: '打野偏好',
    description: '展示打野选手的偏好路径、入侵倾向与开野侧。',
    hasTeamSelection: true
  },
  {
    id: 'premade',
    label: '组队状况',
    description: '识别队伍内开黑组合，按组别展示成员。'
  }
]
