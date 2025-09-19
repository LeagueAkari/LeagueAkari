import {
  ChampSelectSession,
  ChampSelectSummoner,
  GridChamp,
  OngoingChampionSwap
} from '@shared/types/league-client/champ-select'
import { makeAutoObservable, observable } from 'mobx'

export class ChampSelectState {
  session: ChampSelectSession | null = null

  currentChampion: number | null = 0

  currentPickableChampionIdArray: number[] = []

  currentBannableChampionIdArray: number[] = []

  disabledChampionIdArray: number[] = []

  selfSummoner: ChampSelectSummoner | null = null

  ongoingChampionSwap: OngoingChampionSwap | null = null

  /**
   * 客户端会先推送所有 /grid-champions/* 事件 (Create), 之后才会推送 /all-grid-champions 事件
   * 因此, gridChampions 已经可以充分表达信息, 就不在这里再维护一个无关状态了
   *
   * P.S. 一旦在非英雄选择阶段的 grid-champions 存在更新, 那么也会推送 /grid-champions/* (Update), 之后是 /all-grid-champions (Create)
   */
  // allGridChampionArray: GridChamp[] = []

  gridChampions: Record<number, GridChamp> = {}

  constructor() {
    makeAutoObservable(this, {
      session: observable.struct,
      currentPickableChampionIdArray: observable.struct,
      currentBannableChampionIdArray: observable.struct,
      disabledChampionIdArray: observable.struct,
      selfSummoner: observable.struct,
      ongoingChampionSwap: observable.struct,
      gridChampions: observable.shallow
    })
  }

  get currentPickableChampionIds() {
    return new Set<number>(this.currentPickableChampionIdArray)
  }

  get currentBannableChampionIds() {
    return new Set<number>(this.currentBannableChampionIdArray)
  }

  get disabledChampionIds() {
    return new Set<number>(this.disabledChampionIdArray)
  }

  setSession(s: ChampSelectSession | null) {
    this.session = s
  }

  setCurrentPickableChampionArray(array: number[]) {
    this.currentPickableChampionIdArray = array
  }

  setCurrentBannableChampionArray(array: number[]) {
    this.currentBannableChampionIdArray = array
  }

  setSelfSummoner(s: ChampSelectSummoner | null) {
    this.selfSummoner = s
  }

  setCurrentChampion(c: number | null) {
    this.currentChampion = c
  }

  setDisabledChampionIds(ids: number[]) {
    this.disabledChampionIdArray = ids
  }

  setOngoingChampionSwap(trade: OngoingChampionSwap | null) {
    this.ongoingChampionSwap = trade
  }

  setGridChampion(champ: GridChamp) {
    this.gridChampions[champ.id] = champ
  }

  resetGridChampions() {
    this.gridChampions = {}
  }
}
