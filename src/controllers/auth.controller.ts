import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/user.model';
import { signAccessToken, signRefreshToken } from '../utils/tokens'; // Fixed 'utills' typo
import jwt, { JwtPayload } from 'jsonwebtoken'; // Import JwtPayload type
import { OAuth2Client } from 'google-auth-library';
import { Role } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// --- REGISTER ---
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            // Added return to stop execution
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, passwordHash: hashedPassword });
        await newUser.save();

        res.status(201).json({
            message: "User registered successfully",
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error: any) {
        // Fixed error message text
        res.status(500).json({ message: 'Error registering user', error: error?.message });
    }
}

// --- LOGIN ---
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and Password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.passwordHash) {
            return res.status(400).json({ 
                message: 'Invalid credentials. Did you sign up with Google?' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        res.json({
            message: 'Login successful',
            user: { id: user._id, name: user.name, role: user.role, email: user.email },
            accessToken,
            refreshToken
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error logging in', error: error?.message });
    }
}

// --- REFRESH TOKEN ---
export const refreshToken = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Refresh Token is required" });
        }

        // Verify and Cast type for TS safety
        const payload = jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;

        const user = await User.findById(payload.sub);

        if (!user) {
            return res.status(401).json({ message: "Invalid Refresh Token" });
        }

        const accessToken = signAccessToken(user);

        // Fixed: Removed the double response. Sending only one JSON object.
        res.status(200).json({
            message: 'New access token generated successfully',
            accessToken: accessToken
        });
    } catch (error: any) {
        res.status(500).json({ message: 'Error refreshing token', error: error?.message });
    }
}


// --- GOOGLE SIGN-IN ---
export const googleLogin = async (req: Request, res: Response) => {
    try {
        const { token } = req.body; // Frontend sends the "idToken"

        if (!token) {
            return res.status(400).json({ message: "Token is required" });
        }

        // 1. Verify the Token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });

        const payload = ticket.getPayload();
        
        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Invalid Google Token" });
        }

        const { email, name, picture, sub: googleId } = payload;

        // 2. Check if user already exists in OUR database
        let user = await User.findOne({ email });

        if (user) {
            // User exists!
            // If they didn't have a googleId before (e.g., signed up with password), link it now.
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // User doesn't exist! -> Register them automatically
            user = new User({
                name: name,
                email: email,
                googleId: googleId,
                avatarUrl: picture,
                role: [Role.USER],
                // No passwordHash needed!
            });
            await user.save();
        }

        // 3. Generate Our Tokens (Same as normal login)
        const accessToken = signAccessToken(user);
        const refreshToken = signRefreshToken(user);

        res.status(200).json({
            message: 'Google Login successful',
            user: { id: user._id, name: user.name, role: user.role, email: user.email, avatarUrl: user.avatarUrl },
            accessToken,
            refreshToken
        });

    } catch (error: any) {
        res.status(500).json({ message: 'Google Login Failed', error: error?.message });
    }
};