import fs from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

export async function ensureUploadDir(): Promise<void> {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch {
    // directory exists
  }
}

export async function saveFile(
  buffer: Buffer,
  filename: string
): Promise<string> {
  await ensureUploadDir();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(filename)}`;
  const filePath = path.join(UPLOADS_DIR, uniqueName);
  await fs.writeFile(filePath, buffer);
  return `/uploads/${uniqueName}`;
}

export function getPlaceholderUrl(
  text: string,
  width = 400,
  height = 300,
  bgColor = "F5E9D4",
  textColor = "78350F"
): string {
  return `https://placehold.co/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
}
