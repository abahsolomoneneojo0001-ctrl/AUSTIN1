// Get API key from Vite environment variables
function getApiKey(): string | null {
  // Try multiple ways to access the API key
  let apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY || 
               (window as any).__VITE_GEMINI_API_KEY ||
               (process.env as any).VITE_GEMINI_API_KEY;
  
  // Remove quotes if present
  if (apiKey && typeof apiKey === 'string') {
    apiKey = apiKey.replace(/^["']|["']$/g, '');
  }
  
  if (!apiKey || apiKey.includes('your_api_key')) {
    console.error("❌ VITE_GEMINI_API_KEY is not properly set.");
    console.log("💡 Environment:", {
      importMetaEnv: (import.meta.env as any).VITE_GEMINI_API_KEY,
      windowVar: (window as any).__VITE_GEMINI_API_KEY,
      processEnv: (process.env as any).VITE_GEMINI_API_KEY,
    });
    return null;
  }
  
  console.log("✅ API Key found:", apiKey.substring(0, 15) + "...");
  return apiKey;
}

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

export async function analyzeMealImage(base64Image: string, mimeType: string) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Meal Analysis Error:", error);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Meal Analysis Error:", error);
    return null;
  }
}

export async function askFitnessCoach(message: string, context: string = "") {
  const apiKey = getApiKey();
  if (!apiKey) {
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

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: {
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini API Error:", error);
      const errorMsg = error.error?.message || JSON.stringify(error);
      return `Sorry, API error: ${errorMsg}`;
    }

    const data = await response.json();
    console.log("Gemini API Response received:", data);

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error("No text in response:", data);
      return "Sorry, I couldn't generate a response. Please try again.";
    }

    return text;
  } catch (error) {
    console.error("AI Coach Error:", error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return `Sorry, I'm having trouble connecting to the fitness coach right now. Error: ${errorMsg}`;
  }
}
