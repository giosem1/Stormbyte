import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalROutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "notifications"
});

interface GameLobbyEvent {
    dungeonCode: string;
    lobbyId: string;
    userId: string;
    actionType: string;
    targetId?: string;
    username?: string;
    text?: string;
}

export async function updateGameLobbyHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as GameLobbyEvent;
        const { dungeonCode, lobbyId, userId, actionType, targetId, username, text } = body;

        if (!dungeonCode || !lobbyId || !userId || !actionType) {
            return {
                status: 400,
                jsonBody: { error: "Missing required parameters" }
            };
        }

        let signalRMessages = [];

        if (actionType === "ITEM_COLLECTED") {
            signalRMessages.push({
                target: "ItemCollected",
                groupName: lobbyId,
                arguments: [targetId, userId]
            });
        } else if (actionType === "ENEMY_STATE_CHANGED") {
            signalRMessages.push({
                target: "EnemyStateChanged",
                groupName: lobbyId,
                arguments: [targetId, userId]
            });
        } else if (actionType === "CHAT_MESSAGE") {
            signalRMessages.push({
                target: "ChatMessage",
                groupName: lobbyId,
                arguments: [{
                    userId: userId,
                    username: username,
                    text: text
                }]
            });
        } else if (actionType === "STORY_GENERATED") {
            signalRMessages.push({
                target: "StoryGenerated",
                groupName: lobbyId,
                arguments: [userId, text]
            });
        }

        context.extraOutputs.set(signalROutput, signalRMessages);

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

app.http("updateGameLobby", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "update_game_lobby",
    extraOutputs: [signalROutput],
    handler: updateGameLobbyHandler
});