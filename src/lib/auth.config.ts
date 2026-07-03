import type { NextAuthConfig } from "next-auth";

// 中间件使用的轻量配置（不含 Prisma 依赖）
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const pathname = nextUrl.pathname;

      if (isLoggedIn) {
        if (role === "STUDENT" && pathname.startsWith("/admin")) {
          return Response.redirect(new URL("/forbidden", nextUrl.origin));
        }
        if (role === "PARENT" && !pathname.startsWith("/admin") && !pathname.startsWith("/api/") && pathname !== "/login") {
          return Response.redirect(new URL("/admin", nextUrl.origin));
        }
        return true;
      }

      if (pathname === "/login" || pathname === "/setup") return true;
      const loginUrl = new URL("/login", nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return Response.redirect(loginUrl);
    },
    jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        if (user.role) token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // 在完整配置中会合并
};
