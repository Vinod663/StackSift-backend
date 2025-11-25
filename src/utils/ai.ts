import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// 1. Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// 2. Define the expected output structure
interface AIResponse {
  summary: string;
  category: string;
  tags: string[];
}

export const generateWebsiteInfo = async (url: string): Promise<AIResponse | null> => {
  try {
    // 3. The Prompt (The instructions we give to the AI)
    const prompt = `
      I am building a developer tool directory. 
      Analyze this URL: ${url}
      
      Tasks:
      1. Write a short, punchy summary (max 2 sentences) for a developer audience.
      2. Choose ONE category from: [Development, Design, Productivity, AI, DevOps, Learning].
      3. Generate 3-5 relevant, lowercase tags.

      Return ONLY a JSON object like this:
      {
        "summary": "string",
        "category": "string",
        "tags": ["string", "string"]
      }
    `;

    // 4. Send to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 5. Clean and Parse JSON (AI sometimes adds backticks)
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Generation Failed:", error);
    return null; // If AI fails, we just return null and use manual data
  }
};