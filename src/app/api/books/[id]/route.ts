import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.author !== undefined && { author: body.author }),
        ...(body.isRequired !== undefined && { isRequired: body.isRequired }),
        ...(body.totalChapters !== undefined && { totalChapters: body.totalChapters }),
        ...(body.totalPages !== undefined && { totalPages: body.totalPages }),
        ...(body.studentId !== undefined && { studentId: body.studentId }),
      },
    });
    return NextResponse.json(book);
  } catch (error) {
    console.error("Update book error:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.book.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete book error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
