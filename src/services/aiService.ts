// OpenRouter Configuration
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-flash-1.5";

export const chatWithAI = async (message: string, context?: string) => {
    if (!API_KEY) {
        console.warn("OpenRouter API Key is missing");
        return "Error: No se ha configurado la API Key de OpenRouter.";
    }

    try {
        const systemPrompt = `
      Actúa como un asistente experto en negocios y análisis de datos para un ERP llamado "Mi Negocio".
      Contexto actual del usuario: ${context || "General"}
      Responde de manera concisa, profesional y útil.
    `;

        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`,
                "HTTP-Referer": "https://mi-negocio-erp.com", // Required by OpenRouter
                "X-Title": "Mi Negocio ERP", // Optional
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente de negocios inteligente para la aplicación "Mi Negocio ERP". 
                        
                        Contexto del Negocio:
                        ${context || "No hay contexto específico disponible."}
                        
                        Tu objetivo es ayudar al usuario a gestionar su inventario, ventas y alertas.
                        Responde de manera concisa, útil y profesional.`
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

        return `${content} (Model: ${MODEL})`;

    } catch (error: any) {
        console.error("AI Service Error:", error);
        return `Error: No seudo conectar con el agente de IA. (${error.message})`;
    }
};
