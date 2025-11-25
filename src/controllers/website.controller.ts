import { Request, Response } from 'express';
import Website from '../models/website.model';
import { AuthRequest } from '../middleware/auth.middleware'; // <--- Import the Interface

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

        // 3. Create the new Website object
        const newWebsite = new Website({
            title,
            url,
            description,
            category,
            tags: tags || [],
            domain: domain || new URL(url).hostname.replace('www.', ''), // Auto-extract domain
            
            // 4. LINK THE USER! (This is the magic part)
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