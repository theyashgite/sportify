import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const uploadsDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../uploads");
const athletePhotoPattern = /^\/uploads\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/;

export function isAthletePhotoPath(photo) {
  return typeof photo === "string" && athletePhotoPattern.test(photo);
}

export async function deleteAthletePhoto(photo) {
  if (!isAthletePhotoPath(photo)) return;
  try {
    await unlink(path.join(uploadsDirectory, path.basename(photo)));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
