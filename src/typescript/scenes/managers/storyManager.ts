import GameScene from "../gamescene";
import { type StoryEvent, type StoryEventType } from "../../../types/types";

export class StoryManager {
    private scene: GameScene;
    private events: StoryEvent[] = [];
    
    constructor(scene: GameScene) {
        this.scene = scene;
    }

    public logEvent(type: StoryEventType, details: string, actorName?: string, actorClass?: string) {
        let roomName = "Mystery Room";
        if ( this.scene.currentRoom?.asset.includes("loginroom")) roomName = "Login Room";
        if ( this.scene.currentRoom?.asset.includes("catacomb")) roomName = "Catacomb Room";
        if ( this.scene.currentRoom?.asset.includes("portal")) roomName = "Portal Room";

        const newEvent: StoryEvent = {
            timestamp: Date.now(),
            type: type,
            actor: actorName || this.scene.user.username,
            actorClass: actorClass || this.scene.userClass,
            details: details,
            roomName: roomName
        }

        this.events.push(newEvent);
    }

    public generateChroniclePrompt(): string {
        if (this.events.length === 0) return "Nothing happends.";

        let prompt = `Generate an epic, fictionalised narrative in a medieval fantasy style about the following events that befell a group of adventurers in the dungeon ${this.scene.dungeon.name}:\n\n`
        
        this.events.sort((a,b) => a.timestamp - b.timestamp);

        this.events.forEach(e => {
            prompt += `- ${new Date(e.timestamp).toLocaleTimeString()}: ${e.actor} (${e.actorClass}) -> [${e.type}] ${e.details} (Luogo: ${e.roomName})\n`;
        });
    
        prompt += `\nUse a dramatic and gripping tone. Describe their victories, defeats and the treasures they have found.`;
        return prompt;
    }
        

}