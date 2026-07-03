import type { Metadata } from "next";

// 加载 Noto 字体（中文字体优化）
import "@fontsource/noto-sans-sc/chinese-simplified-400.css";
import "@fontsource/noto-sans-sc/chinese-simplified-500.css";
import "@fontsource/noto-sans-sc/chinese-simplified-700.css";
import "@fontsource/noto-serif-sc/chinese-simplified-400.css";
import "@fontsource/noto-serif-sc/chinese-simplified-500.css";
import "@fontsource/noto-serif-sc/chinese-simplified-700.css";

import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ToastProvider } from "@/components/shared/ToastProvider";

export const metadata: Metadata = {
  title: "纸间流光 AuraLog - 学习记录平台",
  description: "记录光阴，见证成长。初中生假期学习记录与管理平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg-warm text-text-main font-sans text-sm leading-relaxed selection:bg-caramel/20 selection:text-coffee">
        <SessionProvider>
          <QueryProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
