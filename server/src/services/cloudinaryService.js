const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const { randomUUID } = require("node:crypto");
const { isValidDocumentBuffer } = require("../utils/fileValidation");

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
 * @param {string} [folder="lingkod-batas/contracts"] - Target folder in Cloudinary
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadToCloudinary = (
  fileBuffer,
  fileName,
  mimeType,
  folder = "lingkod-batas/contracts",
) => {
  return new Promise((resolve, reject) => {
    const resourceType = mimeType.startsWith("image/") ? "image" : "raw";
    const deliveryType = folder === "lingkod-batas/contracts" ? "authenticated" : "upload";
    const extension = mimeType === "application/pdf" ? ".pdf" : mimeType === "text/plain" ? ".txt" : "";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${randomUUID()}${extension}`,
        type: deliveryType,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          deliveryType,
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
const deleteFromCloudinary = async (publicId, resourceType = "image", deliveryType = "upload") => {
  if (!["upload", "authenticated"].includes(deliveryType)) throw new Error("Unsupported storage delivery type");
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType, type: deliveryType, invalidate: true });
};

/** Download only from this application's Cloudinary account, without redirects. */
async function downloadContract(contract, { fetchImpl = fetch, signal } = {}) {
  let url = new URL(contract.cloudinaryUrl);
  const account = process.env.CLOUDINARY_CLOUD_NAME;
  if (!account || url.protocol !== "https:" || url.hostname !== "res.cloudinary.com" ||
      url.port || url.username || url.password ||
      url.pathname.split("/")[1] !== account) {
    throw new Error("Invalid document storage destination");
  }
  const mimeType = { pdf: "application/pdf", png: "image/png", jpeg: "image/jpeg", jpg: "image/jpeg" }[contract.fileType];
  if (!mimeType) throw new Error("Unsupported stored document type");
  const deliveryType = contract.cloudinaryDeliveryType || "upload";
  if (!["upload", "authenticated"].includes(deliveryType)) throw new Error("Unsupported document delivery type");
  if (deliveryType === "authenticated") {
    if (typeof contract.cloudinaryPublicId !== "string" || !contract.cloudinaryPublicId) throw new Error("Missing document identifier");
    url = new URL(cloudinary.utils.private_download_url(contract.cloudinaryPublicId, contract.fileType, {
      resource_type: contract.fileType === "pdf" ? "raw" : "image", type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 120, attachment: true,
    }));
    if (url.protocol !== "https:" || url.hostname !== "api.cloudinary.com" || url.username || url.password || url.port ||
      !url.pathname.startsWith(`/v1_1/${account}/`) || !url.pathname.endsWith("/download")) throw new Error("Invalid private storage destination");
  }
  const limit = 20 * 1024 * 1024;
  const response = await fetchImpl(url.href, { redirect: "error", signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(30000)]) : AbortSignal.timeout(30000) });
  if (!response.ok || !response.body) throw new Error("Document download unavailable");
  const chunks = [];
  let size = 0;
  try {
    if (Number(response.headers.get("content-length")) > limit) throw new Error("Stored document exceeds size limit");
    for await (const chunk of response.body) {
      size += chunk.length;
      if (size > limit) throw new Error("Stored document exceeds size limit");
      chunks.push(Buffer.from(chunk));
    }
  } catch (error) {
    await response.body.cancel().catch(() => {});
    throw error;
  }
  const buffer = Buffer.concat(chunks);
  if (!isValidDocumentBuffer(buffer, mimeType)) throw new Error("Invalid stored document signature");
  return { buffer, mimeType };
}

module.exports = { uploadToCloudinary, deleteFromCloudinary, downloadContract };
