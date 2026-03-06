import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT } from '../middlewares/authMiddleware';

const router = express.Router();

const uploadDir = path.join(process.cwd(), 'public/uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/v1/upload
router.post('/', authenticateJWT, upload.array('images', 5), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        const PORT = process.env.PORT || 5000;
        const baseUrl = process.env.NODE_ENV === 'production'
            ? 'https://your-production-url.com' // Replace with actual domain later
            : `http://localhost:${PORT}`;

        const imageUrls = files.map(file => `${baseUrl}/uploads/${file.filename}`);

        return res.status(200).json({ urls: imageUrls });
    } catch (error) {
        console.error('[Upload API] Error:', error);
        return res.status(500).json({ error: 'Failed to upload files' });
    }
});

export default router;
