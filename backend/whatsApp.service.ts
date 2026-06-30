import * as fs from "node:fs";
import dotenv from "dotenv";
import { logger } from "../utils/logger";

dotenv.config({
  path: "../../.env",
});

const SystemPrompt = `
You are RNK AI Assistant — an intelligent, professional, and friendly WhatsApp AI agent.

Your goal is to provide clear, structured, accurate, and mobile-friendly responses for WhatsApp users.

--------------------------
CORE BEHAVIOR RULES
--------------------------

1. Always respond in a clean WhatsApp-friendly format.
2. Use simple formatting:
   - *Bold* for headings
   - _Italic_ for emphasis
   - Bullet points using:
     • 
     - 
3. Avoid long paragraphs. Keep messages concise and readable.
4. Break complex answers into sections.
5. Use emojis only when helpful and professional (do NOT overuse).
6. Never mention that you are an AI model.
7. If unsure, say: 
   "I’m not fully certain, but here’s what I found:"
8. If question is unclear, politely ask for clarification.
9. Detect the user's language automatically and reply in the same language.
10. If the user greets casually, respond in a friendly tone.
11. If the user asks technical/business questions, respond formally and professionally.

--------------------------
RESPONSE STRUCTURE STYLE
--------------------------

For informational answers, use this format:

*Title / Main Answer*
Short summary (1–2 lines)

*Key Points:*
• Point 1  
• Point 2  
• Point 3  

*Additional Details (if needed):*
Short explanation

*Need help with anything else?*

--------------------------
SPECIAL CASE HANDLING
--------------------------

If user asks:
• For step-by-step help → Provide numbered steps.
• For comparison → Use structured comparison with bullet separation.
• For code → Use monospace formatting:
\`\`\`
code here
\`\`\`
• For business advice → Give actionable steps.
• For emotional support → Be empathetic and calm.

Always optimize answers for mobile chat readability.

Your name is: RNK AI Assistant.
Tone: Smart, Professional, Clear, Human-like.
`;

export const chatWithAI = async (message: string) => {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000", // Required by OpenRouter for ranking
          "X-Title": "WhatsApp AI", // Optional but recommended
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SystemPrompt },
            { role: "user", content: message },
          ],
          max_tokens: 1000,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const replyText = data.choices[0].message.content;

    return replyText;
  } catch (error) {
    console.error("Error in chatWithAI", error);
    throw error;
  }
};

export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      throw new Error("HF_TOKEN not configured in environment");
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ inputs: prompt }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      if (response.status === 503) {
        throw new Error("Model is loading, please try again in a few seconds");
      }
      throw new Error(
        `Hugging Face API Error: ${response.status} ${errorText}`,
      );
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());
    const timestamp = Date.now();
    const filename = `temp/image_${timestamp}.png`;

    if (!fs.existsSync("temp")) {
      fs.mkdirSync("temp", { recursive: true });
    }

    fs.writeFileSync(filename, new Uint8Array(imageBuffer));
    return filename;
  } catch (error: any) {
    logger.error("Image generation failed", {
      error: error.message,
      prompt,
    });
    throw new Error(`Failed to generate image: ${error.message}`);
  }
};

export const generateAIImage = async (
  prompt: string,
): Promise<string | null> => {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "WhatsApp AI",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-5.4-image-2",
          messages: [
            {
              role: "user",
              content: `Generate an image based on this prompt: ${prompt}`,
            },
          ],
          max_tokens: 1000,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No image content data found in OpenRouter response");
    }

    let imageBuffer: Buffer;
    const base64Match = content.match(/base64,([a-zA-Z0-9+\/]+=*)/);
    const urlMatch = content.match(/(https:\/\/[^\s)\"']+)/);

    if (base64Match) {
      imageBuffer = Buffer.from(base64Match[1], "base64");
    } else if (urlMatch) {
      const imgRes = await fetch(urlMatch[1]);
      if (!imgRes.ok)
        throw new Error(
          "Failed to download image from OpenRouter generated URL",
        );
      const arrayBuffer = await imgRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      throw new Error(
        `Could not parse any image URL or base64 from response: ${content}`,
      );
    }

    const timestamp = Date.now();
    const filename = `temp/image_${timestamp}.png`;

    if (!fs.existsSync("temp")) {
      fs.mkdirSync("temp", { recursive: true });
    }

    fs.writeFileSync(filename, new Uint8Array(imageBuffer));

    return filename;
  } catch (error: any) {
    logger.error("OpenRouter image generation failed", {
      error: error.message,
      prompt,
    });
    throw new Error(`Failed to generate image: ${error.message}`);
  }
};
