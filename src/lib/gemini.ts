import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

export function getAIClient() {
  if (!aiClient) {
    // For Vite, environment variables must be prefixed with VITE_
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error("❌ VITE_GEMINI_API_KEY is not set. AI features will be disabled.");
      console.log("💡 To fix: Add VITE_GEMINI_API_KEY to your .env.local file");
      return null;
    }
    
    console.log("✅ Initializing Gemini AI client...");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function analyzeMealImage(base64Image: string, mimeType: string) {
  const ai = getAIClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-pro-vision",
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
  if (!ai) {
    console.error("AI Client not available - VITE_GEMINI_API_KEY is missing");
    return "AI Coach is currently unavailable. Please check your API key.";
  }

  try {
    const fullPrompt = `You are a world-class fitness coach, nutritionist, and personal trainer. 
Your goal is to help the user achieve their fitness goals. 
Be encouraging, concise, and scientifically accurate.
User Context: ${context}

User Query: ${message}

Please provide a detailed, actionable response (2-3 paragraphs, 200-300 words).`;

    console.log("Sending request to Gemini API...", { message, context });

    const response = await ai.models.generateContent({
      model: "gemini-pro",
      contents: fullPrompt,
    });

    console.log("Gemini API Response received:", response);

    if (!response.text) {
      console.error("No text in response:", response);
      return "Sorry, I couldn't generate a response. Please try again.";
    }

    return response.text;
  } catch (error) {
    console.error("AI Coach Error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `Sorry, I'm having trouble connecting to the fitness coach right now. Error: ${errorMsg}`;
  }
}
