"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShoppingBag,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/", label: "今日", icon: LayoutDashboard },
  { href: "/reading", label: "阅读", icon: BookOpen },
  { href: "/store", label: "商城", icon: ShoppingBag },
  { href: "/reports/1", label: "战报", icon: BarChart3 },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card-cream border-t border-border-warm lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? "text-caramel"
                  : "text-text-light hover:text-text-secondary"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "font-bold" : ""
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-4 h-0.5 rounded-full bg-caramel" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
