import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveFile } from "@/lib/fileStorage";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "未选择文件" }, { status: 400 });
    }

    // 限制文件大小：10MB
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "文件不能超过 10MB" }, { status: 400 });
    }

    // 限制文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "不支持的文件格式" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = await saveFile(buffer, file.name);

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}
