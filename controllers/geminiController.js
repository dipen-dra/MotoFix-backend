const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const systemInstruction = `You are "MotoFix Assistant", a helpful and friendly AI chatbot for a two-wheeler service workshop called MotoFix. Your goal is to assist users with their inquiries about bike services. You should be knowledgeable about common bike problems, service types, and maintenance. You can provide information on services like: general check-ups, oil changes, tire repair, engine work, and brake servicing. You can also help users understand potential issues based on symptoms they describe (e.g., "my bike is making a strange noise"). Keep your answers concise and easy to understand. Do not provide information outside the scope of bike services and MotoFix. If asked about booking, pricing, or appointments, politely guide them to use the website's booking feature or contact support directly, as you cannot access that information.`;

exports.generateChatResponse = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction 
        });

        const chat = model.startChat({
            history: history || [],
            generationConfig: {
                maxOutputTokens: 500,
            },
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const text = response.text();

        res.json({ response: text });

    } catch (error) {
        console.error("Error generating response from Gemini API:", error);
        res.status(500).json({ error: "Failed to generate chat response from AI model" });
    }
};