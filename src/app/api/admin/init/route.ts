import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const DEFAULT_CATEGORIES = [
  { value: "SCHOOLWORK", label: "校内作业", color: "orange", sortOrder: 0 },
  { value: "PREVIEW", label: "新课预习", color: "caramel", sortOrder: 1 },
  { value: "EXERCISE", label: "教辅练习", color: "emerald", sortOrder: 2 },
  { value: "READING", label: "阅读", color: "teal", sortOrder: 3 },
];

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    // 按外键依赖顺序清理数据
    await prisma.taskPhoto.deleteMany();
    await prisma.dailyTask.deleteMany();
    await prisma.readingLog.deleteMany();
    await prisma.reward.deleteMany();
    await prisma.globalTask.deleteMany();
    await prisma.book.deleteMany();
    await prisma.specialPeriod.deleteMany();
    await prisma.vacation.deleteMany();
    await prisma.reviewReport.deleteMany();
    await prisma.taskCategory.deleteMany();
    await prisma.user.deleteMany();

    // 重新创建默认任务类别
    for (const c of DEFAULT_CATEGORIES) {
      await prisma.taskCategory.create({ data: c });
    }

    return NextResponse.json({ success: true, message: "系统数据已全部清空，默认任务类别已恢复" });
  } catch (error) {
    console.error("Init error:", error);
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
