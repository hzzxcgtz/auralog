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
    const reward = await prisma.reward.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.cost !== undefined && { cost: body.cost }),
        ...(body.stock !== undefined && { stock: body.stock }),
      },
    });
    return NextResponse.json(reward);
  } catch (error) {
    console.error("Update reward error:", error);
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
    await prisma.reward.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete reward error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
