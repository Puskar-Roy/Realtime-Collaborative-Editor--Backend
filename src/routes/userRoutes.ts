import express, { Router } from 'express';
import { getAllUsers, getUser } from '../controllers/userController';

import { protect } from '../middleware/middleware';
import { createProfilePic } from '../controllers/profilePicController';
import fileUpload from '../util/fileUpload';

const router: Router = express.Router();

router.get('/:id', getUser);
router.get('/', getAllUsers);
router.post('/:userId/profile', fileUpload, createProfilePic);

export default router;
