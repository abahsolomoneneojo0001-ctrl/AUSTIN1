import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
      return null;
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function analyzeMealImage(base64Image: string, mimeType: string) {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this meal. Estimate the total calories, protein (g), carbs (g), and fat (g). Return ONLY a JSON object with keys: name (string, short description), calories (number), protein (number), carbs (number), fat (number). Do not include markdown formatting or any other text.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const text = response.text;
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Meal Analysis Error:", error);
    return null;
  }
}

export async function askFitnessCoach(message: string, context: string = "") {
  const ai = getAIClient();
  if (!ai) return "AI Coach is currently unavailable. Please check your API key.";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: message,
      config: {
        systemInstruction: `You are a world-class fitness coach, nutritionist, and personal trainer. 
        Your goal is to help the user achieve their fitness goals. 
        Be encouraging, concise, and scientifically accurate.
        User Context: ${context}`,
      },
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("AI Coach Error:", error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again later.";
  }
}
