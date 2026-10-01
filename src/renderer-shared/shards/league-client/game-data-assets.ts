export function profileIconUri(iconId: number) {
  return `/lol-game-data/assets/v1/profile-icons/${iconId}.jpg`
}

export function championIconUri(champId: number) {
  return `/lol-game-data/assets/v1/champion-icons/${champId}.png`
}

export function championBaseSplashUri(championAlias: string) {
  return `/lol-game-data/assets/ASSETS/Characters/${championAlias}/Skins/Base/Images/${championAlias.toLowerCase()}_splash_centered_0.jpg`
}
