import { createLobby, getLobby } from "../shared/lobbyStore";
import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'notifications'
});

interface CreateLobby {
    dungeonCode: string;
    userId: string;
    lobbyId?: string;
}

export async function createLobbyHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as CreateLobby;
        const { dungeonCode, userId, lobbyId } = body;

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

        const signalRMessages = [
            {
                userId: userId,
                groupName: activeRoomId,
                action: "add"
            }
        ];
        
        context.extraOutputs.set(signalROutput, signalRMessages);

        return {
            status: 201,
            jsonBody: lobby
        };

    } catch (error) {
        return { 
            status: 500, 
            jsonBody: { error: "Malformed request or internal server error" } 
        };
    }
}

app.http("createLobby", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "create_lobby",
    extraOutputs: [signalROutput],
    handler: createLobbyHandler
});