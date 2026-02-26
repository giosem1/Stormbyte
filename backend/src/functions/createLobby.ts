import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { createLobby, getLobby } from "../shared/lobbyStore";
interface CreateLobby{
    dungeonCode: string,
    userId: string
}
app.http("create_lobby", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "create_lobby",
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
        try {
            const body = await request.json() as CreateLobby;
            const { dungeonCode, userId } = body;

            if (!dungeonCode || !userId) {
                return {
                    status: 400,
                    jsonBody: { error: "Parametri mancanti" }
                };
            }

            const existing = getLobby(dungeonCode);
            if (existing) {
                return {
                    status: 200,
                    jsonBody: existing
                };
            }

            const lobby = createLobby(dungeonCode, userId);

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