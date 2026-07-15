import { type AkariApiBootstrapDocument, type AkariServiceBaseUrls } from './types'

export function normalizeAkariServiceBaseUrl(value: string) {
  return new URL(value).toString().replace(/\/$/, '')
}

export function normalizeAkariServiceBaseUrls(baseUrls: AkariServiceBaseUrls) {
  return {
    api: normalizeAkariServiceBaseUrl(baseUrls.api),
    static: normalizeAkariServiceBaseUrl(baseUrls.static)
  }
}

export function parseAkariApiBootstrapDocument(value: unknown): AkariApiBootstrapDocument {
  const bootstrap = value as AkariApiBootstrapDocument

  if (
    bootstrap?.schemaVersion !== 1 ||
    !Number.isSafeInteger(bootstrap.generation) ||
    typeof bootstrap.baseUrls?.api !== 'string' ||
    typeof bootstrap.baseUrls?.static !== 'string'
  ) {
    throw new TypeError('Invalid Akari API bootstrap')
  }

  return {
    ...bootstrap,
    baseUrls: normalizeAkariServiceBaseUrls(bootstrap.baseUrls)
  }
}

export function resolveAkariStaticUrl(baseUrl: string, path: string) {
  return new URL(path.replace(/^\/+/, ''), `${normalizeAkariServiceBaseUrl(baseUrl)}/`).toString()
}
