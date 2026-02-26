import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getMongoClient } from "../db/mongo";
import { BlobServiceClient } from "@azure/storage-blob";

app.http("retrive_dungeon", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req): Promise<HttpResponseInit> => {

    const dungeon_code = req.query.get("code");

    if (!dungeon_code) {
      return {
        status: 400,
        body: JSON.stringify({ error: "Missing dungeon code" })
      };
    }
    const client = await getMongoClient();
    const usersCollection = client.db("stormbyte-db").collection("users");

    const user = await usersCollection.findOne({
      "dungeons.code": dungeon_code
    });

    if (!user) {
      return {
        status: 404,
        body: JSON.stringify({ error: "Dungeon not found" })
      };
    }
    const dungeonMeta = user.dungeons.find(
      (d: any) => d.code === dungeon_code
    );

    if (!dungeonMeta?.blobUrl) {
      return {
        status: 404,
        body: JSON.stringify({ error: "Blob URL not found" })
      };
    }

    const blobUrl = dungeonMeta.blobUrl;

    const connectionString = process.env.BLOB_CONNECTION_STRING!;
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

    const urlParts = new URL(blobUrl);
    const pathParts = urlParts.pathname.split("/");

    const containerName = pathParts[1];
    const blobName = pathParts.slice(2).join("/");

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadResponse = await blockBlobClient.download();

    const downloaded = await streamToString(downloadResponse.readableStreamBody);

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: downloaded
    };
  }
});


async function streamToString(readableStream: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on("data", (data: any) => {
      chunks.push(data.toString());
    });
    readableStream.on("end", () => {
      resolve(chunks.join(""));
    });
    readableStream.on("error", reject);
  });
}