import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../types/types";
import { getMongoClient } from "../db/mongo";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface LoginUser {
  username: string;
  password: string;
}

export async function loginHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as LoginUser;
        const { username, password } = body;

        if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
            return { status: 400, jsonBody: { error: "Username and password are required" } };
        }
        console.log("Credentials: ", username, password);
        const client = await getMongoClient();
        const collection = client.db("stormbyte-db").collection<User>("users");

        const passwordHash = crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");

        const player = await collection.findOne({ username });
        console.log("Player fing: ", player);
        if (!player || player.passwordHash !== passwordHash) {
            return { status: 401, jsonBody: { error: "Invalid credentials" } };
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            return { status: 500, jsonBody: { error: "Internal server configuration error" } };
        }

        const token = jwt.sign(
            { uid: player.uid, username: player.username },
            secret,
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
            jsonBody: { user: safeUser, token }
        };

    } catch (error) {
        return { status: 500, jsonBody: { error: "Malformed request or internal server error" } };
    }
}

app.http("login", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: loginHandler
});