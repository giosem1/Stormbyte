import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";
import { createLobby, getLobby } from "../shared/lobbyStore";
const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'notifications'
});

interface CreateLobby{
    dungeonCode: string,
    userId: string,
    lobbyId?: string,
}
app.http("create_lobby", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "create_lobby",
  extraOutputs: [signalROutput],
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            const body = await request.json() as CreateLobby;
            const { dungeonCode, userId, lobbyId } = body;

            if (!dungeonCode || !userId) {
                return {
                    status: 400,
                    jsonBody: { error: "Parametri mancanti" }
                };
            }
            const activeRoomId = lobbyId || dungeonCode;

            let lobby = getLobby(activeRoomId);
            if (!lobby) {
                lobby = createLobby(activeRoomId, userId);
            }

            const siganlRMessages = [
                {
                    userId: userId,
                    groupName: activeRoomId,
                    action: "add"
                }
            ];
            context.extraOutputs.set(signalROutput, siganlRMessages);

            return {
                status: 201,
                jsonBody: lobby
            };

        } catch (err: any) {
            return {
            status: 400,
            jsonBody: { error: err.message }
            };
        }
    }
});