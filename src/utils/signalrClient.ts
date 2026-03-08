import * as signalR from "@microsoft/signalr";
import type { User } from "../types/types";

export let connection: signalR.HubConnection;

export function createConnection(user: User) {
    connection = new signalR.HubConnectionBuilder()
        .withUrl("http://localhost:7071/api", {
            withCredentials: true,
            headers: { "X-User-Id": user.uid }
        })
        .withAutomaticReconnect()
        .build();
    return connection;
}

export async function startConnection() {
    if (!connection) throw new Error("Connection not initialized");
    try {
        await connection.start();
    } catch (err) {
        console.error("Errore connessione SignalR:", err);
        setTimeout(startConnection, 5000);
    }
}

export function onFriendRequest(callback: (data: any) => void) {
    connection.on("FriendRequestReceived", callback);
}

export function sendFriendRequestSignal(data: any) {
    connection.invoke("SendFriendRequest", data)
        .catch(console.error);
}

//Real-time synchronization for create dungeon
export function onDungeonUpdated(callback: (state: any) => void) {
    connection.on("dungeonUpdated", callback);
}
export function onUserJoinedLobby(callback: (data: any) => void) {
    connection.on("UserJoinedLobby", callback);
}

export function onInitialDungeonState(callback: (state: any) => void) {
    connection.on("initialDungeonState", callback);
}

export function onRoomMoved(callback: (data: any) => void) {
    connection.on("RoomMoved", callback);
}

export function onRoomCreated(callback: (room: any) => void) {
    connection.on("RoomCreated", callback);
}

export function onRoomDeleted(callback: (roomId: string) => void) {
    connection.on("RoomDeleted", callback);
}

export async function broadcastRealTimeMove(dungeonCode: string, payload: any) {
    if (connection && connection.state === "Connected"){
        try{
            await fetch("http://localhost:7071/api/sync_move", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dungeonCode: dungeonCode,
                    data: payload
                })
            });
        }catch (err){
            console.error("Real-time movment error: ", err)
        }
    }
}

//Chat for create dungeon
export function onChatMessage(callback: (data: any)=> void){
    connection.on("ChatMessage", callback);
}