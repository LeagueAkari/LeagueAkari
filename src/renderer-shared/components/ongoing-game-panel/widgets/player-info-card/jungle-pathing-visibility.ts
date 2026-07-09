interface JunglePathingAnalysisLike {
  jungle?: unknown | null
}

export function resolveJunglePathingAnalysis<T extends JunglePathingAnalysisLike>(options: {
  analysis: T | null | undefined
  isCurrentJungler: boolean
  showJunglePathing: boolean
  showJunglePathingForAllPlayers: boolean
}) {
  const { analysis, isCurrentJungler, showJunglePathing, showJunglePathingForAllPlayers } = options

  if (!showJunglePathing || !analysis?.jungle) {
    return null
  }

  if (!isCurrentJungler && !showJunglePathingForAllPlayers) {
    return null
  }

  return analysis
}
