// OpenRouter Configuration
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-2.0-flash-exp:free";

export const chatWithAI = async (message: string, context?: string) => {
    if (!API_KEY) {
        console.warn("OpenRouter API Key is missing");
        return "Error: No se ha configurado la API Key de OpenRouter.";
    }
    console.log("🤖 AI Debug - Using Key:", API_KEY.substring(0, 15) + "...");

    try {
        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
                "HTTP-Referer": "https://mi-negocio-erp.com",
                "X-Title": "Mi Negocio ERP",
            },
            body: JSON.stringify({
                model: MODEL,
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
