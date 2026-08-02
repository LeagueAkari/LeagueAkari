import { Lobby as LobbyType, ReceivedInvitation } from '@shared/types/league-client/lobby'
import { makeAutoObservable, observableStruct } from 'mobx'

export class LobbyState {
  lobby: LobbyType | null = null
  receivedInvitations: ReceivedInvitation[] = []

  constructor() {
    makeAutoObservable(this, { lobby: observableStruct, receivedInvitations: observableStruct })
  }

  setLobby(lobby: LobbyType | null) {
    this.lobby = lobby
  }

  setReceivedInvitations(receivedInvitations: ReceivedInvitation[]) {
    this.receivedInvitations = receivedInvitations
  }
}
