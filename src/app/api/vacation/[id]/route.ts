import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
    const vacation = await prisma.vacation.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
        ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      },
    });
    return NextResponse.json(vacation);
  } catch (error) {
    console.error("Update vacation error:", error);
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
    await prisma.vacation.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete vacation error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
