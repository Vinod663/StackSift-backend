import { Router } from 'express';
import { addWebsite } from '../controllers/website.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

//http://localhost:4000/api/v1/post/addWebsite
router.post('/addWebsite', authenticate, addWebsite);

export default router;