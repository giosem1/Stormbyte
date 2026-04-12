import { getMongoClient } from "../db/mongo";
import { BlobServiceClient } from "@azure/storage-blob";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: string[] = [];
        readableStream.on("data", (data) => {
            chunks.push(data.toString());
        });
        readableStream.on("end", () => {
            resolve(chunks.join(""));
        });
        readableStream.on("error", reject);
    });
}

export async function retrieveDungeonHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const dungeon_code = req.query.get("code");

        if (!dungeon_code) {
            return { status: 400, jsonBody: { error: "Missing dungeon code" } };
        }

        const client = await getMongoClient();
        const usersCollection = client.db("stormbyte-db").collection("users");

        const user = await usersCollection.findOne({
            "dungeons.code": dungeon_code
        });

        if (!user) {
            return { status: 404, jsonBody: { error: "Dungeon not found" } };
        }

        const dungeonMeta = user.dungeons.find((d: any) => d.code === dungeon_code);

        if (!dungeonMeta?.blobUrl) {
            return { status: 404, jsonBody: { error: "Blob URL not found" } };
        }

        const blobUrl = dungeonMeta.blobUrl;
        const connectionString = process.env.BLOB_CONNECTION_STRING;

        if (!connectionString) {
            context.log("BLOB_CONNECTION_STRING mancante nell'ambiente.");
            return { status: 500, jsonBody: { error: "Configurazione server errata" } };
        }

        const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
        const urlParts = new URL(blobUrl);
        const pathParts = urlParts.pathname.split("/");

        const containerName = pathParts[1];
        const blobName = pathParts.slice(2).join("/");

        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const downloadResponse = await blockBlobClient.download();

        if (!downloadResponse.readableStreamBody) {
            return { status: 500, jsonBody: { error: "Impossibile leggere il contenuto del blob" } };
        }

        const downloaded = await streamToString(downloadResponse.readableStreamBody);
        
        const parsedData = JSON.parse(downloaded);

        return {
            status: 200,
            jsonBody: parsedData
        };

    } catch (error) {
        context.log("Errore durante il recupero del dungeon:", error);
        return { status: 500, jsonBody: { error: "Errore interno del server" } };
    }
}

app.http("retriveDungeon", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "retrive_dungeon",
    handler: retrieveDungeonHandler
});
