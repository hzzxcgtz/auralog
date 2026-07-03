import { generateCaptcha } from "@/lib/captcha";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  const sessionId = crypto.randomUUID();
  const svg = generateCaptcha(sessionId);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "x-captcha-session": sessionId,
    },
  });
}
