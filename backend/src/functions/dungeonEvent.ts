import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getLobby, applyActionToState } from "../shared/lobbyStore";

interface DungeonEvent {
  dungeonCode: string;
  userId: string;
  type: string;
  payload: any;
}

app.http("dungeon_event", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "dungeon_event",
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "notifications"
    }
  ],
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const { dungeonCode, userId, type, payload } = await req.json() as DungeonEvent;

      if (!dungeonCode || !userId || !type) {
        return { status: 400, jsonBody: { error: "Parametri mancanti" } };
      }

      const lobby = getLobby(dungeonCode);
      if (!lobby) return { status: 404, jsonBody: { error: "Lobby non trovata" } };

      applyActionToState(lobby.state, { type, payload });

      const movedItem = lobby.state.items.find(i => i.id === payload.roomId);

      context.extraOutputs.set("signalRMessages", [
        {
          target: "RoomMoved",
          arguments: [{
            roomId: payload.roomId,
            x: payload.x,
            y: payload.y,
            movedBy: userId,
            src: payload.src,
            type: payload.type,
            fullItem: movedItem 
          }]
        }
      ]);

      return { status: 200, jsonBody: { success: true } };

    } catch (err: any) {
      console.error("Errore dungeon_event:", err);
      return { status: 500, jsonBody: { error: "Errore interno server" } };
    }
  }
});