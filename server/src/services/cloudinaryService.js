const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Cloudinary is configured via env vars:
// CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} fileBuffer - The file buffer from multer (req.file.buffer)
 * @param {string} fileName - Original file name (used for display/audit)
 * @param {string} mimeType - e.g. 'application/pdf', 'image/png'
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (fileBuffer, fileName, mimeType) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimeType === "application/pdf" ? "raw" : "image";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "lingkod-batas/contracts",
        resource_type: resourceType,
        public_id: `${Date.now()}-${fileName.replace(/\s+/g, "_")}`,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

/**
 * Delete a file from Cloudinary by its public ID.
 * Used if contract submission fails after upload.
 * @param {string} publicId
 * @param {string} resourceType - 'raw' for PDF, 'image' for PNG/JPEG
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
