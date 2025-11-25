import { Request, Response } from 'express';
import Website from '../models/website.model';

export const addWebsite = async (req: Request, res: Response): Promise<void> => {
    try {
        // 1. Get ALL data from the user body
        const { title, url, description, category, tags, domain } = req.body;

        // 2. Create the new Website object
        const newWebsite = new Website({
            title,
            url,
            description,
            category,
            // If the user didn't send tags/domain, these will use the defaults from your Model
            tags: tags || [], 
            domain: domain || new URL(url).hostname.replace('www.', '') // Auto-extract domain!
        });

        // 3. Save to MongoDB
        await newWebsite.save();

        res.status(201).json({ message: 'Website added!', data: newWebsite });
    } catch (error) {
        console.error("Error adding website:", error); // Good for debugging
        res.status(500).json({ message: 'Error adding website', error });
    }
};