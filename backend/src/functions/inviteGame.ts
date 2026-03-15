import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
interface DungeonInviteBody {
  toUserId: string;
  fromUserId: string;
  fromUsername: string;
  dungeonCode: string;
  dungeonName: string;
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
    const { toUserId, fromUserId, fromUsername, dungeonCode, dungeonName } = await req.json() as DungeonInviteBody;
    
    context.extraOutputs.set("signalRMessages", [{
      userId: toUserId,
      target: "GameInviteReceived",
      arguments: [{ ownerUid: fromUserId, ownerUsername: fromUsername, dungeonCode, dungeonName }]
    }]);

    return { jsonBody: { success: true } };
  }
});