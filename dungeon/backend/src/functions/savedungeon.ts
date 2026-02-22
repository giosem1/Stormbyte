import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { getMongoClient } from "../db/mongo";
import { RoomSave, User } from "../types/types";

interface DungeonSave {
  id: string;
  code: string;
  nameDungeon: string;
  owner: string;
  collaborators: string[];
  rooms: RoomSave[];
}

app.http("save_dungeon", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req): Promise<HttpResponseInit> => {

    const body = await req.json() as DungeonSave;
    const { id, code, nameDungeon, owner, collaborators, rooms } = body;

    const dungeonSave = {
      id,
      code,
      nameDungeon,
      owner,
      collaborators,
      rooms
    };

    const connectionString = process.env.BLOB_CONNECTION_STRING!;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient("dungeon");

    const fileName = `${id}.json`;
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
            nameDungeon,
            blobUrl
          }
        }
      }
    );

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Dungeon salvato",
        blobUrl
      })
    };
  }
});