import express, { Request, Response } from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { uploadToCloudinary } from '../utils/cloudinary';

const router = express.Router();

// Use memory storage — we stream the buffer directly to Cloudinary, nothing is saved to disk
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit per file
    fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'));
        }
        cb(null, true);
    }
});

// POST /api/v1/upload
router.post('/', authenticateJWT, upload.array('images', 5), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        // Upload all files to Cloudinary in parallel
        const imageUrls = await Promise.all(
            files.map(file => uploadToCloudinary(file.buffer, 'bidora/products'))
        );

        return res.status(200).json({ urls: imageUrls });
    } catch (error: any) {
        console.error('[Upload API] Cloudinary Error:', error);
        return res.status(500).json({ error: error.message || 'Failed to upload files' });
    }
});

export default router;
