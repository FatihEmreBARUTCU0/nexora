import { v2 as cloudinary } from "cloudinary";

function ensureCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Missing Cloudinary environment variables.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export async function uploadImage(fileBuffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  ensureCloudinaryConfig();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Failed to upload image."));
        return;
      }

      resolve({
        url: result.secure_url,
        publicId: result.public_id,
      });
    });

    stream.end(fileBuffer);
  });
}

export async function deleteImage(publicId: string): Promise<void> {
  ensureCloudinaryConfig();
  await cloudinary.uploader.destroy(publicId);
}
