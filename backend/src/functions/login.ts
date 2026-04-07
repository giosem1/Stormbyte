import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMongoClient } from "../db/mongo";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../types/types";

interface LoginUser {
  username: string;
  password: string;
}

app.http("login", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {

    if (req.method === "OPTIONS") {
      return { status: 204, headers: corsHeaders() };
    }

    const body = await req.json() as LoginUser;
    const { username, password } = body;
    if (!username || !password) return error(400, "Username e password richiesti");

    const client = await getMongoClient();
    const collection = client.db("stormbyte-db").collection<User>("users");

    const passwordHash = crypto
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const player = await collection.findOne({ username });
    if (!player) return error(401, "Credenziali non valide");

    if (player.passwordHash !== passwordHash) {
      return error(401, "Credenziali non valide");
    }
    const token = jwt.sign(
      { uid: player.uid, username: player.username },
      process.env.JWT_SECRET!,
      { expiresIn: "2h" }
    );

    const safeUser = {
      uid: player.uid,
      username: player.username,
      class: player.classe,
      avatar: player.profileImage,
      friends: player.friends || [],
      dungeons: player.dungeons || [],
      completedRuns: player.completedRuns || []
    };
    return {
      status: 200,
      headers: {
        ...corsHeaders(),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user: safeUser, token })
    };
  }
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
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