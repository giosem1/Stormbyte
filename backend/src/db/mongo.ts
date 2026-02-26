import { MongoClient, ServerApiVersion } from "mongodb";
import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

const MONGO_URI = process.env.MONGO_URI as string;
let client: MongoClient;

export async function getMongoClient() {
  if (!client) {
    client = new MongoClient(MONGO_URI, {
      tls: true,
      serverApi: ServerApiVersion.v1,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 10000
    });
  }
  return client;
}