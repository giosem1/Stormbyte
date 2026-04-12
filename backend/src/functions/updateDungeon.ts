import { applyActionToState, getLobby } from "../shared/lobbyStore";
import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalROutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "dungeonHub" 
});

interface UpdateDungeon {
    dungeonCode: string;
    action: any;
}

export async function updateDungeonHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as UpdateDungeon;
        const { dungeonCode, action } = body;

        if (!dungeonCode || !action) {
            return { 
                status: 400, 
                jsonBody: { error: "Missing required parameters" } 
            };
        }

        const lobby = getLobby(dungeonCode);
        if (!lobby) {
            return { 
                status: 404, 
                jsonBody: { error: "Lobby not found" } 
            };
        }

        applyActionToState(lobby.state, action);

        context.extraOutputs.set(signalROutput, [
            {
                target: "dungeonUpdated",
                arguments: [lobby.state],
                groupName: dungeonCode
            }
        ]);

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

app.http("updateDungeon", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "update_dungeon",
    extraOutputs: [signalROutput],
    handler: updateDungeonHandler
});