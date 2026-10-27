import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Router } from "express";
import multer from "multer";

const router = Router();
const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });

function imageExtension(buffer) {
  if (buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpg";
  if (buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

function receivePhoto(req, res, next) {
  upload.single("photo")(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Photo must be 5 MB or smaller."
        : "Upload one photo at a time.";
      return res.status(status).json({ message });
    }
    if (error) return next(error);
    next();
  });
}

async function savePhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Choose an image to upload." });
  }
  const extension = imageExtension(req.file.buffer);
  if (!extension) {
    return res.status(400).json({ message: "Use a valid JPG, PNG or WebP image." });
  }

  await mkdir(uploadsDirectory, { recursive: true });
  const filename = `${randomUUID()}.${extension}`;
  await writeFile(path.join(uploadsDirectory, filename), req.file.buffer, { flag: "wx" });
  res.status(201).json({ photo: `/uploads/${filename}` });
}

router.post("/athlete-photo", receivePhoto, savePhoto);
router.post("/profile-photo", receivePhoto, savePhoto);

export default router;
