import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
interface DungeonInviteBody {
  toUserId: string;
  fromUserId: string;
  fromUsername: string;
  dungeonCode: string;
}

app.http("invite_dungeon", {
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
    const { toUserId, fromUserId, fromUsername, dungeonCode } = await req.json() as DungeonInviteBody;

    
    context.extraOutputs.set("signalRMessages", [{
      userId: toUserId,
      target: "DungeonInviteReceived",
      arguments: [{ ownerUid: fromUserId, ownerUsername: fromUsername, dungeonCode }]
    }]);

    return { jsonBody: { success: true } };
  }
});