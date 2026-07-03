import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const books = await prisma.book.findMany({
    orderBy: { id: "asc" },
    include: { readingLogs: { take: 1, orderBy: { date: "desc" } } },
  });

  return NextResponse.json(books);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await request.json();
    const book = await prisma.book.create({
      data: {
        title: body.title,
        author: body.author || null,
        isRequired: body.isRequired || false,
        totalChapters: body.totalChapters || null,
        totalPages: body.totalPages || null,
        studentId: body.studentId || null,
      },
    });
    return NextResponse.json(book, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
