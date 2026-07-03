"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type PaperVariant = "paper" | "caramel" | "sage" | "coffee" | "ribbon";
type PaperElevation = "sm" | "md" | "lg";

interface PaperCardProps {
  children: ReactNode;
  variant?: PaperVariant;
  elevation?: PaperElevation;
  /** 左侧彩色装饰条 */
  accentBar?: boolean;
  /** 纸胶带装饰（左上角） */
  washiTape?: boolean;
  /** 纸胶带颜色 */
  washiColor?: "caramel" | "sage" | "coffee";
  className?: string;
  /** 点击事件 */
  onClick?: () => void;
  /** 拖拽相关 */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  /** 动画相关 */
  animated?: boolean;
  /** 自定义 motion 额外 props */
  motionProps?: Record<string, any>;
}

const variantStyles: Record<PaperVariant, string> = {
  paper: "bg-card-cream border-border-warm",
  caramel: "bg-card-cream border-caramel/30",
  sage: "bg-card-cream border-sage/30",
  coffee: "bg-card-cream border-coffee/20",
  ribbon: "bg-card-cream border-ribbon/30",
};

const elevationStyles: Record<PaperElevation, string> = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const accentBarColors: Record<PaperVariant, string> = {
  paper: "bg-caramel",
  caramel: "bg-caramel",
  sage: "bg-sage",
  coffee: "bg-coffee",
  ribbon: "bg-ribbon",
};

export default function PaperCard({
  children,
  variant = "paper",
  elevation = "sm",
  accentBar = false,
  washiTape = false,
  washiColor = "caramel",
  className = "",
  onClick,
  draggable,
  onDragStart,
  onDragEnd,
  animated = false,
  motionProps,
}: PaperCardProps) {
  const baseClasses = `relative rounded-xl border ${variantStyles[variant]} ${elevationStyles[elevation]} overflow-hidden ${className}`;
  const interactionClasses = onClick ? "cursor-pointer" : "";

  const content = (
    <div
      className={`${baseClasses} ${interactionClasses}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* 左侧装饰色条 */}
      {accentBar && (
        <div
          className={`absolute left-0 top-0 bottom-0 w-[3px] ${accentBarColors[variant]} rounded-l-xl`}
        />
      )}

      {/* 纸胶带装饰 */}
      {washiTape && (
        <div
          className={`absolute top-[-6px] left-4 w-[50px] h-[14px] -rotate-2 z-10 ${
            washiColor === "caramel"
              ? "bg-caramel/20"
              : washiColor === "sage"
                ? "bg-sage/20"
                : "bg-coffee/15"
          } border-l border-r border-dashed ${
            washiColor === "caramel"
              ? "border-caramel/10"
              : washiColor === "sage"
                ? "border-sage/10"
                : "border-coffee/10"
          }`}
        />
      )}

      {/* 内容 */}
      <div className="relative z-0">{children}</div>
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        {...motionProps}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}
