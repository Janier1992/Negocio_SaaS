// OpenRouter Configuration
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "meta-llama/llama-3-8b-instruct:free";

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
                        content: `Eres un asistente de negocios directo y conciso.
Responde SOLO lo que el usuario pregunta.
NO repitas la pregunta.
NO simules una conversación (no escribas "Usuario:" o "Asistente:").
Usa el siguiente contexto para responder sobre inventario/ventas:
${context || "Sin datos."}`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 500,
                temperature: 0.2,
                top_p: 0.9,
                stop: ["User:", "Assistant:", "Usuario:", "Asistente:", "\n\n\n"],
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
