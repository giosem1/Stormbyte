import { User } from "../types/types";
import { getMongoClient } from "../db/mongo";
import { BlobServiceClient } from "@azure/storage-blob";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface GameProgressSave {
    dungeonCode: string;
    dungeonName: string;
    lobbyId: string;
    userId: string;
    username: string;
    userClass: string;
    items: string[];
    story: string;
    blobUrl?: string;
}

export async function saveGameProgressHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as GameProgressSave;
        const { dungeonCode, dungeonName, lobbyId, userId, username, userClass, items, story, blobUrl } = body;

        const timestamp = Date.now();
        let finalBlobUrl = blobUrl;

        if (!finalBlobUrl) {
            const progressSave = {
                ...body,
                savedAt: new Date(timestamp).toISOString()
            };
            
            const connectionString = process.env.BLOB_CONNECTION_STRING;
            if (!connectionString) {
                context.log("BLOB_CONNECTION_STRING mancante nell'ambiente.");
                return { status: 500, jsonBody: { error: "Configurazione server errata" } };
            }

            const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
            const containerClient = blobServiceClient.getContainerClient("game-progress");
            await containerClient.createIfNotExists();

            const safeUsername = username.replace(/[^a-z0-9_-]/gi, '_');
            const fileName = `${safeUsername}_${dungeonCode}_${timestamp}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(fileName);

            const jsonString = JSON.stringify(progressSave);
            await blockBlobClient.uploadData(Buffer.from(jsonString), {
                blobHTTPHeaders: {
                    blobContentType: "application/json"
                }
            });

            finalBlobUrl = blockBlobClient.url;
        }

        const client = await getMongoClient();
        const db = client.db("stormbyte-db");
        const userCollection = db.collection<User>("users");

        await userCollection.updateOne(
            { uid: userId },
            {
                $push: {
                    completedRuns: {
                        dungeonCode,
                        dungeonName,
                        lobbyId,
                        userClass,
                        itemsCollected: items,
                        blobUrl: finalBlobUrl,
                        completedAt: new Date(timestamp).toISOString()
                    }
                } as any
            }
        );

        return {
            status: 200,
            jsonBody: { 
                message: "Progress saved with success!!!!",
                blobUrl: finalBlobUrl
            }
        };

    } catch(err) {
        context.error("Error while saving progress: ", err);
        return {
            status: 500,
            jsonBody: { error: "Internal Server Error while saving" }
        };
    }
}

app.http("saveGameProgress", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "save_game_progress",
    handler: saveGameProgressHandler
});