import { is } from '@electron-toolkit/utils'

export const DEEP_LINK_PROTOCOL = is.dev ? 'league-akari-dev' : 'league-akari'

export const DEEP_LINK_PROTOCOL_PROD = 'league-akari'

export const DEEP_LINK_PROTOCOL_DEV = 'league-akari-dev'
