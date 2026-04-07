import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { getMongoClient } from "../db/mongo";
import { User } from "../types/types";

interface GameProgressSave {
    dungeonCode: string;
    dungeonName: string
    lobbyId: string;
    userId: string;
    username: string;
    userClass: string;
    items: string[];
    story: string;
    blobUrl?: string;
}

app.http("save_game_progress", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",
    handler: async (req: HttpRequest): Promise<HttpResponseInit> => {
        try{
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
                const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
                const containerClient = blobServiceClient.getContainerClient("game-progress");
                await containerClient.createIfNotExists();
    
                const safeUsername = username.replace(/[^a-z0-9_-]/gi, '_');
                const fileName = `${dungeonCode}_${safeUsername}_${timestamp}.json`;
                const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    
                const jsonString = JSON.stringify(progressSave, null, 2);
    
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

        }catch(err){
            console.error("Error while saving progress: ", err);
            return{
                status: 500,
                jsonBody: {
                    error: "Internal Server Error while saving"
                }
            };
        }
    }
})