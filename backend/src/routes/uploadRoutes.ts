import express, { Request, Response } from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware';

const router = express.Router();
// Use memory storage to avoid saving files to disk
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per file
});

// POST /api/v1/upload
router.post('/', authenticateJWT, upload.array('images', 5), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        const uploadPromises = files.map(file =>
            uploadToCloudinary(file.buffer, 'bidora_auctions')
        );

        const imageUrls = await Promise.all(uploadPromises);

        return res.status(200).json({ urls: imageUrls });
    } catch (error) {
        console.error('[Upload API] Error:', error);
        return res.status(500).json({ error: 'Failed to upload images' });
    }
});

export default router;
