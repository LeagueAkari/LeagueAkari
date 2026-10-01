import type {
  OpggApplyRecommendation,
  OpggChampionDataQueryUpdate,
  OpggFlashPosition
} from '@shared/types/champion-data/opgg'

import { CHAMPION_DATA_MAIN_NAMESPACE, type ChampionDataRendererContext } from '../context'

/** Renderer-facing commands; the main process owns all OP.GG data and request state. */
export class OpggChampionDataController {
  constructor(private readonly _context: ChampionDataRendererContext) {}

  update(query: OpggChampionDataQueryUpdate): Promise<boolean> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'updateOpggQuery', query)
  }

  open(id: number): Promise<boolean> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'openOpggChampion', id)
  }

  activate(id: number | null): Promise<boolean> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'activateOpggPage', id)
  }

  close(id: number): Promise<void> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'closeOpggChampion', id)
  }

  reorder(ids: number[]): Promise<void> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'reorderOpggChampions', ids)
  }

  refresh(id?: number | null): Promise<boolean> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'refreshOpgg', id)
  }

  setFlashPosition(value: OpggFlashPosition): Promise<void> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'setOpggFlashPosition', value)
  }

  cancel(id: number | null) {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'cancelOpgg', id)
  }

  apply(request: OpggApplyRecommendation): Promise<void> {
    return this._context.ipc.call(CHAMPION_DATA_MAIN_NAMESPACE, 'applyOpggRecommendation', request)
  }
}
