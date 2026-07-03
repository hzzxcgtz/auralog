import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const reports = await prisma.reviewReport.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
}

// 生成阶段战报
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "PARENT") {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  const body = await request.json();

  try {
    // 获取该时间段的所有任务数据
    const tasks = await prisma.dailyTask.findMany({
      where: {
        date: {
          gte: new Date(body.startDate),
          lte: new Date(body.endDate),
        },
      },
      include: { photos: true },
    });

    // 获取该时间段的阅读记录
    const readingLogs = await prisma.readingLog.findMany({
      where: {
        date: {
          gte: new Date(body.startDate),
          lte: new Date(body.endDate),
        },
      },
      include: { book: { select: { title: true } } },
    });

    // 计算统计数据
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "GRADED").length;
    const totalFocusSeconds = tasks.reduce((sum, t) => sum + (t.spentTime || 0), 0);
    const totalFocusHours = Math.round((totalFocusSeconds / 3600) * 10) / 10;
    const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 0), 0);
    const readingCount = readingLogs.length;
    const booksRead = new Set(readingLogs.map((r) => r.book?.title)).size;
    const excerptsCount = readingLogs.filter((r) => r.excerpts).length;

    const dataSnapshot = JSON.stringify({
      totalTasks,
      completedTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalFocusHours,
      totalPoints,
      readingCount,
      booksRead,
      excerptsCount,
    });

    const report = await prisma.reviewReport.create({
      data: {
        type: body.type || "STAGE",
        stageNumber: body.stageNumber || 1,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        dataSnapshot,
        parentComment: body.parentComment || null,
        badgeAwarded: body.badgeAwarded || null,
      },
    });

    return NextResponse.json(report, { status: 201 });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: "生成战报失败" }, { status: 500 });
  }
}
