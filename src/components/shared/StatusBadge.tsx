"use client";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

const statusMap: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  TODO: {
    label: "待开始",
    bg: "bg-gray-100/60",
    text: "text-gray-500",
    dot: "bg-gray-400",
  },
  IN_PROGRESS: {
    label: "进行中",
    bg: "bg-blue-50/60",
    text: "text-blue-600",
    dot: "bg-blue-500",
  },
  DONE: {
    label: "已完成",
    bg: "bg-stone-100/60",
    text: "text-stone-500",
    dot: "bg-stone-400",
  },
  PENDING_REVIEW: {
    label: "待评价",
    bg: "bg-amber-50/60",
    text: "text-amber-600",
    dot: "bg-amber-500",
  },
  GRADED: {
    label: "已评价",
    bg: "bg-emerald-50/60",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
};

export default function StatusBadge({
  status,
  size = "sm",
  className = "",
}: StatusBadgeProps) {
  const s = statusMap[status] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-500",
    dot: "bg-gray-400",
  };

  const px = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${s.bg} ${s.text} ${px} ${textSize} font-medium ${className}`}
    >
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
