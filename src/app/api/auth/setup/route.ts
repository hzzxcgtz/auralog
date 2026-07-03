import { isFirstUser, createFirstUser } from "@/lib/setup";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const isFirst = await isFirstUser();
    if (!isFirst) {
      return NextResponse.json({ error: "系统已初始化" }, { status: 400 });
    }

    const body = await request.json();
    const { username, name, password } = body;

    if (!username || !name || !password) {
      return NextResponse.json({ error: "请填写所有必填字段" }, { status: 400 });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json({ error: "用户名仅支持字母、数字和下划线" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
    }

    const user = await createFirstUser({ username, name, password });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "用户名已被使用" }, { status: 409 });
    }
    console.error("Setup error:", error);
    return NextResponse.json({ error: "初始化失败" }, { status: 500 });
  }
}

export async function GET() {
  const isFirst = await isFirstUser();
  return NextResponse.json({ needsSetup: isFirst });
}
