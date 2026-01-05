import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { register, login, refreshToken, googleLogin, verifyPassword } from '../controllers/auth.controller'; 

const router = Router();

//http://localhost:4000/api/v1/auth/register
router.post('/register', register);

//http://localhost:4000/api/v1/auth/login
router.post('/login', login);

//http://localhost:4000/api/v1/auth/refresh-token
router.post('/refresh-token', refreshToken); 

//http://localhost:4000/api/v1/auth/google
router.post('/google', googleLogin);

//http://localhost:4000/api/v1/auth/verify-password
router.post('/verify-password', authenticate, verifyPassword);


//Default Get of https://stacksift-api.onrender.com
router.get('/', (req, res) => {
    res.send('Welcome to StackSift API');
});

export default router;