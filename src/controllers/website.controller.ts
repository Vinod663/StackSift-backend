import { Response } from 'express';
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