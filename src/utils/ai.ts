import { GoogleGenerativeAI } from "@google/generative-ai";
import AiCache from '../models/aiCache.model';
import dotenv from 'dotenv';

dotenv.config();

//Setup Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

//Define the expected output structure
interface AIResponse {
  summary: string;
  category: string;
  tags: string[];
}

export const generateWebsiteInfo = async (url: string): Promise<AIResponse | null> => {
  try {
    //The Prompt (The instructions we give to the AI)
    const prompt = `
      I am building a developer tool directory. 
      Analyze this URL: ${url}
      
      Tasks:
      1. Write a short, punchy summary (max 13 words 85 characters) for a developer audience.
      2. Choose ONE category from: [Development, Design, Productivity, AI, DevOps, Learning].(Do not use "Development" if "Design" or "AI" fits better).
      3. Generate 3-5 relevant, lowercase tags.

      Return ONLY a JSON object like this:
      {
        "summary": "string",
        "category": "string",
        "tags": ["string", "string"]
      }
    `;

    //Send to Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    //Clean and Parse JSON (AI sometimes adds backticks)
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);

  } catch (error) {
    console.error("AI Generation Failed:", error);
    return null; // If AI fails,return null and use manual data
  }
};


export const suggestToolsFromAI = async (query: string) => {

  const cleanQuery = query.toLowerCase().trim();

  try {
    const cachedData = await AiCache.findOne({ query: cleanQuery });

    if (cachedData) {
        console.log(`⚡ Serving "${cleanQuery}" from Cache (Saved API Call)`);
        return cachedData.results;
    }

    const prompt = `
      The user is searching for a developer tool: "${query}".
      Suggest 9 REAL, existing tools that solve this problem.
      
      Tasks:
      1. Find 9 tools.
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
    const response = await result.response;
    //remove markdown, newlines, and code blocks
    let text = response.text().replace(/```json|```/g, '').trim();
    
    // Find the start [ and end ] to ignore any extra text the AI might have added
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
        text = text.substring(firstBracket, lastBracket + 1);
    }
    
    let aiResults;
    try {
        aiResults = JSON.parse(text);
    } catch (jsonError) {
        console.error("❌ AI returned invalid JSON. Raw text:", text);
        return []; // Return empty array instead of crashing
    }

    //SAVE TO CACHE (Using Upsert to fix Race Condition)
    if (Array.isArray(aiResults) && aiResults.length > 0) {
        await AiCache.findOneAndUpdate(
            { query: cleanQuery }, // Find by query
            { 
                query: cleanQuery, 
                results: aiResults,
                createdAt: new Date() // Reset expiry timer
            },
            { upsert: true, new: true } // Create if not exists
        );
        console.log(`💾 Saved "${cleanQuery}" to Cache`);
    }

    return aiResults;

  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429')) {
        console.warn("⚠️ AI Rate Limit. Returning empty.");
    } else {
        console.error("AI Error:", error);
    }
    return [];
  }
};