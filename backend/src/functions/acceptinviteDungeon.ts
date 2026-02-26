import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { addUserToLobby, getLobby } from "../shared/lobbyStore";
interface AcceptLobby{
  dungeonCode: string,
  userId: string
}

app.http("join_lobby", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "join_lobby",
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "dungeonHub"
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

      const updatedLobby = addUserToLobby(dungeonCode, userId);
      
      context.extraOutputs.set("signalRMessages", [
          {
            type: "addToGroup",
            groupName: dungeonCode,
            userId: userId
          }
      ]);
      return {
        status: 200,
        jsonBody: updatedLobby
      };

    } catch (err: any) {
      return {
        status: 400,
        jsonBody: { error: err.message }
      };
    }
  }
});