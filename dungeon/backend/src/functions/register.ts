import { getMongoClient } from "../db/mongo";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import crypto from "crypto";
import { User } from "../types/types";

interface RegisterRequest {
  uid: string;
  username: string;
  password: string;
  profileImg?: string;
  classe: string;
}

app.http("register", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {

    if (req.method === "OPTIONS") {
      return {
        status: 204,
        headers: corsHeaders()
      };
    }
    let body: RegisterRequest;
    body = await req.json() as RegisterRequest;
    console.log(body)

    const { uid, username, password, profileImg, classe} = body;

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const client = await getMongoClient();
    const db = client.db("stormbyte-db");
    const users = db.collection("users");

    const exists = await users.findOne({ username });
    if (exists) {
      return error(409, "Username già esistente");
    }

    const userDoc: User = {
      uid,
      username,
      passwordHash,
      classe,
      profileImage: profileImg ?? "",
      friends: [],
      dungeons: [],
      inventory: [],
    };
    const result = await users.insertOne(userDoc);
    
    return {
      status: 201,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify(userDoc)
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

