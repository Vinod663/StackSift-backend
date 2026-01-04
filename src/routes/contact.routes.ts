import { Router } from 'express';
import { sendContactEmail } from '../controllers/contact.controller';

const router = Router();

// http://localhost:4000/api/v1/contact
router.post('/', sendContactEmail);

export default router;