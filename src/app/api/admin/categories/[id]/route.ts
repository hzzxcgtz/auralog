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
    const updated = await prisma.taskCategory.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.label !== undefined && { label: body.label }),
        ...(body.color !== undefined && { color: body.color }),
        ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
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
  await prisma.taskCategory.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
