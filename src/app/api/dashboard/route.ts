import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const user = session.user as any;
  const studentId = user.role === "STUDENT" ? parseInt(user.id) : undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const where = studentId ? { studentId } : {};

  // 今日任务
  const todayTasks = await prisma.dailyTask.findMany({
    where: { ...where, date: { gte: today, lt: tomorrow } },
    include: { photos: true },
  });

  // 今日专注
  const totalFocusSeconds = todayTasks.reduce(
    (sum, t) => sum + (t.spentTime || 0),
    0
  );

  // 今日待审核
  const pendingReview = await prisma.dailyTask.count({
    where: { ...where, status: "PENDING_REVIEW" },
  });

  // 待审核阅读记录
  const pendingReading = await prisma.readingLog.count({
    where: { ...where, status: "PENDING_REVIEW" },
  });

  // 统计数据
  const totalTasks = todayTasks.length;
  const completedTasks = todayTasks.filter(
    (t) => t.status === "GRADED" || t.status === "PENDING_REVIEW"
  ).length;

  // 最新动态
  const recentActivities = await prisma.dailyTask.findMany({
    where,
    orderBy: { id: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      status: true,
      spentTime: true,
      date: true,
      studentNote: true,
      category: true,
    },
  });

  return NextResponse.json({
    todayFocus: Math.round(totalFocusSeconds / 60) / 60, // 小时
    totalTasks,
    completedTasks,
    pendingReview: pendingReview + pendingReading,
    recentActivities,
    todayTasks,
  });
}
