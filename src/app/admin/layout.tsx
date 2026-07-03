"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  CalendarDays,
  BookOpen,
  Coins,
  BarChart3,
  Settings2,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";

const adminNavItems = [
  { href: "/admin/planner", label: "陪伴看板", icon: CalendarDays },
  { href: "/admin/books", label: "书单管理", icon: BookOpen },
  { href: "/admin/rewards", label: "奖池管理", icon: Coins },
  { href: "/admin/reports", label: "报表中心", icon: BarChart3 },
  { href: "/admin/settings", label: "系统设置", icon: Settings2 },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isConnected } = useWebSocket();

  return (
    <div className="min-h-screen bg-bg-warm relative">
      {/* 纸张噪点纹理 */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.5'/%3E%3C/svg%3E\")",
          opacity: 0.025,
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        {/* 左侧导航 */}
        <aside className="hidden lg:flex flex-col w-56 bg-card-cream border-r border-border-warm sticky top-0 h-screen flex-shrink-0">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-warm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white shadow-sm">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-coffee font-serif">纸间流光</h1>
                <p className="text-[9px] text-text-light">管理后台</p>
              </div>
            </div>
            {/* 同步状态 */}
            <div
              className={`flex items-center gap-1 ${isConnected ? "text-sage" : "text-gray-400"}`}
              title={isConnected ? "实时同步中" : "离线"}
            >
              {isConnected ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
            </div>
          </div>

          {/* 导航 */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {adminNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 relative ${
                    isActive
                      ? "bg-caramel/10 text-caramel shadow-sm"
                      : "text-text-secondary hover:bg-caramel/8 hover:text-caramel"
                  }`}
                >
                  {/* 选中指示器 */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-caramel" />
                  )}
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* 退出登录 */}
          <div className="px-3 py-3 border-t border-border-warm">
            <Link
              href="/login"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-text-light hover:text-caramel hover:bg-caramel/5 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              <span>退出登录</span>
            </Link>
          </div>

          {/* 同步状态文字 */}
          <div className="px-4 py-2 border-t border-border-warm">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-sage animate-sync-pulse" : "bg-gray-300"}`} />
              <span className={`text-[9px] ${isConnected ? "text-sage" : "text-text-light"}`}>
                {isConnected ? "实时同步" : "离线模式"}
              </span>
            </div>
          </div>
        </aside>

        {/* 主内容 */}
        <main className="flex-1 p-4 md:p-6 overflow-auto max-w-7xl mx-auto page-enter">
          {children}
        </main>
      </div>
    </div>
  );
}
