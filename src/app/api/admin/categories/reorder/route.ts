import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { orderedIds } = body as { orderedIds: number[] };

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    // 批量更新 sortOrder
    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.taskCategory.update({
          where: { id },
          data: { sortOrder: index },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "排序失败" }, { status: 500 });
  }
}
