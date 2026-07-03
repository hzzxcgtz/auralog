import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const logs = await prisma.readingLog.findMany({
    include: { book: { select: { title: true, author: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await request.json();
    const log = await prisma.readingLog.create({
      data: {
        bookId: body.bookId,
        studentId: parseInt((session.user as any).id),
        date: new Date(body.date || Date.now()),
        progressRead: body.progressRead,
        excerpts: body.excerpts || null,
        thoughts: body.thoughts || null,
        status: "PENDING_REVIEW",
      },
      include: { book: { select: { title: true } } },
    });
    return NextResponse.json(log, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
