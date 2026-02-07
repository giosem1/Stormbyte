import { MongoClient } from "mongodb";

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017";
let client: MongoClient;

export async function getMongoClient() {
  if (!client) {
    client = new MongoClient(MONGO_URI);
    await client.connect();
    console.log("MongoDB connesso");
  }
  return client;
}
