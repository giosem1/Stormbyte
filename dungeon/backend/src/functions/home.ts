import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMongoClient } from "../db/mongo";
import crypto from "crypto";

interface Loginuser{
    username: string,
    password: string
}

app.http("homepage", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req, ctx): Promise<HttpResponseInit> => {
    const body = await req.json() as Loginuser;

    const {username, password} = body;
     
    const passwordHash = crypto
          .createHash("sha256")
          .update(password)
          .digest("hex");
    
    const client = await getMongoClient();
    const collection = client.db("game").collection("users");

    const player = await collection.findOne({ username: username, password: passwordHash });

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player)
    };
  }
});
