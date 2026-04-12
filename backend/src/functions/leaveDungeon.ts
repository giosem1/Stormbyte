import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalRGroupActionsOutput = output.generic({
    type: "signalR",
    name: "signalRGroupActions",
    hubName: "notifications"
});

const signalRMessagesOutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "notifications"
});

interface LeaveGameLobby {
    userId: string;
    lobbyId: string;
}

export async function leaveGameHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as LeaveGameLobby;
        const { userId, lobbyId } = body;

        if (!userId || !lobbyId) {
            return {
                status: 400,
                jsonBody: { error: "Missing required parameters" }
            };
        }

        context.extraOutputs.set(signalRGroupActionsOutput, [{
            userId: userId,
            groupName: lobbyId,
            action: "remove"
        }]);

        context.extraOutputs.set(signalRMessagesOutput, [{
            target: "PlayerLeftGame",
            groupName: lobbyId,
            arguments: [userId]
        }]);

        return {
            status: 200,
            jsonBody: { success: true }
        };

    } catch (error) {
        return {
            status: 500,
            jsonBody: { error: "Malformed request or internal server error" }
        };
    }
}

app.http("leaveDungeon", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "leave_game",
    extraOutputs: [signalRGroupActionsOutput, signalRMessagesOutput],
    handler: leaveGameHandler
});