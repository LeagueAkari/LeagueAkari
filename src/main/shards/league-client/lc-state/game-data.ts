import {
  Augment,
  ChallengesJson,
  ChampionSimple,
  GameMap,
  GameModeMutator,
  Item,
  Perk,
  Perkstyles,
  Queue,
  SummonerSpell
} from '@shared/types/league-client/game-data'
import { makeAutoObservable, observableRef } from 'mobx'

export class GameDataState {
  summonerSpells: Record<number, SummonerSpell> = {}
  items: Record<number, Item> = {}
  queues: Record<number, Queue> = {}
  perks: Record<number, Perk> = {}
  perkstyles: {
    schemaVersion: number
    styles: Record<number, Perkstyles['styles'][number]>
  } = {
    schemaVersion: 0,
    styles: {}
  }
  augments: Record<number, Augment> = {}
  champions: Record<number, ChampionSimple> = {}
  gameModeMutators: Record<number, GameModeMutator> = {}
  maps: Record<number, GameMap> = {}
  challenges: ChallengesJson | null = null

  championName(id: number) {
    return this.champions[id]?.name || id.toString()
  }

  constructor() {
    makeAutoObservable(this, {
      summonerSpells: observableRef,
      augments: observableRef,
      champions: observableRef,
      items: observableRef,
      perks: observableRef,
      perkstyles: observableRef,
      queues: observableRef,
      gameModeMutators: observableRef,
      maps: observableRef,
      challenges: observableRef
    })
  }

  setSummonerSpells(value: Record<number, SummonerSpell>) {
    this.summonerSpells = value
  }

  setItems(value: Record<number, Item>) {
    this.items = value
  }

  setQueues(value: Record<number, Queue>) {
    this.queues = value
  }

  setPerks(value: Record<number, Perk>) {
    this.perks = value
  }

  setPerkStyles(value: {
    schemaVersion: number
    styles: Record<number, Perkstyles['styles'][number]>
  }) {
    this.perkstyles = value
  }

  setAugments(value: Record<number, Augment>) {
    this.augments = value
  }

  setChampions(value: Record<number, ChampionSimple>) {
    this.champions = value
  }

  setGameModeMutators(value: Record<number, GameModeMutator>) {
    this.gameModeMutators = value
  }

  setMaps(value: Record<number, GameMap>) {
    this.maps = value
  }

  setChallenges(value: ChallengesJson | null) {
    this.challenges = value
  }
}
