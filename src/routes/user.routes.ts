import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticate } from '../middleware/auth.middleware';
import { getProfile, updateProfile, uploadAvatar, getUserStats } from '../controllers/user.controller';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

//Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//Configure Storage Engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        return {
            folder: 'stacksift_avatars', // The folder name in Cloudinary account
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
            transformation: [{ width: 500, height: 500, crop: 'limit' }], // Resize on upload
        };
    },
});

const upload = multer({ storage });

// Routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

router.get('/stats', authenticate, getUserStats);

export default router;