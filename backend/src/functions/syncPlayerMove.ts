import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'notifications',
    connectionStringSettings: 'AzureSignalRConnectionString'
});

interface PlayerMoveData {
    dungeonCode: string;
    lobbyId?: string;
    data: any;
}

export async function syncPlayerMoveHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as PlayerMoveData;
        const { dungeonCode, lobbyId, data } = body;
        
        if (!dungeonCode || !data) {
            return {
                status: 400,
                jsonBody: { error: "Missing data" }
            };
        }

        const targetGroup = lobbyId || dungeonCode; 

        const signalRMessage = {
            target: 'PlayerMoved',
            groupName: targetGroup,
            arguments: [data]
        };

        context.extraOutputs.set(signalROutput, [signalRMessage]);

        return {
            status: 200, 
            jsonBody: { success: true }
        };

    } catch (err) {
        context.error("Error in sync_player_move: ", err);
        return {
            status: 500,
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('syncPlayerMove', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "sync_player_move",
    extraOutputs: [signalROutput],
    handler: syncPlayerMoveHandler
});