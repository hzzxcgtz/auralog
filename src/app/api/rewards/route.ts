import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deductPoints, refundPoints } from "@/lib/pointsLedger";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const rewards = await prisma.reward.findMany({
    orderBy: { id: "desc" },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(rewards);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  // 家长创建奖池
  if (body.action === "CREATE") {
    if ((session.user as any).role !== "PARENT") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }
    const reward = await prisma.reward.create({
      data: {
        title: body.title,
        cost: body.cost,
        stock: body.stock || 1,
      },
    });
    return NextResponse.json(reward, { status: 201 });
  }

  // 学生兑换
  if (body.action === "REDEEM") {
    const reward = await prisma.reward.findUnique({ where: { id: body.rewardId } });
    if (!reward || reward.stock <= 0) {
      return NextResponse.json({ error: "奖品已无库存" }, { status: 400 });
    }

    const userId = parseInt((session.user as any).id);
    const success = await deductPoints(userId, reward.cost, `兑换: ${reward.title}`);
    if (!success) {
      return NextResponse.json({ error: "积分不足" }, { status: 400 });
    }

    await prisma.reward.update({
      where: { id: body.rewardId },
      data: {
        stock: { decrement: 1 },
        status: "PENDING",
        userId,
      },
    });

    return NextResponse.json({ success: true });
  }

  // 家长审核
  if (body.action === "APPROVE" || body.action === "REJECT") {
    if ((session.user as any).role !== "PARENT") {
      return NextResponse.json({ error: "无权操作" }, { status: 403 });
    }

    const reward = await prisma.reward.findUnique({ where: { id: body.rewardId } });
    if (!reward) return NextResponse.json({ error: "记录不存在" }, { status: 404 });

    if (body.action === "REJECT" && reward.userId) {
      await refundPoints(reward.userId, reward.cost);
    }

    await prisma.reward.update({
      where: { id: body.rewardId },
      data: {
        status: body.action === "APPROVE" ? "APPROVED" : "REJECTED",
      },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "无效操作" }, { status: 400 });
}
