import { Router } from 'express';
import { register, login, refreshToken } from '../controllers/auth.controller'; 

const router = Router();

//http://localhost:4000/api/v1/auth/register
router.post('/register', register);

//http://localhost:4000/api/v1/auth/login
router.post('/login', login);

//http://localhost:4000/api/v1/auth/refresh-token
router.post('/refresh-token', refreshToken); // <--- NEW ROUTE

export default router;