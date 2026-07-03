import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "PARENT") {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: { id: true, name: true, username: true, points: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(students);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "PARENT") {
    return NextResponse.json({ error: "无权访问" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, name, password } = body;

    if (!username || !name || !password) {
      return NextResponse.json({ error: "请填写所有字段" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const student = await prisma.user.create({
      data: {
        username,
        name,
        passwordHash,
        role: "STUDENT",
        points: 0,
      },
      select: { id: true, name: true, username: true, createdAt: true },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "用户名已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
