import multer from 'multer';


// Simple multer configuration
const upload = multer({
    dest: "uploads/",
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
        files: 4 // Max 4 files total
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

export const uploadServiceImages = upload.fields([
    { name: 'images', maxCount: 3 },
    { name: 'driverPhoto', maxCount: 1 }
]);