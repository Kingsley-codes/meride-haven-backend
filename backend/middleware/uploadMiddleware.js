import multer from 'multer';
import path from "path";


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
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'driverPhoto', maxCount: 1 }
]);

export const uploadDriverImages = upload.fields([
    { name: "passport", maxCount: 1 },
    { name: "license", maxCount: 1 },
    { name: "address", maxCount: 1 },
]);



const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

export const singleUpload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) cb(null, true);
        else cb(new Error("Only .jpeg, .jpg, and .png files are allowed"));
    },
});

