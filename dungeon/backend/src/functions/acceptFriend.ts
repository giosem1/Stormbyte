import { User } from './../../src/types/types';
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getMongoClient } from "../db/mongo";
import { Friend } from "../types/types";

interface AcceptFriendRequestBody {
  fromUid: string;
  userId: string;
}

app.http("accept_request", {
  methods: ["PATCH"],
  authLevel: "anonymous",
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "notifications"
    }
  ],
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {

    const body = await req.json() as AcceptFriendRequestBody;
    const { fromUid, userId } = body;

    if (!fromUid || !userId) {
      return { status: 400 };
    }

    const client = await getMongoClient();
    const session = client.startSession();

    try {
      session.startTransaction();

      const users = client.db("stormbyte-db").collection<User>("users");

      const fromUser = await users.findOne({ uid: fromUid }, { session });
      const toUser = await users.findOne({ uid: userId }, { session });

      if (!fromUser || !toUser) {
        await session.abortTransaction();
        return { status: 404 };
      }

      const fromFriend: Friend = {
        username: fromUser.username,
        uid: fromUser.uid,
        profImg: fromUser.profileImage
      };

      const toFriend: Friend = {
        username: toUser.username,
        uid: toUser.uid,
        profImg: toUser.profileImage
      };

      const updatedFrom = await users.findOneAndUpdate(
        { uid: fromUid },
        { $addToSet: { friends: toFriend } },
        { returnDocument: "after", session }
      );

      const updatedTo = await users.findOneAndUpdate(
        { uid: userId },
        { $addToSet: { friends: fromFriend } },
        { returnDocument: "after", session }
      );
      if (!updatedFrom || !updatedTo) {
        await session.abortTransaction();
        return { status: 404 };
      }

      await session.commitTransaction();
      session.endSession();

      context.extraOutputs.set("signalRMessages", [
        {
          userId: fromUid,
          target: "UserUpdated",
          arguments: [updatedFrom]
        },
        {
          userId: userId,
          target: "UserUpdated",
          arguments: [updatedTo]
        }
      ]);

      return {
        jsonBody: { success: true }
      };

    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("Transaction error:", err);
      return { status: 500 };
    }
  }
});