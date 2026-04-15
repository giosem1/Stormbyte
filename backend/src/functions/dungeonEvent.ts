import { getLobby, applyActionToState } from "../shared/lobbyStore";
import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

interface DungeonEvent {
  dungeonCode: string;
  userId: string;
  type: string;
  payload: any;
}

const signalROutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "notifications"
});

export async function dungeonEventHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as DungeonEvent;
        const { dungeonCode, userId, type, payload } = body;

        if (!dungeonCode || !userId || !type) {
            return { status: 400, jsonBody: { error: "Missing required parameters" } };
        }

        const lobby = getLobby(dungeonCode);
        if (!lobby) {
            return { status: 404, jsonBody: { error: "Lobby not found" } };
        }

        applyActionToState(lobby.state, { type, payload });
        
        let signalRMessages = [];

        if (type === "MOVE_ROOM") {
            const movedItem = lobby.state.items.find((i: any) => i.id === payload.roomId);
            
            signalRMessages.push({
                target: "RoomMoved",
                groupName: dungeonCode,
                arguments: [{
                    roomId: payload.roomId,
                    x: payload.x,
                    y: payload.y,
                    movedBy: userId,
                    src: payload.src,
                    type: payload.type,
                    fullItem: movedItem 
                }]
            });
        } else if (type === "CHAT_MESSAGE") {
            signalRMessages.push({
                target: "ChatMessage",
                groupName: dungeonCode,
                arguments: [{
                    userId: userId,
                    username: payload.username,
                    text: payload.text
                }]
            });
        } else if (type === "NAME_CHANGED") {
            signalRMessages.push({
                target: "NAME_CHANGED",
                groupName: dungeonCode,
                arguments: [{
                    name: payload.name,
                    changedBy: userId
                }]
            });
        } else if (type === "DUNGEON_SAVED") {
            signalRMessages.push({
                target: "DungeonSaved",
                groupName: dungeonCode,
                arguments: []
            });
        }

        context.extraOutputs.set("signalRMessages", signalRMessages);

        return { status: 200, jsonBody: { success: true } };

    } catch (error) {
        return { status: 500, jsonBody: { error: "Malformed request or internal server error" } };
    }
}

app.http("dungeonEvent", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "dungeon_event",
    extraOutputs: [signalROutput],
    handler: dungeonEventHandler
});