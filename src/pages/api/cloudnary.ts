import type { NextApiRequest, NextApiResponse } from "next";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "3mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { file } = req.body;
  if (!file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    const folder = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "lostmedia";
    const uploadResponse = await cloudinary.v2.uploader.upload(file, {
      folder,
    });
    return res.status(200).json({ url: uploadResponse.secure_url });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Upload failed";
    return res.status(500).json({ error: errorMessage });
  }
}
