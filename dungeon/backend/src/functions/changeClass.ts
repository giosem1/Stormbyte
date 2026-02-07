import { getMongoClient } from "../db/mongo";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Frined, User } from "../types/types";

interface ChangeClass{
    selectedClass: string,
    UserId
}
app.http("class", {
  methods: ["PATCH", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {

    if (req.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }
    let body = await req.json() as ChangeClass;
    const { selectedClass, UserId } = body;

    const client = await getMongoClient();
    const db = client.db("game");
    const users = db.collection<User>("users")
    const result = await users.updateOne(
        { uid: UserId },
        {
            $set: {
                classe: selectedClass
            }
        }
    )
    return {
      status: 201,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(result)
    };
  }
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "PATCH, OPTIONS",
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

