import multer from 'multer';
import { v2 as cloudinaryV2 } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

// Cloudinary configuration (you can use .env values)
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up multer storage engine to buffer images
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Cloudinary upload function
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryV2.uploader.upload_stream(
      { resource_type: 'auto' }, // auto detects image format
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert the file buffer into a readable stream and pipe it to Cloudinary
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Middleware to handle file uploads
const cloudinaryUpload = async (req, res, next) => {
  if (!req.file) {
    return next(); // If no file, move to next middleware
  }

  try {
    const result = await uploadToCloudinary(req.file.buffer);
    req.fileUrl = result.secure_url;      
    req.filePublicId = result.public_id;     
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error uploading to Cloudinary', error });
  }
};

export { upload, cloudinaryUpload };
