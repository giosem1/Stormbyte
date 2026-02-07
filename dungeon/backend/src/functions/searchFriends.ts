import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMongoClient } from "../db/mongo";
import { Frined, User } from "../types/types";

app.http("search_friend", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req, ctx): Promise<HttpResponseInit> => {
    const friend_code= req.query.get("code") ?? "";
    console.log(friend_code)
    const client = await getMongoClient();
    const collection = client.db("game").collection<User>("users");

    const friend = await collection.findOne({uid: friend_code});

    const sendFriend: Frined = {
        username: friend.username,
        uid: friend.uid,
        profImg: friend.profileImage
    }
    console.log(sendFriend)
    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendFriend)
    };
  }
});
