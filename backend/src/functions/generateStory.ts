import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

interface StoryRequest {
    prompt: string;
    dungeonCode: string;
}

app.http("generate_story", {
    methods: ["POST", "OPTIONS"],
    authLevel: "anonymous",
    handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
        if ( req.method === "OPTIONS") {
            return {
                status: 204,
                headers: corsHeaders()
            }
        }

        try {
            const body = await req.json() as StoryRequest;
            const { prompt } = body;

            if (!prompt) return error(400,"No log of events" );

            const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
            const apiKey = process.env.AZURE_OPENAI_API_KEY;
            const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;
            const apiVersion = "2024-02-15-preview";

            if (!endpoint || !apiKey || !deploymentName) {
                ctx.error("Missing Azure OpenAi configuration");
                return error(500, "Internal server error")
            }

            const url = `${endpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
            console.log(url)
            const openAiResponse = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "api-key": apiKey
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: "system",
                            content: "You are an epic bard in a dark fantasy world. Your task is to take a log of dungeon events and transform them into an epic and compelling medieval tale (maximum 2-3 short paragraphs). Use a dramatic, glorious, and immersive tone. Avoid making a simple list; weave the events into a true story."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 400
                })
            });

            if (!openAiResponse.ok) {
                const errorData = await openAiResponse.text();
                ctx.error("Error da OpenAI:", errorData);
                return error(502,  "The bard is confused. Error generating the story.");
            }

            const data = await openAiResponse.json();
            const generatedStory = data.choices[0].message.content;

            return {
                status: 200,
                headers: {
                    ...corsHeaders(),
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    story: generatedStory
                })
            };

        }catch(err) {
            ctx.error("Error during the generation:", err.message);
            return error(500, "Internal server error during the bard's song.");
        }
    }
});

function corsHeaders() {
    return {
        "Access-Control-Allow-Origin": "http://localhost:5173",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
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