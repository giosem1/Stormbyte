import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMongoClient } from "../db/mongo";
import { RoomSave, User } from "../types/types";

interface DungeonSave{
    id: string,
    code: string,
    nameDungeon: string,
    owner: string,
    collaborators: string[],
    rooms: RoomSave[]
}

app.http("save_dungeon", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req, ctx): Promise<HttpResponseInit> => {
    const body = await req.json() as DungeonSave;
    const {id, code, nameDungeon, owner, collaborators, rooms} = body
    const dungeonSave = {
        id,
        code,
        nameDungeon,
        owner,
        collaborators,
        rooms
    }
    const client = await getMongoClient();
    const db = client.db("game");
    const dungeon = db.collection("userdungeon");
    const user = db.collection<User>("users");


    await user.updateOne(
      { uid: owner },
      {
        $push: {
          dungeons: {
            id,
            code,
            nameDungeon,
            // blobUrl: blob.url
          }
        }
      }
    );
    dungeon.insertOne(dungeonSave)
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dungeonSave)
    };
  }
});

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function error(status: number, message: string): HttpResponseInit {
  return {
    status,
    headers: {
      ...corsHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ error: message })
  };
}