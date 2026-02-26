import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

app.http("negotiate", {
  methods: ["POST"],
  authLevel: "anonymous",
  extraInputs: [
    {
      type: "signalRConnectionInfo",
      name: "connectionInfo",
      hubName: "notifications",
      userId: "{headers.x-user-id}"
    }
  ],
  handler: async(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const userId = req.headers.get("x-user-id");

    return {
      jsonBody: context.extraInputs.get("connectionInfo")
    };
  }
});