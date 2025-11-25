import { Router } from 'express';
import { addWebsite, getAllWebsites } from '../controllers/website.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

//http://localhost:4000/api/v1/post/addWebsite
router.post('/addWebsite', authenticate, addWebsite);

//http://localhost:4000/api/v1/post/
router.get('/', getAllWebsites);

export default router;