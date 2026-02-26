import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface SendFriendRequestBody {
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
}
app.http("send_request", {
  methods: ["POST"],
  authLevel: "anonymous",
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "notifications"
    }
  ],
  handler: async(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {

    const body = await req.json() as SendFriendRequestBody;

    const { toUserId, fromUserId, fromUserName } = body;

    context.extraOutputs.set("signalRMessages", [{
      userId: toUserId,
      target: "FriendRequestReceived",
      arguments: [{
        fromUserId,
        fromUserName,
        timestamp: new Date()
      }]
    }]);

    return {
      jsonBody: { success: true }
    };
  }
});