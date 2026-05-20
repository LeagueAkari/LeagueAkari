import { isAxiosError } from 'axios'

import type { AkariLogger } from '../logger-factory'

export function hasReachedRemoteRateLimit(error: unknown, logger: AkariLogger) {
  if (
    isAxiosError(error) &&
    error.status === 403 &&
    typeof error.response?.data === 'string' &&
    error.response.data.match(/rate[-_\s]?limit/i)
  ) {
    logger.warn('Rate limit exceeded', error.config?.url, error.config?.method)
    return true
  }

  return false
}
