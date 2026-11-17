
import { GoogleGenAI } from "@google/genai";

let ai = null;

// Initialize Gemini client only when needed
const getGeminiClient = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is missing from the environment variables."
      );
    }

    ai = new GoogleGenAI({ apiKey });
  }

  return ai;
};

// Generate an AI response using the primary model,
// with the fallback model if the primary request fails.
export const generateAIResponse = async (prompt) => {
  const gemini = getGeminiClient();

  const primaryModel =
    process.env.GEMINI_PRIMARY_MODEL || "gemini-3.5-flash-lite";

  const fallbackModel =
    process.env.GEMINI_FALLBACK_MODEL || "gemini-3.1-flash-lite";

  try {
    const response = await gemini.models.generateContent({
      model: primaryModel,
      contents: prompt,
    });

    return response.text;
  } catch (primaryError) {
    console.error(
      "Primary Gemini model failed:",
      primaryError.message
    );

    try {
      const response = await gemini.models.generateContent({
        model: fallbackModel,
        contents: prompt,
      });

      return response.text;
    } catch (fallbackError) {
      console.error(
        "Fallback Gemini model failed:",
        fallbackError.message
      );

      throw new Error("The AI service is temporarily unavailable.");
    }
  }
};
