// OpenRouter Configuration
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "mistralai/mistral-7b-instruct:free",
    "meta-llama/llama-3-8b-instruct:free"
];

export const chatWithAI = async (message: string, context?: string) => {
    if (!API_KEY) {
        console.warn("OpenRouter API Key is missing");
        return "Error: No se ha configurado la API Key de OpenRouter.";
    }

    let lastError = null;

    for (const model of MODELS) {
        try {
            console.log(`🤖 AI Attempting with model: ${model}`);

            const response = await fetch(OPENROUTER_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`,
                    "HTTP-Referer": "https://mi-negocio-erp.com",
                    "X-Title": "Mi Negocio ERP",
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: "system",
                            content: `Eres un asistente de negocios útil y directo.
Tu objetivo es ayudar al usuario con su inventario, ventas y dudas generales de negocio.
Usa el siguiente contexto si es relevante, si no, usa tu conocimiento general.

CONTEXTO:
${context || "Sin contexto."}`
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.3,
                    // Stop tokens help prevent hallucinations in models like Mistral
                    stop: ["User:", "Assistant:", "Usuario:", "Asistente:", "\n\n\n", "###"]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.warn(`⚠️ Model ${model} failed:`, errorData);
                throw new Error(errorData.error?.message || response.statusText);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) throw new Error("Empty response from OpenRouter.");

            return content; // Success! Return immediately.

        } catch (error: any) {
            console.error(`❌ Error with ${model}:`, error.message);
            lastError = error;
            // Continue to next model...
        }
    }

    return `Error: Todos los modelos de IA están ocupados o fallaron. Último error: ${lastError?.message}`;
};
