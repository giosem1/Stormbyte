import {app, HttpRequest, HttpResponseInit, InvocationContext, output } from '@azure/functions';
import { HttpResponse } from '@azure/storage-blob';
import { group } from 'console';

const signalROutput = output.generic({
    type: 'signalR',
    name: 'singalRMessages',
    hubName: 'notifications',
    connectionStringSettings: 'AzureSingalRConnectionString'
});

app.http('sync_move', {
    methods: ['POST'],
    authLevel: 'anonymous',
    extraOutputs: [signalROutput],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try{
            const body = await request.json() as any;
            const { dungeonCode, data } = body;

            if (!dungeonCode || !data){
                return { status: 400, body: "Missing data"};
            }

            const signalRMessage = {
                target: 'RoomMoved',
                groupName: dungeonCode,
                arguments: [data]
            };

            context.extraOutputs.set(signalROutput, [signalRMessage]);
            return{ status: 200 }
            
        }catch (err){
            context.error("Error in sync_move: ", err);
            return { status: 500, body: "Internal server error" }
        }
    }
})