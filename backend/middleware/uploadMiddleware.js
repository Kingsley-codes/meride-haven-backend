import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit per file
        files: 4 // Maximum 4 files total (3 service images + 1 driver photo)
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Updated to handle both service images and driver photo separately
export const uploadServiceImages = upload.fields([
    { name: 'images', maxCount: 3 }, // Max 3 service images
    { name: 'driverPhoto', maxCount: 1 } // Single driver photo
]);