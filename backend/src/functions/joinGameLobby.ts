import { createLobby, getLobby } from "../shared/lobbyStore";
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

interface JoinGameLobby {
    dungeonCode: string;
    userId: string;
    username: string;
    classe?: string;
    lobbyId?: string;
}

export async function joinGameHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as JoinGameLobby;
        const { dungeonCode, userId, username, classe, lobbyId } = body;

        if (!dungeonCode || !userId) {
            return {
                status: 400,
                jsonBody: { error: "Missing required parameters" }
            };
        }

        const activeRoomId = lobbyId || dungeonCode;

        let lobby = getLobby(activeRoomId);
        if (!lobby) {
            lobby = createLobby(activeRoomId, userId);
        }

        context.extraOutputs.set(signalRGroupActionsOutput, [{
            userId: userId,
            groupName: activeRoomId,
            action: "add"
        }]);

        context.extraOutputs.set(signalRMessagesOutput, [{
            target: "PlayerJoinedGame",
            groupName: activeRoomId,
            arguments: [{
                uid: userId,
                username: username,
                classe: classe
            }]
        }]);

        return {
            status: 200,
            jsonBody: lobby
        };

    } catch (error) {
        return {
            status: 500,
            jsonBody: { error: "Malformed request or internal server error" }
        };
    }
}

app.http("joinGameLobby", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "join_game",
    extraOutputs: [signalRGroupActionsOutput, signalRMessagesOutput],
    handler: joinGameHandler
});