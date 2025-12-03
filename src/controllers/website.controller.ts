import { Request, Response } from 'express';
import Website from '../models/website.model';
import { AuthRequest } from '../middleware/auth.middleware'; 
import { generateWebsiteInfo, suggestToolsFromAI } from '../utils/ai';

export const addWebsite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // 1. Get data from the user body
        const { title, url, description, category, tags, domain } = req.body;

        // 2. SECURITY CHECK: Ensure user is logged in
        // The 'authenticate' middleware should catch this, but this is a double-check
        if (!req.user || !req.user.sub) {
             res.status(401).json({ message: "User not identified" });
             return;
        }

        let finalDescription = description;
        let finalCategory = category;
        let finalTags = tags;


        // Only call AI if the user didn't provide enough info
        if (!description || !tags || tags.length === 0) {
            console.log("🤖 Asking Gemini to analyze:", url);
            const aiData = await generateWebsiteInfo(url);
            
            if (aiData) {
                // If user left description blank, use AI's summary
                if (!finalDescription) finalDescription = aiData.summary;
                // If user left tags blank, use AI's tags
                if (!finalTags || finalTags.length === 0) finalTags = aiData.tags;
                // If user left category blank or 'Uncategorized', use AI's category
                if (!finalCategory || finalCategory === 'Uncategorized') finalCategory = aiData.category;
                else {
                    console.log("⚠️ AI returned null (Failed to generate).");
                }
            }
        }

        // If AI failed AND user didn't provide a description, stop here.
        if (!finalDescription) {
            res.status(400).json({ 
                message: "AI could not generate a description. Please enter one manually." 
            });
            return;
        }

        const newWebsite = new Website({
            title,
            url,
            description: finalDescription, // Now guaranteed to exist
            category: finalCategory || 'Uncategorized',
            tags: finalTags || [],
            domain: new URL(url).hostname.replace('www.', ''),
            addedBy: req.user.sub 
        });

        // 5. Save to MongoDB
        await newWebsite.save();

        res.status(201).json({ message: 'Website added!', data: newWebsite });
    } catch (error) {
        console.error("Error adding website:", error);
        res.status(500).json({ message: 'Error adding website', error });
    }
};

// --- GET ALL WEBSITES (WITH SEARCH & FILTER) ---
export const getAllWebsites = async (req: Request, res: Response) => {
    try {
        const { page = 1, limit = 10, search, category } = req.query;

        // 1. Build the Filter Object
        const filter: any = { approved: false }; // Change to 'true' later when admin is ready!
        
        // 2. Search Logic (Regex = Partial Match)
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },       // Case-insensitive search in Title
                { description: { $regex: search, $options: 'i' } }, // ... or Description
                { tags: { $regex: search, $options: 'i' } }         // ... or Tags
            ];
        }

        // 3. Category Logic (Exact Match)
        if (category) {
            filter.category = category;
        }

        // 4. Execute Query with Pagination
        const websites = await Website.find(filter)
            .limit(Number(limit) * 1)
            .skip((Number(page) - 1) * Number(limit))
            .sort({ createdAt: -1 }); // Newest first

        // 5. Get Total Count (for Frontend pagination UI)
        const count = await Website.countDocuments(filter);

        res.status(200).json({
            websites,
            totalPages: Math.ceil(count / Number(limit)),
            currentPage: Number(page),
            totalWebsites: count
        });

    } catch (error) {
        res.status(500).json({ message: 'Error fetching websites', error });
    }
};

// NEW: AI Search Endpoint
export const searchAI = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: "Query required" });

        console.log("🤖 AI Searching for:", query);
        const suggestions = await suggestToolsFromAI(query);

        res.status(200).json({ websites: suggestions });
    } catch (error) {
        res.status(500).json({ message: "AI Search Error", error });
    }
};