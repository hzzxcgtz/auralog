import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "PARENT") {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.password) {
      updateData.passwordHash = await bcrypt.hash(body.password, 12);
    }
    if (body.points !== undefined) updateData.points = body.points;

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: { id: true, name: true, username: true, points: true, role: true, createdAt: true },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "PARENT") {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  const { id } = await params;
  try {
    // 删除学生相关的所有数据
    const studentId = parseInt(id);
    await prisma.taskPhoto.deleteMany({ where: { task: { studentId } } });
    await prisma.dailyTask.deleteMany({ where: { studentId } });
    await prisma.readingLog.deleteMany({ where: { studentId } });
    await prisma.reward.deleteMany({ where: { userId: studentId } });
    await prisma.globalTask.deleteMany({ where: { studentId } });
    await prisma.book.deleteMany({ where: { studentId } });
    await prisma.user.delete({ where: { id: studentId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
