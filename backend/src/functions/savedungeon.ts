import { getMongoClient } from "../db/mongo";
import { RoomSave, User } from "../types/types";
import { BlobServiceClient } from "@azure/storage-blob";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface DungeonSave {
  id: string;
  code: string;
  name: string;
  owner: string;
  collaborators: string[];
  rooms: RoomSave[];
}

export async function saveDungeonHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as DungeonSave;
        const { id, code, name, owner, collaborators, rooms } = body;

        const dungeonSave = {
            id,
            code,
            name,
            owner,
            collaborators,
            rooms
        };

        const connectionString = process.env.BLOB_CONNECTION_STRING;
        if (!connectionString) {
            context.log("BLOB_CONNECTION_STRING mancante nell'ambiente.");
            return { status: 500, jsonBody: { error: "Configurazione server errata" } };
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const containerClient = blobServiceClient.getContainerClient("dungeon");

        const safeName = name.replace(/[^a-z0-9_-]/gi, '_');
        const fileName = `${safeName}_${id}.json`;
        const blockBlobClient = containerClient.getBlockBlobClient(fileName);

        const jsonString = JSON.stringify(dungeonSave);

        await blockBlobClient.uploadData(Buffer.from(jsonString), {
            blobHTTPHeaders: {
                blobContentType: "application/json"
            }
        });

        const blobUrl = blockBlobClient.url;

        const client = await getMongoClient();
        const db = client.db("stormbyte-db");
        const userCollection = db.collection<User>("users");

        await userCollection.updateOne(
            { uid: owner },
            {
                $push: {
                    dungeons: {
                        id,
                        code,
                        name,
                        blobUrl
                    }
                } as any 
            }
        );

        return {
            status: 201,
            headers:  { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: "Dungeon salvato",
                blobUrl
            })
        };

    } catch (error) {
        context.log("Errore durante il salvataggio del dungeon:", error);
        return { status: 500, jsonBody: { error: "Errore interno del server" } };
    }
}

app.http("savedungeon", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "save_dungeon",
  handler: saveDungeonHandler
});
