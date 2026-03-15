import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { group } from "console";

const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'notifications',
    connectionStringSettings: 'AzureSignalRConnectionString'
});

app.http('sync_player_move', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [signalROutput],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            const body = await request.json() as any;
            const { dungeonCode, data } = body;
            
            if (!dungeonCode || !data) {
                return {
                    status: 400,
                    body: "Missing data"
                };
            }

            const siganlRMessage = {
                target: 'PlayerMoved',
                groupName: dungeonCode,
                arguments: [data]
            }

            context.extraOutputs.set( signalROutput, [siganlRMessage]);

            return {
                status: 200, 
                jsonBody: {
                    success: true
                }
            };

        }catch (err) {
            context.error("Error in sync_player_move: ", err);
            return {
                status: 500,
                body: "Internal server error"
            };
        }
    }
})