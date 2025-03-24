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

// Shared file filter for images
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files are allowed.'), false);
    }
};

// Event image storage
const eventStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'event-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 1200, height: 600, crop: 'limit' }]
    }
});

// Profile image storage
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'profile-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

// Review image storage
const reviewStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'review-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ width: 800, height: 600, crop: 'limit' }]
    }
});

// Create upload instances
const upload = multer({
    storage: eventStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

const profileUpload = multer({
    storage: profileStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});

const reviewUpload = multer({
    storage: reviewStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }
});

module.exports = {
    upload,
    profileUpload,
    reviewUpload
};