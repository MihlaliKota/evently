const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Enhanced Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true  // Always use HTTPS for better security
});

// Shared file filter for images with enhanced validation
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF and WebP images are allowed.'), false);
    }
};

// Event image storage with enhanced configuration
const eventStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'event-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [
            { width: 1200, height: 600, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' }  // Automatic quality optimization
        ],
        format: 'jpg',  // Standardize output format
        resource_type: 'image',
        use_filename: true,
        unique_filename: true
    }
});

// Profile image storage with enhanced configuration
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'profile-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [
            { width: 500, height: 500, crop: 'thumb', gravity: 'face' },  // Focus on faces
            { quality: 'auto:good', fetch_format: 'auto' }
        ],
        format: 'jpg',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true
    }
});

// Review image storage with enhanced configuration
const reviewStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'review-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto:good', fetch_format: 'auto' }
        ],
        format: 'jpg',
        resource_type: 'image',
        use_filename: true,
        unique_filename: true
    }
});

// Create upload instances with enhanced size limits
const upload = multer({
    storage: eventStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }  // 5MB limit
});

const profileUpload = multer({
    storage: profileStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }  // 2MB limit
});

const reviewUpload = multer({
    storage: reviewStorage,
    fileFilter: imageFileFilter,
    limits: { fileSize: 3 * 1024 * 1024 }  // 3MB limit
});

module.exports = {
    upload,
    profileUpload,
    reviewUpload,
    cloudinary  // Export cloudinary for direct access
};