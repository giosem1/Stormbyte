import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { applyActionToState, getLobby, } from "../shared/lobbyStore";

interface UpdateDungeon {
    dungeonCode: string,
    action: string,
}
app.http("update_dungeon", {
  methods: ["POST"],
  authLevel: "anonymous",
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "dungeonHub"
    }
  ],
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {

    const body = await req.json() as UpdateDungeon;
    const { dungeonCode, action } = body;

    const lobby = getLobby(dungeonCode);
    if (!lobby) {
      return { status: 404 };
    }

    applyActionToState(lobby.state, action);

    context.extraOutputs.set("signalRMessages", [
      {
        target: "dungeonUpdated",
        arguments: [lobby.state],
        groupName: dungeonCode
      }
    ]);

    return { status: 200 };
  }
});