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

// Multer-Cloudinary Storage for event images
const eventStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'event-images', // Cloudinary folder name
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ 
            width: 1200, 
            height: 600, 
            crop: 'limit' 
        }], // Optimize image size
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `event-${uniqueSuffix}`;
        }
    }
});

// Configure multer with Cloudinary storage for events
const uploadEvent = multer({ 
    storage: eventStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    }
});

// Configure storage for profile images
const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'profile-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ 
            width: 500, 
            height: 500, 
            crop: 'limit' 
        }],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `profile-${uniqueSuffix}`;
        }
    }
});

// Create multer middleware for profile images
const uploadProfile = multer({ 
    storage: profileStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB file size limit for profile pictures
    }
});

// Configure storage for review images
const reviewStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'review-images',
        allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        transformation: [{ 
            width: 800, 
            height: 600, 
            crop: 'limit' 
        }],
        public_id: (req, file) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            return `review-${uniqueSuffix}`;
        }
    }
});
  
// Create multer middleware for review images
const uploadReview = multer({ 
    storage: reviewStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only image files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB file size limit
    }
});
  
// Export all middlewares
module.exports = {
  single: function(fieldName) {
    return multer({ 
      storage, 
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Invalid file type. Only image files are allowed.'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024
      }
    }).single(fieldName);
  }
};