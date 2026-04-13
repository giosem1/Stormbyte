import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalROutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "notifications"
});

interface GlobalChatEvent {
    userId: string;
    username: string;
    text: string;
}

const MAX_HISTORY = 50;
let globalChatHistory: any[] = [];

export async function sendGlobalMessageHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as GlobalChatEvent;
        const { userId, username, text } = body;

        if (!userId || !username || !text) {
            return {
                status: 400,
                jsonBody: { error: "Missing required parameters (userId, username, text)" }
            };
        }

        const messagePayload = {
            userId: userId,
            username: username,
            text: text,
            timestamp: new Date().toISOString()
        };

        globalChatHistory.push(messagePayload);
        if (globalChatHistory.length > MAX_HISTORY) {
            globalChatHistory.shift();
        }

        let signalRMessages = [];

        signalRMessages.push({
            target: "GlobalChatMessage",
            arguments: [messagePayload]
        });

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

app.http("sendGlobalMessage", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "send_global_chat",
    extraOutputs: [signalROutput],
    handler: sendGlobalMessageHandler
});

app.http("getGlobalChatHistory", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "global_chat_history",
    handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        return {
            status: 200,
            jsonBody: globalChatHistory
        };
    }
});