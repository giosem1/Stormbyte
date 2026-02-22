import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMongoClient } from "../db/mongo";
import crypto from "crypto";

interface Loginuser{
    username: string,
    password: string
}

app.http("login", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {

    if (req.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }

    const body = await req.json() as Loginuser;
    const { username, password } = body;

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const client = await getMongoClient();
    const collection = client.db("stormbyte-db").collection("users");

    const player = await collection.findOne({
      username,
      passwordHash
    });

    if (!player) {
      return {
        status: 401,
        body: JSON.stringify({ error: "Credenziali non valide" })
      };
    }

    return {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(player)
    };
  }
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function error(status: number, message: string): HttpResponseInit {
  return {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ error: message })
  };
}
