const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Image file filter
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
};

// Create storage configurations for different uploads
const createCloudinaryStorage = (folder, dimensions) => {
    return new CloudinaryStorage({
        cloudinary,
        params: {
            folder,
            allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
            transformation: [dimensions],
            public_id: (req, file) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                return `${folder}-${uniqueSuffix}`;
            }
        }
    });
};

// Create multer instances for each type
const uploadEvent = multer({
    storage: createCloudinaryStorage('event-images', { width: 1200, height: 600, crop: 'limit' }),
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const uploadProfile = multer({
    storage: createCloudinaryStorage('profile-images', { width: 500, height: 500, crop: 'limit' }),
    fileFilter: imageFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const uploadReview = multer({
    storage: createCloudinaryStorage('review-images', { width: 800, height: 600, crop: 'limit' }),
    fileFilter: imageFileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }
});

module.exports = {
    uploadEvent,
    uploadProfile,
    uploadReview
};