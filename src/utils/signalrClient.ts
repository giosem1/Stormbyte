import type { User } from "../types/types";
import * as signalR from "@microsoft/signalr";

export let connection: signalR.HubConnection;
export let currentUserId: string = "";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export function createConnection(user: User) {
    currentUserId = user.uid
    connection = new signalR.HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}`, {
            withCredentials: true,
            headers: { "X-User-Id": user.uid }
        })
        .withAutomaticReconnect()
        .build();

    registerGlobalNotificationListeners();
    return connection;
}

function registerGlobalNotificationListeners(){
    connection.on("FriendRequestReceived", (notif) => {
        const savedNotifs = JSON.parse(localStorage.getItem("app_notifications") || "[]");
        const alreadyExists = savedNotifs.some((n: any) => 
            n.type === "friend_request" &&
            n.fromUid === notif.fromUserId
        );
        if (!alreadyExists){
            savedNotifs.push({
                type: "friend_request",
                fromUid: notif.fromUserId,
                fromUsername: notif.fromUserName,
                timestamp: notif.timestamp
            });
            localStorage.setItem("app_notifications", JSON.stringify(savedNotifs));
            window.dispatchEvent(new Event("notifications_updated"));
        }
    });

    connection.on("DungeonInviteReceived", (payload) => {
        const savedNotifs = JSON.parse(localStorage.getItem("app_notifications") || "[]");
        const alreadyExists = savedNotifs.some((n: any) => 
            n.type === "dungeon_invite" &&
            n.dungeonCode === payload.dungeonCode &&
            n.ownerUid === payload.ownerUid
        );
        if (!alreadyExists){
            savedNotifs.push({
                type: "dungeon_invite",
                dungeonCode: payload.dungeonCode,
                dungeonName: payload.dungeonName,
                ownerUid: payload.ownerUid,
                ownerUsername: payload.ownerUsername,
                timestamp: payload.timestamp
            });
    
            localStorage.setItem("app_notifications", JSON.stringify(savedNotifs));
            window.dispatchEvent(new Event("notifications_updated"));
        }
    });

    connection.on("GameInviteReceived", (payload) => {
        if (payload.ownerUid === currentUserId) {
            return;
        }
        const savedNotifs = JSON.parse(localStorage.getItem("app_notifications") || "[]");
        const alreadyExists = savedNotifs.some((n: any) => 
            n.type === "game_invite" &&
            n.dungeonCode === payload.dungeonCode &&
            n.ownerUid === payload.ownerUid
        );
        if (!alreadyExists){
            savedNotifs.push({
                type: "game_invite",
                dungeonCode: payload.dungeonCode,
                lobbyId: payload.lobbyId,
                dungeonName: payload.dungeonName,
                ownerUid: payload.ownerUid,
                ownerUsername: payload.ownerUsername,
                timestamp: payload.timestamp
            });
    
            localStorage.setItem("app_notifications", JSON.stringify(savedNotifs));
            window.dispatchEvent(new Event("notifications_updated"));
        }
    });
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

export function onNameChanged(callback: (payload: any) => void) {
    connection.on("NAME_CHANGED", callback);
}

export async function broadcastRealTimeMove(dungeonCode: string, payload: any) {
    if (connection && connection.state === "Connected"){
        try{
            await fetch(`${API_BASE_URL}/sync_move`, {
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

export function onGlobalChatMessage(callback: (data: any) => void) {
    connection.on("GlobalChatMessage", callback);
}