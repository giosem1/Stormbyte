import { MongoClient } from "mongodb";

const uri = process.env.COSMOS_MONGO_URI!;
const client = new MongoClient(uri);

let connectedClient: MongoClient;

export async function getMongoClient() {
  if (!connectedClient) {
    await client.connect();
    connectedClient = client;
  }
  return connectedClient;
}
