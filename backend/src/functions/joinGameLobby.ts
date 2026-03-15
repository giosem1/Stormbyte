import { error, group } from "console";
import { createLobby, getLobby } from "../shared/lobbyStore";
import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const signalROutput = output.generic({
    type: 'signalR',
    name: 'siganlRMessagas',
    hubName: 'notifications'
});

interface JoinGameLobby {
    dungeonCode: string;
    userId: string;
    username: string;
    classe?: string;
}

app.http("join_game", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "join_game",
    extraOutputs: [signalROutput],
    handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            const body = await request.json() as JoinGameLobby;
            const { dungeonCode , userId, username, classe } = body;

            if (!dungeonCode || !userId) {
                return {
                    status: 400,
                    jsonBody: { error: "Missing paramters"}
                }
            }

            let lobby = getLobby(dungeonCode);
            if (!lobby) {
                lobby = createLobby(dungeonCode, userId);
            }

            const signalRMessages = [];

            signalRMessages.push({
                userId: userId,
                groupName: dungeonCode,
                action: "add"
            });

            signalRMessages.push({
                target: "PlayerJoinedGame",
                groupName: dungeonCode,
                arguments: [{
                    uid: userId,
                    username: username,
                    classe: classe
                }]
            });

            context.extraOutputs.set(signalROutput, signalRMessages);

            return {
                status: 200,
                jsonBody: lobby
            };
        } catch (err) {
            return {
                status: 400,
                jsonBody: { error: err.message }
            }
        }
    }
})