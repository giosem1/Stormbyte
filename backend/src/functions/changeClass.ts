import { User } from "../types/types";
import { getMongoClient } from "../db/mongo";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface ChangeClass {
    selectedClass: string;
    UserId: string;
}

export async function changeClassHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as ChangeClass;
        const { selectedClass, UserId } = body;

        if (!selectedClass || !UserId) {
            return { 
                status: 400, 
                jsonBody: { error: "Missing required parameters" } 
            };
        }

        const client = await getMongoClient();
        const db = client.db("stormbyte-db");
        const users = db.collection<User>("users");

        const result = await users.updateOne(
            { uid: UserId },
            { $set: { classe: selectedClass } }
        );

        if (result.matchedCount === 0) {
            return { 
                status: 404, 
                jsonBody: { error: "User not found" } 
            };
        }

        return {
            status: 200,
            jsonBody: { success: true, modifiedCount: result.modifiedCount }
        };

    } catch (error) {
        return { 
            status: 500, 
            jsonBody: { error: "Malformed request or internal server error" } 
        };
    }
}

app.http("changeClass", {
    methods: ["PATCH"],
    authLevel: "anonymous",
    route: "class",
    handler: changeClassHandler
});