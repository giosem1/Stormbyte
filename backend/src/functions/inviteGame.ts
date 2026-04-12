import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

interface DungeonInviteBody {
    toUserId: string;
    fromUserId: string;
    fromUsername: string;
    dungeonCode: string;
    dungeonName: string;
    lobbyId?: string;
}

const signalROutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "notifications"
});

export async function inviteGameHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as DungeonInviteBody;
        const { toUserId, fromUserId, fromUsername, dungeonCode, dungeonName, lobbyId } = body;

        if (!toUserId || !fromUserId || !dungeonCode) {
            return { status: 400, jsonBody: { error: "Missing required parameters" } };
        }

        context.extraOutputs.set(signalROutput, [{
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

        return { status: 200, jsonBody: { success: true } };

    } catch (error) {
        return { status: 500, jsonBody: { error: "Malformed request or internal server error" } };
    }
}

app.http("inviteGame", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "invite_game",
    extraOutputs: [signalROutput],
    handler: inviteGameHandler
});