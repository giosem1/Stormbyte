import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMongoClient } from "../db/mongo";


app.http("check_dungeon", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req, ctx): Promise<HttpResponseInit> => {
    const dungeon_code= req.query.get("code") ?? "";
    
    const client = await getMongoClient();
    const collection = client.db("game").collection("userdungeon");

    const dungeon = await collection.findOne({dungeon_code});

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dungeon)
    };
  }
});
