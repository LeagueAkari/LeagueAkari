function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function restorePlayerCardTagsSetting<T extends object>(value: unknown, defaultValue: T): T {
  const restored: Record<string, boolean> = { ...(defaultValue as Record<string, boolean>) }

  if (!isRecord(value)) {
    return restored as T
  }

  for (const [key, enabled] of Object.entries(value)) {
    if (typeof enabled === 'boolean') {
      restored[key] = enabled
    }
  }

  return restored as T
}
