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
      2. Choose ONE category from: [Development, Design, Productivity, AI, DevOps, Learning].(Do not use "Development" if "Design" or "AI" fits better).
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


export const suggestToolsFromAI = async (query: string) => {
  try {
    const prompt = `
      The user is searching for a developer tool: "${query}".
      Suggest 6 REAL, existing tools that solve this problem.
      
      Tasks:
      1. Find 6 tools.
      2. For EACH tool, pick the ONE best matching category from this list: 
         [Development, Design, Productivity, AI, DevOps, Learning].
         (Do not use "Development" if "Design" or "AI" fits better).

      Return ONLY a JSON array. Format:
      [
        {
          "title": "Tool Name",
          "url": "https://tool-url.com",
          "description": "Short 1-sentence description.",
          "category": "The_Best_Category_From_List",
          "tags": ["tag1", "tag2"]
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Search Failed:", error);
    return [];
  }
};