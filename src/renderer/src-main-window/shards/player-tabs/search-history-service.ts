import type { SettingUtilsRenderer } from '@renderer-shared/shards/setting-utils'

import {
  PLAYER_TABS_RENDERER_NAMESPACE,
  SEARCH_HISTORY_KEY,
  SEARCH_HISTORY_MAX_LENGTH,
  type SearchHistoryItem
} from './context'

export class PlayerTabsSearchHistoryService {
  constructor(private readonly settingUtils: SettingUtilsRenderer) {}

  /**
   * 获取搜索历史, 有数量限制
   */
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    return this.settingUtils.get(PLAYER_TABS_RENDERER_NAMESPACE, SEARCH_HISTORY_KEY, [])
  }

  /**
   * 使用全量替换的方式更新搜索历史。
   * 置顶区的条目始终不会变动相对位置，同时保证在非置顶项目的前面。
   * 非置顶项目在保存时会移动到非置顶区的最前面。
   * 超过上限时会删除最后一个非置顶项目，若无非置顶项目无法添加。
   * @param item
   */
  async saveSearchHistory(item: SearchHistoryItem) {
    const list = await this.getSearchHistory()
    const max = SEARCH_HISTORY_MAX_LENGTH

    const oldIdx = list.findIndex((i) => i.puuid === item.puuid)
    const existed = oldIdx !== -1
    const wasPinned = existed ? list[oldIdx].isPinned : false

    const finalPinned = item.isPinned !== undefined ? item.isPinned : existed ? wasPinned : false

    const base = existed ? list[oldIdx] : ({} as Partial<SearchHistoryItem>)
    const newItem: SearchHistoryItem = {
      ...base,
      ...item,
      isPinned: finalPinned
    } as SearchHistoryItem

    if (existed && wasPinned && finalPinned) {
      list[oldIdx] = newItem
      return this._save(list)
    }

    if (existed) list.splice(oldIdx, 1)

    const firstUnpinned = list.findIndex((i) => !i.isPinned)
    const pos = firstUnpinned === -1 ? list.length : firstUnpinned
    list.splice(pos, 0, newItem)

    if (list.length > max) {
      const lastUnpinnedIdx = [...list].reverse().findIndex((i) => !i.isPinned)

      if (lastUnpinnedIdx !== -1) {
        list.splice(list.length - 1 - lastUnpinnedIdx, 1)
      } else if (!existed) {
        list.pop()
      }
    }

    return this._save(list)
  }

  async deleteSearchHistory(puuid: string) {
    const items = await this.getSearchHistory()
    const index = items.findIndex((i) => i.puuid === puuid)

    if (index !== -1) {
      items.splice(index, 1)
    }

    return this._save(items)
  }

  async pinSearchHistory(puuid: string) {
    const items = await this.getSearchHistory()
    const index = items.findIndex((i) => i.puuid === puuid)

    if (index !== -1) {
      items[index].isPinned = !items[index].isPinned
    }

    items.sort((a, b) => {
      if (a.isPinned && !b.isPinned) {
        return -1
      }
      if (!a.isPinned && b.isPinned) {
        return 1
      }
      return 0
    })

    return this._save(items)
  }

  private _save(items: SearchHistoryItem[]) {
    return this.settingUtils.set(PLAYER_TABS_RENDERER_NAMESPACE, SEARCH_HISTORY_KEY, items)
  }
}
