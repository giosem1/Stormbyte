import { Lobby } from "../types/types";

const lobbies: Record<string, Lobby> = {};

const MAX_USERS = 5;

export function createLobby(dungeonCode: string, ownerId: string): Lobby {
  if (lobbies[dungeonCode]) {
    throw new Error("Lobby già esistente");
  }

  const lobby: Lobby = {
    dungeonCode,
    ownerId,
    users: [ownerId],
    state: {
      items: []
    },
    createdAt: Date.now()
  };

  lobbies[dungeonCode] = lobby;

  return lobby;
}

export function getLobby(dungeonCode: string): Lobby | undefined {
  return lobbies[dungeonCode];
}

export function addUserToLobby(dungeonCode: string, userId: string): Lobby {
  const lobby = lobbies[dungeonCode];

  if (!lobby) {
    throw new Error("Lobby non trovata");
  }

  if (lobby.users.includes(userId)) {
    return lobby;
  }

  if (lobby.users.length >= MAX_USERS) {
    throw new Error("Lobby piena");
  }

  lobby.users.push(userId);

  return lobby;
}

export function removeUserFromLobby(dungeonCode: string, userId: string) {
  const lobby = lobbies[dungeonCode];
  if (!lobby) return;

  lobby.users = lobby.users.filter(u => u !== userId);

  if (lobby.users.length === 0) {
    delete lobbies[dungeonCode];
  }
}
export function applyActionToState(state: any, action: any) {

  switch (action.type) {

    case "ADD_ITEM":
      state.items.push(action.payload);
      break;

    case "MOVE_ITEM":
      const item = state.items.find(i => i.id === action.payload.id);
      if (item) {
        item.x = action.payload.x;
        item.y = action.payload.y;
      }
      break;

    case "REMOVE_ITEM":
      state.items = state.items.filter(i => i.id !== action.payload.id);
      break;
  }
}