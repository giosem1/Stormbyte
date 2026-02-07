import { getMongoClient } from "../db/mongo";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Frined, User } from "../types/types";

interface FriendRrequest{
    friend: Frined,
    UserId
}
app.http("send_request", {
  methods: ["PATCH", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {

    if (req.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }
    let body = await req.json() as FriendRrequest;
    const { friend, UserId } = body;

    const client = await getMongoClient();
    const db = client.db("game");
    const users = db.collection<User>("users");

    const user = await users.findOne({uid: UserId })

    if(user.friends.some(friendl => friendl.uid === friend.uid)){
        return {
            status: 201,
            headers: {
                ...corsHeaders(),
                "Content-Type": "application/json"
            },
            body: JSON.stringify(user)
        };
    }
    const result = await users.updateOne(
        { uid: UserId },
        {
            $push: {
                friends: friend
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

