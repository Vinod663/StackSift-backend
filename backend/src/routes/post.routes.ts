import { Router } from 'express';
import { addWebsite } from '../controllers/website.controller';

const router = Router();

//http://localhost:4000/api/v1/post/addWebsite
router.post('/addWebsite', addWebsite);

export default router;