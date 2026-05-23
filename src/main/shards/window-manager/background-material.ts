export function settingToNativeBackgroundMaterial(material: string, supportsMica: boolean) {
  if (!supportsMica) {
    return 'none'
  }

  if (material === 'mica') {
    return 'mica'
  }

  return 'none'
}
