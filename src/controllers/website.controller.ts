import { Request, Response } from 'express';
import Website from '../models/website.model';
import { AuthRequest } from '../middleware/auth.middleware'; 
import { generateWebsiteInfo, suggestToolsFromAI } from '../utils/ai';

export const addWebsite = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        // Get data from the user body
        const { title, url, description, category, tags, domain } = req.body;

        // SECURITY CHECK: Ensure user is logged in
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
            
            if (aiData) { //description, category, tags are optional 
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
            description: finalDescription, 
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


// --- GET ALL WEBSITES (Aggregation for Sorting by Array Length) ---
export const getAllWebsites = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 9; 
        const search = req.query.search as string;
        const category = req.query.category as string;
        const approvedQuery = req.query.approved as string;

        // Build Match Stage (Filtering)
        const matchStage: any = {}; // Only approved websites

        // Only filter by approved if specifically requested
        if (approvedQuery === 'true') matchStage.approved = true;
        if (approvedQuery === 'false') matchStage.approved = false;
        // If not sent, it might return both 

        if (search) {
            matchStage.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'All') {
            matchStage.category = category;
        }

        //Run Aggregation Pipeline
        const websites = await Website.aggregate([
            { $match: matchStage },
            {
                $addFields: {
                    // Create a temporary field 'likeCount' just for sorting
                    likeCount: { $size: { $ifNull: ["$upvotes", []] } } 
                }
            },
            { 
                $sort: { 
                    likeCount: -1, // Sort by calculated Length (Most Likes first)
                    views: -1,     // Then by Views
                    createdAt: -1  // Then by Newest
                } 
            },
            { $skip: (page - 1) * limit },
            { $limit: limit }
        ]);

        // Get Total Count 
        const totalDocs = await Website.countDocuments(matchStage);

        res.status(200).json({
            websites,
            totalPages: Math.ceil(totalDocs / limit),
            currentPage: page,
            totalWebsites: totalDocs
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: 'Error fetching websites', error });
    }
};

// AI Search Endpoint
export const searchAI = async (req: Request, res: Response) => {
    try {
        const { query } = req.body;
        if (!query) return res.status(400).json({ message: "Query required" });

        // This now handles Caching AND API calls internally
        const suggestions = await suggestToolsFromAI(query);

        if (suggestions.length === 0) {
            // If AI failed or returned nothing, send 200 with empty array
            return res.status(200).json({ websites: [] });
        }

        res.status(200).json({ websites: suggestions });
    } catch (error) {
        console.error("Controller Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// --- LIKE/UPVOTE A WEBSITE ---
export const likeWebsite = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user.sub; 

        const website = await Website.findById(id);
        if (!website) return res.status(404).json({ message: "Website not found" });

        // Check if user already liked it
        const index = website.upvotes.indexOf(userId);

        if (index === -1) {
            // Not liked yet -> Add Like
            website.upvotes.push(userId);
        } else {
            // Already liked -> Remove Like (Toggle)
            website.upvotes.splice(index, 1);
        }

        await website.save();

        res.status(200).json({ 
            message: index === -1 ? "Liked" : "Unliked", 
            data: website 
        });
    } catch (error) {
        res.status(500).json({ message: "Error liking website", error });
    }
};

//View Website
export const viewWebsite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const website = await Website.findByIdAndUpdate(
            id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!website) {
            return res.status(404).json({ message: "Website not found" });
        }

        res.status(200).json({ message: "View counted", data: website });
    } catch (error) {
        res.status(500).json({ message: "Error counting view", error });
    }
};


export const deleteWebsite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Website.findByIdAndDelete(id);
        res.status(200).json({ message: "Website deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting website", error });
    }
};


// --- APPROVE WEBSITE (Admin) ---
export const approveWebsite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Find and update 'approved' to true
        const website = await Website.findByIdAndUpdate(
            id,
            { approved: true },
            { new: true } // Return the updated document
        );

        if (!website) {
            return res.status(404).json({ message: "Website not found" });
        }

        res.status(200).json({ message: "Website approved successfully", data: website });
    } catch (error) {
        res.status(500).json({ message: "Error approving website", error });
    }
};

// --- UPDATE WEBSITE (Admin/Owner) ---
export const updateWebsite = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Whitelist fields to prevent overwriting upvotes/views/addedBy
        const { title, description, category, tags, url } = req.body;
        
        const updatedWebsite = await Website.findByIdAndUpdate(
            id,
            { title, description, category, tags, url },
            { new: true } // Return the updated document
        );

        if (!updatedWebsite) {
            return res.status(404).json({ message: "Website not found" });
        }

        res.status(200).json({ message: "Website updated successfully", data: updatedWebsite });
    } catch (error) {
        res.status(500).json({ message: "Error updating website", error });
    }
};