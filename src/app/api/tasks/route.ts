import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const studentId = searchParams.get("studentId");
  const vacationId = searchParams.get("vacationId");
  const month = searchParams.get("month");

  const where: any = {};
  if (date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    where.date = { gte: dayStart, lte: dayEnd };
  }
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);
    where.date = { gte: monthStart, lte: monthEnd };
  }
  if (studentId) where.studentId = parseInt(studentId);
  if (vacationId) where.vacationId = parseInt(vacationId);
  const status = searchParams.get("status");
  if (status) where.status = status;

  const tasks = await prisma.dailyTask.findMany({
    where,
    include: { photos: true },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const task = await prisma.dailyTask.create({
      data: {
        vacationId: body.vacationId,
        date: new Date(body.date),
        title: body.title,
        category: body.category || "SCHOOLWORK",
        estimatedTime: body.estimatedTime || 30,
        status: "TODO",
        studentId: body.studentId || null,
        bookId: body.bookId || null,
        bookTitle: body.bookTitle || null,
      },
      include: { photos: true },
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: "创建任务失败" }, { status: 500 });
  }
}
