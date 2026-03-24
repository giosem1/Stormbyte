import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { group } from "console";

const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'notifications'
});

interface LeaveGameLobby {
    userId: string,
    lobbyId: string
}

app.http("leave_game", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "leave_game",
    extraOutputs: [signalROutput],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try{
            const body = await request.json() as LeaveGameLobby;
            const { userId, lobbyId } = body;

            if (!userId || !lobbyId) {
                return { 
                    status: 400, 
                    jsonBody: {
                        error: "Missing parameters"
                    }
                };
            }

            const siganlRMessages = [];

            siganlRMessages.push({
                target: "PlayerLeftGame",
                groupName: lobbyId,
                arguments: [userId]
            });

            siganlRMessages.push({
                userId: userId,
                groupName: lobbyId,
                action: "remove"
            });

            context.extraOutputs.set(signalROutput, siganlRMessages);

            return { 
                status: 200, 
                jsonBody: { 
                    success: true 
                } 
            };

        }catch (err: any) {
            context.error("Error during the exit: ", err);

            return { 
                status: 500, 
                jsonBody: {
                    error: "Internal Server Error"
                }
            };
        }
    }
})