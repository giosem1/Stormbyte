import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalROutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "notifications"
});

interface SendFriendRequestBody {
    toUserId: string;
    fromUserId: string;
    fromUserName: string;
}

export async function sendRequestHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as SendFriendRequestBody;
        const { toUserId, fromUserId, fromUserName } = body;

        if (!toUserId || !fromUserId || !fromUserName) {
            return { status: 400, jsonBody: { error: "Missing parameters" } };
        }

        const signalRMessage = {
            userId: toUserId,
            target: "FriendRequestReceived",
            arguments: [{
                fromUserId,
                fromUserName,
                timestamp: new Date()
            }]
        };

        context.extraOutputs.set(signalROutput, [signalRMessage]);

        return {
            status: 200,
            jsonBody: { success: true }
        };

    } catch (err) {
        context.error("Error sending friend request: ", err);
        return { status: 500, jsonBody: { error: "Internal server error" } };
    }
}

app.http("sentFriendReq", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "send_request",
    extraOutputs: [signalROutput],
    handler: sendRequestHandler
});
