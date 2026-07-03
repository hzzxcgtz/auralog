import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const report = await prisma.reviewReport.findUnique({
    where: { id: parseInt(id) },
  });

  if (!report) {
    return NextResponse.json({ error: "战报不存在" }, { status: 404 });
  }

  return NextResponse.json(report);
}
