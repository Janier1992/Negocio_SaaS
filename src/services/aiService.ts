// OpenRouter Configuration
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "mistralai/mistral-7b-instruct:free"; // Using verified working free model

export const chatWithAI = async (message: string, context?: string) => {
    if (!API_KEY) {
        console.warn("OpenRouter API Key is missing");
        return "Error: No se ha configurado la API Key de OpenRouter.";
    }
    console.log("🤖 AI Debug - Using Key:", API_KEY.substring(0, 15) + "...");

    try {
        messages: [
            {
                role: "system",
                content: `Eres el Asistente Inteligente de "Mi Negocio ERP".
                        
                        TUS REGLAS STRICTAS:
                        1. RESPONDE ÚNICAMENTE a la pregunta específica del usuario.
                        2. BÁSATE SOLO en el "CONTEXTO DEL NEGOCIO" proporcionado abajo. NO inventes datos.
                        3. NO saludes repetitivamente ni des introducciones largas. Ve directo al grano.
                        4. Si la pregunta no se relaciona con el negocio, responde: "Solo puedo ayudarte con información de tu negocio."

                        CONTEXTO DEL NEGOCIO:
                        ${context || "No hay datos específicos disponibles en este momento."}`
            },
            {
                role: "user",
                content: message
            }
        ],
            max_tokens: 2000,
            })
});

if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenRouter API Error: ${errorData.error?.message || response.statusText}`);
}

const data = await response.json();
const content = data.choices?.[0]?.message?.content;

if (!content) throw new Error("Empty response from OpenRouter.");

return content;

    } catch (error: any) {
    console.error("AI Service Error:", error);
    return `Error: No seudo conectar con el agente de IA. (${error.message})`;
}
};
