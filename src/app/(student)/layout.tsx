"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  BarChart3,
  Wifi,
  WifiOff,
} from "lucide-react";
import MobileNav from "@/components/shared/MobileNav";
import PageTransition from "@/components/shared/PageTransition";

const navItems = [
  { href: "/", label: "今日", icon: LayoutDashboard },
  { href: "/reading", label: "阅读", icon: BookOpen },
  { href: "/store", label: "商城", icon: ShoppingBag },
  { href: "/reports/1", label: "战报", icon: BarChart3 },
];

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useWebSocket();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-bg-warm relative">
      {/* 纸张噪点纹理 — 更细腻 */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E\")",
          opacity: 0.025,
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* 桌面侧栏 — 紧凑固定宽度 */}
        <aside className="hidden lg:flex flex-col w-14 xl:w-16 bg-card-cream border-r border-border-warm items-center py-4 sticky top-0 h-screen flex-shrink-0">
          {/* Logo */}
          <div className="mb-8 flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold font-serif tracking-wider">流</span>
            </div>
          </div>

          {/* 导航 */}
          <nav className="flex flex-col items-center space-y-1 flex-1 w-full px-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 relative group ${
                    isActive
                      ? "bg-caramel/10 text-caramel"
                      : "text-text-secondary hover:bg-caramel/5 hover:text-caramel"
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  {/* 选中指示器 */}
                  {isActive && (
                    <span className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-caramel" />
                  )}
                  {/* Tooltip */}
                  <span className="absolute left-full ml-2 px-2 py-1 bg-coffee text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg z-50">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* 同步状态指示器 */}
          <div className="mt-auto pt-4 border-t border-border-warm w-full flex items-center justify-center py-2">
            <div
              className={`w-2 h-2 rounded-full ${isConnected ? "bg-sage" : "bg-gray-300"} ${isConnected ? "animate-sync-pulse" : ""}`}
              title={isConnected ? "实时同步" : "离线模式"}
            />
          </div>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 p-4 md:p-6 overflow-auto max-w-6xl mx-auto pb-20 lg:pb-6">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      {/* 移动端底部导航 */}
      <MobileNav />
    </div>
  );
}
