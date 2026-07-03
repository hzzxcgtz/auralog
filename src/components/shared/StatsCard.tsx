"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface StatsCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  /** 左侧装饰色条颜色 */
  accentColor?: "caramel" | "sage" | "coffee" | "ribbon" | "orange";
  /** 进度条（可选，0-100） */
  progress?: number;
  /** 进度条颜色在完成时变化 */
  progressComplete?: boolean;
  className?: string;
  /** 数值右侧的单位文字 */
  unit?: string;
}

const accentMap: Record<string, string> = {
  caramel: "bg-caramel/60",
  sage: "bg-sage/60",
  coffee: "bg-coffee/60",
  ribbon: "bg-ribbon/60",
  orange: "bg-orange-500/60",
};

const iconColorMap: Record<string, string> = {
  caramel: "text-caramel/70",
  sage: "text-sage/70",
  coffee: "text-coffee/70",
  ribbon: "text-ribbon/70",
  orange: "text-orange-500/70",
};

export default function StatsCard({
  icon,
  label,
  value,
  accentColor = "caramel",
  progress,
  progressComplete,
  className = "",
  unit,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`bg-card-cream border border-border-warm rounded-xl shadow-sm relative overflow-hidden card-hover ${className}`}
    >
      {/* 左侧装饰色条 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentMap[accentColor]}`}
      />

      <div className="p-4 pl-5">
        {/* 顶栏：图标 + 标签 */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-text-light font-medium">{label}</span>
          <span className={`w-4 h-4 ${iconColorMap[accentColor]}`}>{icon}</span>
        </div>

        {/* 数值 */}
        <div className="flex items-baseline gap-1">
          <motion.span
            key={String(value)}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`text-2xl font-bold font-serif ${
              accentColor === "caramel"
                ? "text-caramel/80"
                : accentColor === "sage"
                  ? "text-sage/80"
                  : accentColor === "coffee"
                    ? "text-coffee/80"
                    : accentColor === "ribbon"
                      ? "text-ribbon/80"
                      : "text-orange-500/80"
            }`}
          >
            {value}
          </motion.span>
          {unit && <span className="text-sm text-text-secondary">{unit}</span>}
        </div>

        {/* 可选的进度条 */}
        {progress !== undefined && (
          <div className="w-full bg-bg-warm rounded-full h-1.5 mt-2 border border-border-warm overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className={`h-full rounded-full ${
                progressComplete
                  ? "bg-sage/70"
                  : progress > 80
                    ? "bg-sage/70"
                    : progress > 50
                      ? "bg-caramel/70"
                      : "bg-caramel/50"
              }`}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
