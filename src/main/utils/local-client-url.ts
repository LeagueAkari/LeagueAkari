const URL_SCHEME_PATTERN = /^[A-Za-z][A-Za-z\d+.-]*:/

/**
 * Local Riot/LCU clients may only receive relative endpoint paths.
 *
 * Axios normally lets an absolute request URL override `baseURL`. Rejecting schemes and
 * protocol-relative paths keeps the clients' self-signed-certificate exception scoped to their
 * loopback origins, including for renderer-proxied requests.
 */
export function assertLocalClientRequestUrl(url: string | undefined) {
  if (!url) {
    return
  }

  const normalized = url.trim()
  if (
    URL_SCHEME_PATTERN.test(normalized) ||
    normalized.startsWith('//') ||
    normalized.startsWith('\\\\')
  ) {
    throw new TypeError('Local client requests require a relative URL')
  }
}
