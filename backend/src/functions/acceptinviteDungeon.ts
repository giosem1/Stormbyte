import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { addUserToLobby, getLobby } from "../shared/lobbyStore";

interface AcceptLobby {
  dungeonCode: string;
  userId: string;
}

app.http("join_lobby", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "join_lobby",
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRGroupActions",
      hubName: "notifications"
    },
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "notifications"
    }
  ],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body = await request.json() as AcceptLobby;
      const { dungeonCode, userId } = body;

      if (!dungeonCode || !userId) {
        return {
          status: 400,
          jsonBody: { error: "Parametri mancanti" }
        };
      }

      const lobby = getLobby(dungeonCode);
      if (!lobby) {
        return {
          status: 404,
          jsonBody: { error: "Lobby non trovata" }
        };
      }

      context.extraOutputs.set("signalRGroupActions", [
        {
          action: "add",
          userId: userId,
          groupName: dungeonCode
        }
      ]);

      const updatedLobby = addUserToLobby(dungeonCode, userId);

      context.extraOutputs.set("signalRMessages", [
        {
          target: "UserJoinedLobby",
          groupName: dungeonCode,
          arguments: [{ userId }]
        }
      ]);

      context.extraOutputs.set("signalRGrouActions", [
        {
          userId: userId,
          groupName: dungeonCode,
          action: "add" 
        }
      ]);

      return {
        status: 200,
        jsonBody:{
          success: true,
          ownerId: lobby.ownerId,
          state: lobby.state 
        }
      };

    } catch (err: any) {
      console.error("JOIN LOBBY ERROR:", err);

      return {
        status: 500,
        jsonBody: { error: "Errore interno server" }
      };
    }
  }
});