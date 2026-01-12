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
                        content: `Eres un asistente útil y profesional para el software "Mi Negocio ERP".
Tu trabajo es ayudar al usuario con su inventario y ventas basándote en los datos proporcionados.
Si te preguntan algo general sobre negocios, responde con consejos expertos.
Si te preguntan sobre datos específicos que NO están en el contexto, dí abiertamente que no tienes esa información.

CONTEXTO ACTUAL:
${context || "Sin datos específicos."}`
                    },
                    {
                        role: "user",
                        content: message
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3,
                top_p: 0.9,
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
