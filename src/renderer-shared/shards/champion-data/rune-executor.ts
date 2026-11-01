import type { ChampionRunesConfig } from '@shared/shards/auto-champ-config'
import { z } from 'zod'

import type { LeagueClientRenderer } from '../league-client'

const id = z.number().int().positive()
const runeSchema = z.object({
  primaryStyleId: id,
  subStyleId: id,
  selectedPerkIds: z.array(id).length(9)
})

export function isValidRunePage(value: ChampionRunesConfig): boolean {
  return runeSchema.safeParse(value).success
}

export class RuneApplicationCancelled extends Error {
  constructor() {
    super('Rune application is no longer current')
  }
}

/** One instance per Champion Data renderer, shared by both sources and manual/automatic writes. */
export class RuneExecutor {
  private _tail: Promise<unknown> = Promise.resolve()
  private _disposed = false
  onManualApplication: (() => void) | null = null

  constructor(private readonly _client: Pick<LeagueClientRenderer, 'api'>) {}

  dispose() {
    this._disposed = true
    this.onManualApplication = null
  }

  apply(
    config: ChampionRunesConfig,
    name: string,
    options: { automatic?: boolean; isCurrent?: () => boolean } = {}
  ): Promise<boolean> {
    const runes = runeSchema.parse(config)
    if (!options.automatic) this.onManualApplication?.()

    const check = () => {
      if (this._disposed || (options.isCurrent && !options.isCurrent())) {
        throw new RuneApplicationCancelled()
      }
    }
    const result = this._tail.then(async () => {
      check()
      const { perks } = this._client.api
      const inventory = (await perks.getPerkInventory()).data
      check()
      let pageId: number

      if (inventory.canAddCustomPage) {
        pageId = (
          await perks.postPerkPage({
            name,
            isEditable: true,
            primaryStyleId: runes.primaryStyleId.toString()
          })
        ).data.id
      } else {
        const pages = (await perks.getPerkPages()).data
        check()
        if (!pages.length) throw new Error('No rune page is available')
        pageId = pages[0].id
      }

      check()
      await perks.putPage({
        id: pageId,
        name,
        isRecommendationOverride: false,
        isTemporary: false,
        ...runes
      })
      check()
      await perks.putCurrentPage(pageId)
      return inventory.canAddCustomPage
    })
    this._tail = result.catch(() => {})
    return result
  }
}
