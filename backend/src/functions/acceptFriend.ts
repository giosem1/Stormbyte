import { getMongoClient } from "../db/mongo";
import { User, Friend } from '../types/types';
import { app, output, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface AcceptFriendRequestBody {
    fromUid: string;
    userId: string;
}

const signalROutput = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'notifications'
});

export async function acceptFriend(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    try {
        const body = await request.json() as AcceptFriendRequestBody;
        const { fromUid, userId } = body;

        if (!fromUid || !userId) {
            context.log('Parametri mancanti: fromUid o userId');
            return { status: 400, jsonBody: { error: 'Parametri mancanti' } };
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
                return { status: 404, jsonBody: { error: 'Utente non trovato' } };
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
                return { status: 404, jsonBody: { error: 'Errore durante l\'aggiornamento' } };
            }

            await session.commitTransaction();
            session.endSession();

            context.extraOutputs.set(signalROutput, [
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
                status: 200,
                jsonBody: { success: true }
            };

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            context.log(`Errore transazione: ${err}`);
            return { status: 500, jsonBody: { error: 'Errore interno del database' } };
        }
    } catch (error) {
        context.log(`Errore nella lettura del body: ${error}`);
        return { status: 500, jsonBody: { error: 'Richiesta malformata' } };
    }
};

app.http('acceptFriend', {
    methods: ['PATCH'], 
    route: 'accept_request',
    authLevel: 'anonymous',
    extraOutputs: [signalROutput],
    handler: acceptFriend
});