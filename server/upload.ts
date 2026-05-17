import { Router, Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

router.post("/upload", upload.single("file"), async (req: any, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Upload to S3
    const key = `community-photos/${Date.now()}-${req.file.originalname}`;
    const { url } = await storagePut(key, req.file.buffer, req.file.mimetype);

    res.json({ url, key });
  } catch (error: any) {
    console.error("[Upload] Error:", error);
    res.status(500).json({ error: error.message || "Upload failed" });
  }
});

export default router;
