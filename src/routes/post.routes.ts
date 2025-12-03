import { Router } from 'express';
import { addWebsite, getAllWebsites, searchAI, likeWebsite , viewWebsite } from '../controllers/website.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

//http://localhost:4000/api/v1/post/addWebsite
//protected route
router.post('/addWebsite', authenticate, addWebsite);
router.put('/:id/like', authenticate, likeWebsite);

//http://localhost:4000/api/v1/post/
//public route
router.get('/', getAllWebsites);

// Add this NEW route
//http://localhost:4000/api/v1/post/search-ai
//public route
router.post('/search-ai', searchAI); 

//http://localhost:4000/api/v1/post/:id/view
//public route
router.put('/:id/view', viewWebsite);

export default router;