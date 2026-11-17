import { generatePublicAIResponse } from "../services/publicAiService.js";

const publicChatWithAI = async (req, res) => {
  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a message."
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Your message cannot exceed 2000 characters."
      });
    }

    const aiResponse = await generatePublicAIResponse(message.trim());

    return res.status(200).json({
      success: true,
      response: aiResponse
    });

  } catch (error) {
    console.error("Public AI chat error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Siksha AI is temporarily unavailable. Please try again later."
    });
  }
};

export { publicChatWithAI };