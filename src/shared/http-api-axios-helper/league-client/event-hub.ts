import {
  EventChapters,
  EventDetailsData,
  EventHubEvents,
  EventInfo,
  EventNarrativeButtonData,
  EventObjectivesBanner,
  EventPassBundle2,
  EventProgressInfoData,
  EventProgressionPurchaseData,
  EventRewardTrackBonusItem,
  EventRewardTrackBonusProgress,
  EventRewardTrackItem,
  EventRewardTrackUnclaimedRewards,
  EventRewardTrackXP
} from '@shared/types/league-client/event-hub'
import { AxiosInstance } from 'axios'

import type { HttpApiRequestOptions } from '../request-options'

export class EventHubHttpApi {
  constructor(private _http: AxiosInstance) {}

  getEvents(options: HttpApiRequestOptions = {}) {
    return this._http.get<EventHubEvents[]>('/lol-event-hub/v1/events', { signal: options.signal })
  }

  getChapters(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventChapters>(`/lol-event-hub/v1/events/${eventId}/chapters`, {
      signal: options.signal
    })
  }

  getEventDetailsData(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventDetailsData>(
      `/lol-event-hub/v1/events/${eventId}/event-details-data`,
      { signal: options.signal }
    )
  }

  getInfo(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventInfo>(`/lol-event-hub/v1/events/${eventId}/info`, {
      signal: options.signal
    })
  }

  getIsGracePeriod(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<boolean>(`/lol-event-hub/v1/events/${eventId}/is-grace-period`, {
      signal: options.signal
    })
  }

  // TODO: Add type
  getNarrative(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/narrative`, {
      signal: options.signal
    })
  }

  getObjectivesBanner(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventObjectivesBanner>(
      `/lol-event-hub/v1/events/${eventId}/objectives-banner`,
      { signal: options.signal }
    )
  }

  // TODO: Add type
  getPassBackgroundData(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/pass-background-data`, {
      signal: options.signal
    })
  }

  getPassBundles(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventPassBundle2>(`/lol-event-hub/v1/events/${eventId}/pass-bundles`, {
      signal: options.signal
    })
  }

  getProgressInfoData(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventProgressInfoData>(
      `/lol-event-hub/v1/events/${eventId}/progress-info-data`,
      { signal: options.signal }
    )
  }

  getProgressionPurchaseData(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventProgressionPurchaseData>(
      `/lol-event-hub/v1/events/${eventId}/progression-purchase-data`,
      { signal: options.signal }
    )
  }

  postPurchaseOffer(eventId: string, data: any, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-event-hub/v1/events/${eventId}/purchase-offer`, data, {
      signal: options.signal
    })
  }

  getRewardTrackBonusItems(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventRewardTrackBonusItem[]>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/bonus-items`,
      { signal: options.signal }
    )
  }

  getRewardTrackBonusProgress(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventRewardTrackBonusProgress>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/bonus-progress`,
      { signal: options.signal }
    )
  }

  postRewardTrackClaimAll(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.post<void>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/claim-all`,
      undefined,
      { signal: options.signal }
    )
  }

  getRewardTrackCounter(eventId: string, beforeEpoch: number, options: HttpApiRequestOptions = {}) {
    return this._http.get<number>(`/lol-event-hub/v1/events/${eventId}/reward-track/counter`, {
      signal: options.signal,
      params: { beforeEpoch }
    })
  }

  getRewardTrackFailure(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/reward-track/failure`, {
      signal: options.signal
    })
  }

  getRewardTrackItems(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventRewardTrackItem[]>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/items`,
      { signal: options.signal }
    )
  }

  getRewardTrackProgress(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/reward-track/progress`, {
      signal: options.signal
    })
  }

  getRewardTrackUnclaimedRewards(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventRewardTrackUnclaimedRewards>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/unclaimed-rewards`,
      { signal: options.signal }
    )
  }

  getRewardTrackXP(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get<EventRewardTrackXP>(
      `/lol-event-hub/v1/events/${eventId}/reward-track/xp`,
      { signal: options.signal }
    )
  }

  // TODO: Add type
  getTokenShop(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/token-shop`, {
      signal: options.signal
    })
  }

  // TODO: Add type
  getTokenShopCategoriesOffers(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/token-shop/categories-offers`, {
      signal: options.signal
    })
  }

  // TODO: Add type
  getTokenShopTokenBalance(eventId: string, options: HttpApiRequestOptions = {}) {
    return this._http.get(`/lol-event-hub/v1/events/${eventId}/token-shop/token-balance`, {
      signal: options.signal
    })
  }

  getNavigationButtonData(options: HttpApiRequestOptions = {}) {
    return this._http.get<EventNarrativeButtonData>(`/lol-event-hub/v1/navigation-button-data`, {
      signal: options.signal
    })
  }

  postPurchaseItem(data: any, options: HttpApiRequestOptions = {}) {
    return this._http.post(`/lol-event-hub/v1/purchase-item`, data, { signal: options.signal })
  }

  // TODO: Add type
  getSkins(options: HttpApiRequestOptions = {}) {
    return this._http.get<{}>(`/lol-event-hub/v1/skins`, { signal: options.signal })
  }

  // TODO: Add type
  getTokenUpsell(options: HttpApiRequestOptions = {}) {
    return this._http.get<any[]>(`/lol-event-hub/v1/token-upsell`, { signal: options.signal })
  }
}
