import crypto from "crypto";
import { User } from "../types/types";
import { getMongoClient } from "../db/mongo";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface RegisterRequest {
  uid: string;
  username: string;
  password: string;
  profileImage?: string;
  classe: string;
}

export async function registerHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as RegisterRequest;
        const { uid, username, password, profileImage, classe } = body;

        if (!uid || !username || !password || !classe) {
            return { status: 400, jsonBody: { error: "Parametri mancanti" } };
        }

        const passwordHash = crypto
            .createHash("sha256")
            .update(password)
            .digest("hex");

        const client = await getMongoClient();
        const db = client.db("stormbyte-db");
        const users = db.collection<User>("users");

        const exists = await users.findOne({ username });
        if (exists) {
            return { status: 409, jsonBody: { error: "Username già esistente" } };
        }

        const userDoc: User = {
            uid,
            username,
            passwordHash,
            classe,
            profileImage: profileImage || "",
            friends: [],
            dungeons: [],
            inventory: [],
        };
        
        await users.insertOne(userDoc);

        return {
            status: 201,
            jsonBody: userDoc
        };

    } catch (error) {
        context.log("Errore durante la registrazione:", error);
        return { status: 500, jsonBody: { error: "Errore interno del server" } };
    }
}

app.http("register", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: registerHandler
});