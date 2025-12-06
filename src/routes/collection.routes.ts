import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
    createCollection, 
    getUserCollections, 
    addToCollection, 
    removeFromCollection, 
    deleteCollection 
} from '../controllers/collection.controller';

const router = Router();

router.use(authenticate); // All routes require login

router.get('/', getUserCollections);          // Get all folders
router.post('/', createCollection);           // Create new folder
router.put('/:id/add', addToCollection);      // Add website to folder
router.put('/:id/remove', removeFromCollection); // Remove website from folder
router.delete('/:id', deleteCollection);      // Delete folder

export default router;