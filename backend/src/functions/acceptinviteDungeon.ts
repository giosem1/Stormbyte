import { addUserToLobby, getLobby } from "../shared/lobbyStore";
import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

interface AcceptLobby {
  dungeonCode: string;
  userId: string;
}

const signalRGroupActionsOutput = output.generic({
    type: "signalR",
    name: "signalRGroupActions",
    hubName: "notifications"
});

const signalRMessagesOutput = output.generic({
    type: "signalR",
    name: "signalRMessages",
    hubName: "notifications"
});

export async function acceptInviteHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await request.json() as AcceptLobby;
        const { dungeonCode, userId } = body;

        if (!dungeonCode || !userId) {
            return {
                status: 400,
                jsonBody: { error: "Missing required parameters" }
            };
        }

        const lobby = getLobby(dungeonCode);
        if (!lobby) {
            return {
                status: 404,
                jsonBody: { error: "Lobby not found" }
            };
        }

      context.extraOutputs.set("signalRGroupActions", [
        {
          action: "add",
          userId: userId,
          groupName: dungeonCode
        }
      ]);

      const updatedLobby = addUserToLobby(dungeonCode, userId);

      context.extraOutputs.set("signalRMessages", [
        {
          target: "UserJoinedLobby",
          groupName: dungeonCode,
          arguments: [{ userId }]
        }
      ]);

      context.extraOutputs.set("signalRGroupActions", [
        {
          userId: userId,
          groupName: dungeonCode,
          action: "add" 
        }
      ]);

        return {
            status: 200,
            jsonBody: updatedLobby
        };

    } catch (error) {
        return {
            status: 500,
            jsonBody: { error: "Malformed request or internal server error" }
        };
    }
}

app.http("acceptinviteDungeon", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "join_lobby",
    extraOutputs: [signalRGroupActionsOutput, signalRMessagesOutput],
    handler: acceptInviteHandler
});