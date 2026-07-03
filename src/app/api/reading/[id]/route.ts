import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { awardPoints } from "@/lib/pointsLedger";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const logId = parseInt(id);
  const body = await request.json();

  const log = await prisma.readingLog.findUnique({
    where: { id: logId },
    include: { book: { select: { title: true } } },
  });

  if (!log) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  try {
    // 家长评分
    if (body.action === "grade") {
      if ((session.user as any).role !== "PARENT") {
        return NextResponse.json({ error: "无权操作" }, { status: 403 });
      }

      const updateData: any = { status: "GRADED" };
      if (body.parentComment !== undefined) updateData.parentComment = body.parentComment;
      if (body.points !== undefined) updateData.points = body.points;

      const updated = await prisma.readingLog.update({
        where: { id: logId },
        data: updateData,
        include: { book: { select: { title: true, author: true } } },
      });

      // 发放积分
      if (body.points && body.points > 0 && log.studentId) {
        await awardPoints(log.studentId, body.points, `阅读评价: ${log.book?.title || "未知"}`);
      }

      return NextResponse.json(updated);
    }

    // 学生更新
    if (body.action === "update") {
      const updateData: any = {};
      if (body.excerpts !== undefined) updateData.excerpts = body.excerpts;
      if (body.thoughts !== undefined) updateData.thoughts = body.thoughts;
      if (body.progressRead !== undefined) updateData.progressRead = body.progressRead;

      const updated = await prisma.readingLog.update({
        where: { id: logId },
        data: updateData,
        include: { book: { select: { title: true, author: true } } },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "无效操作" }, { status: 400 });
  } catch (error) {
    console.error("Update reading log error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await params;
  await prisma.readingLog.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
