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
                        content: `Eres el Asistente Inteligente de "Mi Negocio ERP".
                        
                        MODOS DE OPERACIÓN:
                        1. **DATOS DEL NEGOCIO:** Si el usuario pregunta sobre SU negocio (inventario, ventas, alertas), usa EXCLUSIVAMENTE el "CONTEXTO DEL NEGOCIO" abajo. Si no está el dato, di "No tengo esa información registrada".
                        2. **ASESORÍA EXPERTA:** Si el usuario pide consejos generales (estrategias, marketing, ideas), responde como un experto en negocios usando tu conocimiento general.

                        REGLAS IMPORTANTES:
                        - Sé conciso y directo.
                        - No uses saludos repetitivos.
                        - NUNCA respondas con placeholders como "{input}" o código sin procesar.
                        - Si la pregunta es ambigua, asume que es sobre el negocio primero.

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
