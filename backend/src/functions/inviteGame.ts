import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
interface DungeonInviteBody {
  toUserId: string;
  fromUserId: string;
  fromUsername: string;
  dungeonCode: string;
  dungeonName: string;
  lobbyId?: string;
}

app.http("invite_game", {
  methods: ["POST"],
  authLevel: "anonymous",
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "notifications"
    }
  ],
  handler: async (req, context) => {
    const { toUserId, fromUserId, fromUsername, dungeonCode, dungeonName, lobbyId } = await req.json() as DungeonInviteBody;
    
    context.extraOutputs.set("signalRMessages", [{
      userId: toUserId,
      target: "GameInviteReceived",
      arguments: [{ 
        ownerUid: fromUserId, 
        ownerUsername: fromUsername, 
        dungeonCode: dungeonCode, 
        dungeonName: dungeonName,
        lobbyId: lobbyId
       }]
    }]);

    return { jsonBody: { success: true } };
  }
});