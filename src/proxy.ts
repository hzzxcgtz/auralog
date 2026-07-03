import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 路由守卫 — 使用 NextAuth 的 authorized 回调进行鉴权
// 注意：Proxy 在 Next.js 16 中默认使用 Node.js 运行时
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API 路由（含 NextAuth）→ 放行，由各自路由做认证
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 使用 NextAuth 进行完整鉴权
  const session = await auth();

  if (session?.user) {
    const role = (session.user as any).role;

    // 学生禁止访问管理后台
    if (role === "STUDENT" && pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }

    // 家长访问学生页时重定向到管理后台
    if (
      role === "PARENT" &&
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/api/") &&
      pathname !== "/login"
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    return NextResponse.next();
  }

  // 未登录 — 公开路径放行
  if (pathname === "/login" || pathname === "/setup") {
    return NextResponse.next();
  }

  // 受保护路径重定向到登录
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("callbackUrl", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
