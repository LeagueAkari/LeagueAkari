export function isDeepLinkUrl(value: unknown, protocol: string) {
  if (typeof value !== 'string') {
    return false
  }

  try {
    return new URL(value).protocol === `${protocol}:`
  } catch {
    return false
  }
}

export function getDeepLinkArgument(argv: string[], protocol: string) {
  return argv.find((argument) => isDeepLinkUrl(argument, protocol)) ?? null
}

export function shouldQuitWhenAllWindowsClosed(platform: NodeJS.Platform = process.platform) {
  return platform !== 'darwin'
}
