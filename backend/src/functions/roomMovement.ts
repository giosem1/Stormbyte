import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';

const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'notifications'
});

interface SyncMoveData {
    dungeonCode: string;
    data: any; 
}

export async function roomMovementHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as SyncMoveData;
        const { dungeonCode, data } = body;

        if (!dungeonCode || !data) {
            return { 
                status: 400, 
                jsonBody: { error: "Missing data" }
            };
        }

        const signalRMessage = {
            target: 'RoomMoved',
            groupName: dungeonCode,
            arguments: [data]
        };

        context.extraOutputs.set(signalROutput, [signalRMessage]);
        
        return { 
            status: 200,
            jsonBody: { success: true }
        };
        
    } catch (err) {
        context.log("Error in sync_move: ", err);
        return { 
            status: 500, 
            jsonBody: { error: "Internal server error" }
        };
    }
}

app.http('roomMovement', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: "sync_move",
    extraOutputs: [signalROutput],
    handler: roomMovementHandler
});
