import dotenv from "dotenv"
import jwt from "jsonwebtoken"
import { IUser } from "../models/user.model" // Removed .ts extension for cleaner import

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET as string
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

export const signAccessToken = (user: IUser): string => {
    // FIX: Changed user.roles to user.role to match your model
    return jwt.sign({ sub: user._id.toString(), roles: user.role }, JWT_SECRET, { expiresIn: '30m' });
}

export const signRefreshToken = (user: IUser): string => {
    return jwt.sign({ sub: user._id.toString() }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}