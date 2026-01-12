// OpenRouter Configuration
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free", // Updated to 3.1
    "mistralai/mistral-7b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "qwen/qwen-2-7b-instruct:free",
    "openchat/openchat-7:free"
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

            // Merge system prompt into user message to prevent role confusion in free models
            const combinedPrompt = `
INSTRUCCIONES DEL SISTEMA:
Eres un asistente de negocios útil y directo para "Mi Negocio ERP".
Ayuda con inventario, ventas y dudas generales.
Usa este contexto si sirve:
${context || "Sin datos."}

NO alucines. NO simules una conversación. Responde SOLO a la siguiente pregunta del usuario.

USUARIO:
${message}
`;

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
                            role: "user",
                            content: combinedPrompt
                        }
                    ],
                    max_tokens: 1000,
                    temperature: 0.2, // Lower temperature for more stability
                    // Comprehensive stop tokens against common hallucinations
                    stop: ["User:", "Assistant:", "Usuario:", "Asistente:", "\n\n\n", "###", "[/INST]", "</s>", "[USER]"]
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

            return content;

        } catch (error: any) {
            console.error(`❌ Error with ${model}:`, error.message);
            lastError = error;
        }
    }

    return `Error: Todos los modelos de IA están ocupados o fallaron. Último error: ${lastError?.message}`;
};
