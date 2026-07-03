import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const vacationId = searchParams.get("vacationId");

  const where: any = {};
  if (vacationId) where.vacationId = parseInt(vacationId);

  const periods = await prisma.specialPeriod.findMany({
    where,
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(periods);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "PARENT") {
    return NextResponse.json({ error: "无权操作" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const period = await prisma.specialPeriod.create({
      data: {
        vacationId: body.vacationId,
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        color: body.color || "blue",
        note: body.note || null,
      },
    });
    return NextResponse.json(period, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建特殊时间段失败" }, { status: 500 });
  }
}
