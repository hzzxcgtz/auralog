import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validateTransition, buildUpdateData } from "@/lib/taskStateMachine";
import { awardPoints } from "@/lib/pointsLedger";
import type { TaskAction } from "@/lib/taskStateMachine";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const taskId = parseInt(id);
  const body = await request.json();
  const { action, spentTime, studentNote, parentComment, points } = body;

  // action === "UPDATE" 时直接更新字段（不涉及状态机）
  if (action === "UPDATE") {
    const updateFields: any = {};
    if (body.title !== undefined) updateFields.title = body.title;
    if (body.category !== undefined) updateFields.category = body.category;
    if (body.estimatedTime !== undefined) updateFields.estimatedTime = body.estimatedTime;
    if (body.date !== undefined) updateFields.date = new Date(body.date);

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "没有需要更新的字段" }, { status: 400 });
    }

    const updated = await prisma.dailyTask.update({
      where: { id: taskId },
      data: updateFields,
      include: { photos: true },
    });
    return NextResponse.json(updated);
  }

  if (!action) {
    return NextResponse.json({ error: "缺少 action 参数" }, { status: 400 });
  }

  // 获取当前任务
  const task = await prisma.dailyTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    return NextResponse.json({ error: "任务不存在" }, { status: 404 });
  }

  // 校验状态转换
  const validation = validateTransition(
    task.status as any,
    action as TaskAction,
    { spentTime, studentNote, points }
  );

  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // 构建更新数据
  const updateData = buildUpdateData(action as TaskAction, {
    spentTime,
    studentNote,
    parentComment,
    points,
  });

  // 如果有照片关联，处理
  if (body.photoIds && action === "SUBMIT") {
    await prisma.taskPhoto.updateMany({
      where: { id: { in: body.photoIds } },
      data: { taskId },
    });
  }

  // 如果是首次评价操作，发放积分（重复评价不重复加分）
  if (action === "GRADE" && points && task.studentId && task.status !== "GRADED") {
    await awardPoints(task.studentId, points, `任务评价: ${task.title}`);
  }

  // 更新任务
  const updated = await prisma.dailyTask.update({
    where: { id: taskId },
    data: updateData,
    include: { photos: true },
  });

  return NextResponse.json(updated);
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
  await prisma.dailyTask.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ success: true });
}
