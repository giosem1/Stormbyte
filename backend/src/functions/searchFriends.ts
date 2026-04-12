import { getMongoClient } from "../db/mongo";
import { Friend, User } from "../types/types";
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function searchFriendsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        const friend_code = req.query.get("code") ?? "";

        if (!friend_code) {
            return { status: 400, jsonBody: { error: "Missing friend code" } };
        }

        const client = await getMongoClient();
        const collection = client.db("stormbyte-db").collection<User>("users");

        const friend = await collection.findOne({ uid: friend_code });
        
        if (!friend) {
            return { status: 404, jsonBody: { error: "Friend not found" } };
        }

        const sendFriend: Friend = {
            username: friend.username,
            uid: friend.uid,
            profImg: friend.profileImage
        };

        return {
            status: 200,
            jsonBody: sendFriend
        };
        
    } catch (err) {
        context.error("Error searching friend: ", err);
        return { status: 500, jsonBody: { error: "Internal server error" } };
    }
}

app.http("searchFriends", {
    methods: ["GET"],
    authLevel: "anonymous",
    route: "search_friend",
    handler: searchFriendsHandler
});