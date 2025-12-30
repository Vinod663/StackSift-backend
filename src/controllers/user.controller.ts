import { Request, Response } from 'express';
import User from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';
import Website from '../models/website.model'; // Import Website Model
import Collection from '../models/collection.model'; // Import Collection Model
import bcrypt from 'bcryptjs';

// --- GET PROFILE ---
export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const user = await User.findById(req.user.sub).select('-passwordHash');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile" });
    }
};

// --- UPDATE DETAILS (Name, Bio, Password) ---
export const updateProfile = async (req: AuthRequest, res: Response) => {
    try {
        const { name, bio, password, coverGradient } = req.body; // Destructure password
        const userId = req.user.sub;

        // Prepare the update object
        const updateData: any = { name, bio };

        // If coverGradient is sent, add it to update
        if (coverGradient) {
            updateData.coverGradient = coverGradient;
        }

        // If user sent a new password, hash it and add to updateData
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateData.passwordHash = await bcrypt.hash(password, salt);
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-passwordHash'); // Never return the hash

        res.json({ message: "Profile updated", user: updatedUser });
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Error updating profile" });
    }
};

// --- UPLOAD AVATAR ---
export const uploadAvatar = async (req: AuthRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Cloudinary automatically provides the secure URL here
        const avatarUrl = req.file.path; 

        const updatedUser = await User.findByIdAndUpdate(
            req.user.sub,
            { avatarUrl: avatarUrl },
            { new: true }
        ).select('-passwordHash');

        res.json({ message: "Avatar updated", user: updatedUser });
    } catch (error) {
        console.error("Avatar Upload Error:", error);
        res.status(500).json({ message: "Error uploading avatar" });
    }
};

// --- NEW: GET USER STATS ---
export const getUserStats = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user.sub;

        // Run both counts in parallel for speed
        const [toolsCount, collectionsCount] = await Promise.all([
            Website.countDocuments({ addedBy: userId }), // Count tools added by user
            Collection.countDocuments({ userId: userId }) // Count collections owned by user
        ]);

        res.json({ 
            tools: toolsCount, 
            collections: collectionsCount 
        });

    } catch (error) {
        console.error("Stats Error:", error);
        res.status(500).json({ message: "Error fetching stats" });
    }
};