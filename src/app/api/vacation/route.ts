import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const vacations = await prisma.vacation.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json(vacations);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 });

  try {
    const body = await request.json();
    const vacation = await prisma.vacation.create({
      data: {
        name: body.name,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
      },
    });
    return NextResponse.json(vacation, { status: 201 });
  } catch {
    return NextResponse.json({ error: "创建假期失败" }, { status: 500 });
  }
}
