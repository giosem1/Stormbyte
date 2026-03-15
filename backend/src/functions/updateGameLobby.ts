import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { error, group } from "console";

interface GameLobbyEvent {
    dungeonCode: string;
    userId: string;
    actionType: string;
    targetId: string;
}

app.http("update_game_lobby", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "update_game_lobby",
    extraOutputs: [
        {
            type: "signalR",
            name: "signalRMessages",
            hubName: "notifications"
        }
    ],
    handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            const { dungeonCode, userId, actionType, targetId } = await req.json() as GameLobbyEvent;

            if (!dungeonCode || !userId || !actionType || !targetId) {
                return {
                    status: 400,
                    jsonBody: {
                        error: "Missing parameter"
                    }
                };
            }
            let signalRMessages = [];

            if (actionType === "ITEM_COLLECTED") {
                signalRMessages.push({
                    target: "ItemCollected",
                    groupName: dungeonCode,
                    arguments: [targetId, userId]
                });
            } else if (actionType === "ENEMY_DAMAGED") {
                signalRMessages.push({
                    target: "EnemyDamaged",
                    groupName: dungeonCode,
                    arguments: [targetId, userId]
                });
            } else if (actionType === "PLAYER_DIED") {
                signalRMessages.push({
                    target: "PlayerDied",
                    groupName: dungeonCode,
                    arguments: [targetId, userId]
                })
            } else if (actionType === "TRAP_ACTIVATED") {
                signalRMessages.push({
                    target: "TrapActivated",
                    groupName: dungeonCode,
                    arguments: [targetId, userId]
                })
            } else if (actionType === "ENEMY_STATE_CHANGED") {
                signalRMessages.push({
                    target: "EnemyStateChanged",
                    groupName: dungeonCode,
                    arguments: [targetId, userId]
                })
            }

            context.extraOutputs.set("signalRMessages", signalRMessages);

            return {
                status: 200,
                jsonBody: {
                    success: true
                }
            };

        }catch (error) {
            context.log("Error: ", error);
            return {
                status: 500,
                jsonBody: {
                    error: "Internal error"
                }
            };
        }
    }
});