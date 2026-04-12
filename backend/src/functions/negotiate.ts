import { app, HttpRequest, HttpResponseInit, InvocationContext, input } from "@azure/functions";

const connectionInfoInput = input.generic({
    type: "signalRConnectionInfo",
    name: "connectionInfo",
    hubName: "notifications",
    userId: "{headers.x-user-id}"
});

export async function negotiateHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const connectionInfo = context.extraInputs.get(connectionInfoInput);
        
        return {
            status: 200,
            jsonBody: connectionInfo
        };
    } catch (error) {
        context.log("Errore durante la negoziazione SignalR:", error);
        return {
            status: 500,
            jsonBody: { error: "Errore interno del server" }
        };
    }
}

app.http("negotiate", {
    methods: ["POST"],
    authLevel: "anonymous",
    extraInputs: [connectionInfoInput],
    handler: negotiateHandler
});