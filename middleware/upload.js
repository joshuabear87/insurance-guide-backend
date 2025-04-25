import multer from 'multer';
import { v2 as cloudinaryV2 } from 'cloudinary';
import streamifier from 'streamifier';
import dotenv from 'dotenv';

dotenv.config();

cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Accept named fields: image and secondaryImage
const imageUpload = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'secondaryImage', maxCount: 1 }
]);

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinaryV2.uploader.upload_stream(
      { resource_type: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

const cloudinaryUpload = async (req, res, next) => {
  if (!req.files || (!req.files.image && !req.files.secondaryImage)) {
    return next(); // No images uploaded
  }

  try {
    req.fileUrls = [];
    req.filePublicIds = [];

    const allFiles = [...(req.files.image || []), ...(req.files.secondaryImage || [])];

    for (const file of allFiles) {
      const result = await uploadToCloudinary(file.buffer);
      req.fileUrls.push(result.secure_url);
      req.filePublicIds.push(result.public_id);
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Error uploading to Cloudinary', error });
  }
};

export { imageUpload, cloudinaryUpload };
