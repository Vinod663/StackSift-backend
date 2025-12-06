import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Collection from '../models/collection.model';

// 1. Create a New Folder
export const createCollection = async (req: AuthRequest, res: Response) => {
    try {
        const { name } = req.body;
        const userId = req.user.sub;

        const existing = await Collection.findOne({ userId, name });
        if (existing) return res.status(400).json({ message: "Folder already exists" });

        const newCollection = new Collection({ name, userId, websites: [] });
        await newCollection.save();

        res.status(201).json(newCollection);
    } catch (error) {
        res.status(500).json({ message: "Error creating collection", error });
    }
};

// 2. Get All User Collections (with populated websites)
export const getUserCollections = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.sub;
        // Populate specific fields to keep response light
        const collections = await Collection.find({ userId })
            .populate('websites', 'title url category screenshotUrl description tags upvotes views approved') 
            .sort({ createdAt: -1 });

        res.status(200).json(collections);
    } catch (error) {
        res.status(500).json({ message: "Error fetching collections", error });
    }
};

// 3. Add Website to a Collection
export const addToCollection = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // Collection ID
        const { websiteId } = req.body;

        const collection = await Collection.findOneAndUpdate(
            { _id: id, userId: req.user.sub }, // Ensure user owns the folder
            { $addToSet: { websites: websiteId } }, // $addToSet prevents duplicates
            { new: true }
        );

        if (!collection) return res.status(404).json({ message: "Collection not found" });
        res.status(200).json({ message: "Added to folder", data: collection });
    } catch (error) {
        res.status(500).json({ message: "Error adding to collection", error });
    }
};

// 4. Remove Website from Collection
export const removeFromCollection = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params; // Collection ID
        const { websiteId } = req.body;

        const collection = await Collection.findOneAndUpdate(
            { _id: id, userId: req.user.sub },
            { $pull: { websites: websiteId } },
            { new: true }
        );

        res.status(200).json({ message: "Removed from folder", data: collection });
    } catch (error) {
        res.status(500).json({ message: "Error removing website", error });
    }
};

// 5. Delete a Collection
export const deleteCollection = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await Collection.findOneAndDelete({ _id: id, userId: req.user.sub });
        res.status(200).json({ message: "Folder deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting folder", error });
    }
};