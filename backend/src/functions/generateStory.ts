import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface StoryRequest {
    prompt: string;
    dungeonCode?: string;
}

export async function generateStoryHandler(req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> {
    try {
        const body = await req.json() as StoryRequest;
        const { prompt } = body;

        if (!prompt) {
            return { status: 400, jsonBody: { error: "Missing prompt or event log" } };
        }

        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const apiKey = process.env.AZURE_OPENAI_API_KEY;
        const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;
        const apiVersion = "2024-02-15-preview";

        if (!endpoint || !apiKey || !deploymentName) {
            return { status: 500, jsonBody: { error: "Internal server configuration error" } };
        }

        const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
        const openAiResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "api-key": apiKey
            },
            body: JSON.stringify({
                messages: [{ role: "user", content: prompt }],
                max_tokens: 400
            })
        });

        if (!openAiResponse.ok) {
            return { status: 502, jsonBody: { error: "Error generating the story from AI" } };
        }

        const data = await openAiResponse.json();
        const generatedStory = data.choices[0].message.content;

        return {
            status: 200,
            jsonBody: { story: generatedStory }
        };

    } catch (err) {
        return { status: 500, jsonBody: { error: "Internal server error during generation" } };
    }
}

app.http("generateStory", {
    methods: ["POST"],
    authLevel: "anonymous",
    route: "generate_story",
    handler: generateStoryHandler
});
