import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

const DEFAULT_CATEGORIES = [
  { value: "SCHOOLWORK", label: "校内作业", color: "orange", sortOrder: 0 },
  { value: "PREVIEW", label: "新课预习", color: "caramel", sortOrder: 1 },
  { value: "EXERCISE", label: "教辅练习", color: "emerald", sortOrder: 2 },
  { value: "READING", label: "阅读", color: "teal", sortOrder: 3 },
];

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let categories = await prisma.taskCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  // 确保所有默认类别都存在（仅补充缺失的）
  const existingValues = new Set(categories.map(c => c.value));
  for (const c of DEFAULT_CATEGORIES) {
    if (!existingValues.has(c.value)) {
      await prisma.taskCategory.create({ data: c });
    }
  }

  // 重新读取（新创建 + 已有）
  categories = await prisma.taskCategory.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    if (!body.value || !body.label) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
    }
    const category = await prisma.taskCategory.create({
      data: {
        value: body.value,
        label: body.label,
        color: body.color || "blue",
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "类别标识已存在" }, { status: 409 });
    }
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
