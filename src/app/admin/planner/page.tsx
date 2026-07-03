"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PaperCard from "@/components/shared/PaperCard";
import StatsCard from "@/components/shared/StatsCard";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import { useToast } from "@/components/shared/ToastProvider";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Umbrella,
  Clock,
  Loader2,
  ListTodo,
  MapPin,
  Pencil,
  SquareStack,
  ChevronDown,
  Check,
  GripVertical,
  X,
  Star,
  Sparkles,
  MessageCircle,
  ClipboardList,
  Target,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const DAYS_OF_WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAY_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

// ── 类别颜色映射（柔和可区分的色值） ──
const CAT_COLOR_MAP: Record<string, { pill: string; badge: string }> = {
  orange:  { pill: "bg-orange-50/60 text-orange-600/80 border-orange-200/60",  badge: "bg-orange-50/80 text-orange-600 border-orange-200" },
  caramel: { pill: "bg-amber-50/60 text-amber-700/80 border-amber-200/60",    badge: "bg-amber-50/80 text-amber-700 border-amber-200" },
  emerald: { pill: "bg-emerald-50/60 text-emerald-600/80 border-emerald-200/60", badge: "bg-emerald-50/80 text-emerald-600 border-emerald-200" },
  teal:    { pill: "bg-teal-50/60 text-teal-600/80 border-teal-200/60",       badge: "bg-teal-50/80 text-teal-600 border-teal-200" },
  sky:     { pill: "bg-sky-50/60 text-sky-600/80 border-sky-200/60",          badge: "bg-sky-50/80 text-sky-600 border-sky-200" },
  blue:    { pill: "bg-blue-50/60 text-blue-600/80 border-blue-200/60",       badge: "bg-blue-50/80 text-blue-600 border-blue-200" },
  indigo:  { pill: "bg-indigo-50/60 text-indigo-600/80 border-indigo-200/60", badge: "bg-indigo-50/80 text-indigo-600 border-indigo-200" },
  purple:  { pill: "bg-purple-50/60 text-purple-600/80 border-purple-200/60", badge: "bg-purple-50/80 text-purple-600 border-purple-200" },
  pink:    { pill: "bg-pink-50/60 text-pink-600/80 border-pink-200/60",       badge: "bg-pink-50/80 text-pink-600 border-pink-200" },
  rose:    { pill: "bg-rose-50/60 text-rose-600/80 border-rose-200/60",       badge: "bg-rose-50/80 text-rose-600 border-rose-200" },
};

const PERIOD_COLORS = [
  { value: "orange", label: "橙", bg: "bg-orange-200/40", border: "border-orange-300", text: "text-orange-700" },
  { value: "caramel", label: "焦糖", bg: "bg-amber-200/40", border: "border-amber-300", text: "text-amber-700" },
  { value: "emerald", label: "翠绿", bg: "bg-emerald-200/40", border: "border-emerald-300", text: "text-emerald-700" },
  { value: "teal", label: "青绿", bg: "bg-teal-200/40", border: "border-teal-300", text: "text-teal-700" },
  { value: "sky", label: "天蓝", bg: "bg-sky-200/40", border: "border-sky-300", text: "text-sky-700" },
  { value: "blue", label: "蓝", bg: "bg-blue-200/40", border: "border-blue-300", text: "text-blue-700" },
  { value: "indigo", label: "靛蓝", bg: "bg-indigo-200/40", border: "border-indigo-300", text: "text-indigo-700" },
  { value: "purple", label: "紫", bg: "bg-purple-200/40", border: "border-purple-300", text: "text-purple-700" },
  { value: "pink", label: "粉", bg: "bg-pink-200/40", border: "border-pink-300", text: "text-pink-700" },
  { value: "rose", label: "玫红", bg: "bg-rose-200/40", border: "border-rose-300", text: "text-rose-700" },
];

const PERIOD_ICONS: Record<string, string> = {
  "疗休养": "🏖️", "外出": "🚗", "旅游": "✈️", "探亲": "👨‍👩‍👧",
  "生病": "🤒", "考试": "📝", "比赛": "🏆", "培训": "📚",
};

const QUICK_COMMENTS = [
  "真棒！妈妈看到了你的努力，继续保持！",
  "完成得很好，注意休息，别太累哦。",
  "思路清晰，字写得也很工整。",
  "这次比昨天进步了，继续加油！",
  "专注的时间越来越长了，真不错。",
  "好记性不如烂笔头，用心了。",
  "这么快就完成了？很棒！不过要保证质量哦。",
  "妈妈为你骄傲，再接再厉！",
];

function guessPeriodIcon(name: string): string {
  for (const [keyword, icon] of Object.entries(PERIOD_ICONS)) {
    if (name.includes(keyword)) return icon;
  }
  return "📌";
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── 自定义下拉框 ──
function VacationSelect({
  vacations, value, onChange,
}: {
  vacations: any[]; value: number | null; onChange: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const selected = vacations.find((v: any) => v.id === value);

  return (
    <div ref={ref} className="relative w-full max-w-xs">
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 bg-card-cream border border-border-warm rounded-lg px-3 py-2 text-sm text-text-main hover:border-caramel/40 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Umbrella className="w-4 h-4 text-caramel flex-shrink-0" />
          {selected ? <span className="truncate font-medium">{selected.name}</span> : <span className="text-text-light">选择假期</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-text-light transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card-cream border border-border-warm rounded-lg shadow-lg overflow-hidden">
          {vacations.map((vac: any) => {
            const isSel = vac.id === value;
            return (
              <button key={vac.id} type="button" onClick={() => { onChange(vac.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                  isSel ? "bg-caramel/10 text-caramel font-medium" : "text-text-secondary hover:bg-bg-warm"
                }`}
              >
                <span className="flex-1 min-w-0 truncate">{vac.name}</span>
                <span className="text-[10px] text-text-light whitespace-nowrap">
                  {new Date(vac.startDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                  -{new Date(vac.endDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                </span>
                {isSel && <Check className="w-3.5 h-3.5 text-caramel flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PlannerPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [selectedVacationId, setSelectedVacationId] = useState<number | null>(null);
  const [vacationDialogOpen, setVacationDialogOpen] = useState(false);
  const [copySheetOpen, setCopySheetOpen] = useState(false);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);
  const [editingVacation, setEditingVacation] = useState<any>(null);
  const [editingPeriod, setEditingPeriod] = useState<any>(null);
  const [vacationForm, setVacationForm] = useState({ name: "", startDate: "", endDate: "" });
  const [periodForm, setPeriodForm] = useState({ name: "", startDate: "", endDate: "", color: "blue", note: "" });
  const [copyTargets, setCopyTargets] = useState<number[]>([]);
  const [selectedCopyTaskIds, setSelectedCopyTaskIds] = useState<number[]>([]);

  // ── 内联编辑状态 ──
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", category: "SCHOOLWORK", estimatedTime: 30 });

  // ── 新任务快速添加状态 ──
  const [quickTitle, setQuickTitle] = useState("");
  const [quickCategory, setQuickCategory] = useState("SCHOOLWORK");
  const [quickEstTime, setQuickEstTime] = useState(30);
  const [quickBookId, setQuickBookId] = useState<number | null>(null);

  // ── 书籍列表（阅读任务用） ──
  const { data: books } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const r = await fetch("/api/books");
      return r.ok ? r.json() : [];
    },
  });

  // ── 拖拽状态 ──
  const [dragTaskId, setDragTaskId] = useState<number | null>(null);
  const [dropTargetDay, setDropTargetDay] = useState<number | null>(null);

  // ── 悬浮卡状态 ──
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── 评价/打分状态 ──
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradingTask, setGradingTask] = useState<any>(null);
  const [parentComment, setParentComment] = useState("");
  const [points, setPoints] = useState(3);

  // ── 工作台数据 ──
  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const r = await fetch("/api/dashboard");
      if (!r.ok) return {};
      return r.json();
    },
  });

  const { data: pendingTasks } = useQuery({
    queryKey: ["tasks", "pending"],
    queryFn: async () => {
      const r = await fetch("/api/tasks?status=PENDING_REVIEW");
      return r.ok ? r.json() : [];
    },
  });

  const { data: pendingReading } = useQuery({
    queryKey: ["reading", "pending"],
    queryFn: async () => {
      const r = await fetch("/api/reading");
      if (!r.ok) return [];
      return (await r.json()).filter((l: any) => l.status === "PENDING_REVIEW");
    },
  });

  const focusHours = dashboard?.todayFocus?.toFixed(1) || "0.0";
  const totalTasks = dashboard?.totalTasks || 0;
  const completedTasks = dashboard?.completedTasks || 0;
  const pendingCount = dashboard?.pendingReview || 0;

  // ── 从 API 获取任务类别（支持在设置页动态编辑） ──
  const { data: apiCategories } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const r = await fetch("/api/admin/categories");
      return r.ok ? r.json() : null;
    },
    staleTime: 30000,
  });

  const categories = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      return apiCategories.map((c: any) => ({
        value: c.value,
        label: c.label,
        color: CAT_COLOR_MAP[c.color]?.badge || "bg-stone-100 text-stone-600 border-stone-200",
      }));
    }
    return [
      { value: "SCHOOLWORK", label: "校内作业", color: "bg-orange-50/80 text-orange-600 border-orange-200" },
      { value: "PREVIEW", label: "新课预习", color: "bg-amber-50/80 text-amber-700 border-amber-200" },
      { value: "EXERCISE", label: "教辅练习", color: "bg-emerald-50/80 text-emerald-600 border-emerald-200" },
      { value: "READING", label: "阅读", color: "bg-teal-50/80 text-teal-600 border-teal-200" },
    ];
  }, [apiCategories]);

  const shortCatLabels = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((c: any) => {
      map[c.value] = c.label.length > 2 ? c.label.slice(0, 2) : c.label;
    });
    return map;
  }, [categories]);

  const catPillColors = useMemo(() => {
    const map: Record<string, string> = {};
    if (apiCategories && apiCategories.length > 0) {
      apiCategories.forEach((c: any) => {
        map[c.value] = CAT_COLOR_MAP[c.color]?.pill || "bg-stone-100 text-stone-500 border-stone-200";
      });
    } else {
      map["SCHOOLWORK"] = "bg-orange-50/60 text-orange-600/80 border-orange-200/60";
      map["PREVIEW"] = "bg-amber-50/60 text-amber-700/80 border-amber-200/60";
      map["EXERCISE"] = "bg-emerald-50/60 text-emerald-600/80 border-emerald-200/60";
      map["READING"] = "bg-teal-50/60 text-teal-600/80 border-teal-200/60";
    }
    return map;
  }, [apiCategories]);

  const allPending = [
    ...(pendingTasks || []).map((t: any) => ({
      ...t,
      reviewType: "task",
      categoryLabel: categories.find((c: any) => c.value === t.category)?.label || t.category,
    })),
    ...(pendingReading || []).map((l: any) => ({
      ...l,
      reviewType: "reading",
      title: `📖 ${l.book?.title || "阅读"} - 读后感`,
      studentNote: l.thoughts,
      excerpts: l.excerpts,
    })),
  ];

  const handleCellMouseEnter = (day: number, e: React.MouseEvent) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    hoverTimer.current = setTimeout(() => {
      setHoveredDay(day);
      setHoveredRect(rect);
    }, 200);
  };

  const handleCellMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setHoveredDay(null);
      setHoveredRect(null);
    }, 100);
  };

  const handleCardMouseEnter = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
  };

  const handleCardMouseLeave = () => {
    setHoveredDay(null);
    setHoveredRect(null);
  };

  // ── 数据请求 ──
  const { data: vacations, isLoading: vacLoading } = useQuery({
    queryKey: ["vacations"],
    queryFn: async () => { const r = await fetch("/api/vacation"); return r.json(); },
  });

  const firstVacationId = vacations?.[0]?.id || null;
  const activeVacationId = selectedVacationId || firstVacationId;
  const activeVacation = useMemo(() => vacations?.find((v: any) => v.id === activeVacationId), [vacations, activeVacationId]);

  const { data: specialPeriods } = useQuery({
    queryKey: ["special-periods", activeVacationId],
    queryFn: async () => {
      if (!activeVacationId) return [];
      const r = await fetch(`/api/special-periods?vacationId=${activeVacationId}`);
      return r.ok ? r.json() : [];
    },
    enabled: !!activeVacationId,
  });

  const selectedDate = selectedDay ? formatDate(currentYear, currentMonth, selectedDay) : null;
  const { data: dayTasks } = useQuery({
    queryKey: ["day-tasks", selectedDate, activeVacationId],
    queryFn: async () => {
      if (!selectedDate) return [];
      const r = await fetch(`/api/tasks?date=${selectedDate}&vacationId=${activeVacationId}`);
      return r.ok ? r.json() : [];
    },
    enabled: !!selectedDate && !!activeVacationId,
  });

  const { daysInMonth, firstDay } = useMemo(() => {
    const d = new Date(currentYear, currentMonth + 1, 0).getDate();
    const f = new Date(currentYear, currentMonth, 1).getDay();
    return { daysInMonth: d, firstDay: f };
  }, [currentYear, currentMonth]);

  const todayDate = today.getDate();

  const { data: monthTasks } = useQuery({
    queryKey: ["month-tasks", currentYear, currentMonth, activeVacationId],
    queryFn: async () => {
      const ms = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
      const r = await fetch(`/api/tasks?month=${ms}&vacationId=${activeVacationId}`);
      return r.ok ? r.json() : [];
    },
    enabled: !!activeVacationId,
  });

  const tasksByDate = useMemo(() => {
    const map = new Map<string, { total: number; completed: number }>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      const e = map.get(dk) || { total: 0, completed: 0 };
      e.total++;
      if (t.status === "GRADED" || t.status === "PENDING_REVIEW") e.completed++;
      map.set(dk, e);
    });
    return map;
  }, [monthTasks]);

  const pendingCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      if (t.status === "TODO") map.set(dk, (map.get(dk) || 0) + 1);
    });
    return map;
  }, [monthTasks]);

  const ipCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      if (t.status === "IN_PROGRESS") map.set(dk, (map.get(dk) || 0) + 1);
    });
    return map;
  }, [monthTasks]);

  const prCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      if (t.status === "PENDING_REVIEW") map.set(dk, (map.get(dk) || 0) + 1);
    });
    return map;
  }, [monthTasks]);

  const doneCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      if (t.status === "DONE") map.set(dk, (map.get(dk) || 0) + 1);
    });
    return map;
  }, [monthTasks]);

  const gradedCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      if (t.status === "GRADED") map.set(dk, (map.get(dk) || 0) + 1);
    });
    return map;
  }, [monthTasks]);

  const focusTimeByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk || !t.spentTime) return;
      map.set(dk, (map.get(dk) || 0) + t.spentTime);
    });
    return map;
  }, [monthTasks]);

  const categoryCountByDate = useMemo(() => {
    const map = new Map<string, Array<{ value: string; label: string; count: number; shortLabel: string; pillColor: string }>>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk || !t.category) return;
      if (!map.has(dk)) map.set(dk, []);
      const cats = map.get(dk)!;
      const existing = cats.find(c => c.value === t.category);
      if (existing) existing.count++;
      else {
        cats.push({
          value: t.category,
          label: categories.find((c: any) => c.value === t.category)?.label || t.category,
          count: 1,
          shortLabel: shortCatLabels[t.category] || t.category.slice(0, 2),
          pillColor: catPillColors[t.category] || "bg-gray-100 text-gray-500 border-gray-200",
        });
      }
    });
    return map;
  }, [monthTasks]);

  const hoveredTasks = useMemo(() => {
    if (hoveredDay === null) return [];
    const dk = formatDate(currentYear, currentMonth, hoveredDay);
    return (monthTasks || []).filter((t: any) => {
      const td = t.date?.split("T")[0];
      return td === dk;
    }).sort((a: any, b: any) => {
      const order = ["TODO", "IN_PROGRESS", "PENDING_REVIEW", "GRADED"];
      return order.indexOf(a.status) - order.indexOf(b.status);
    });
  }, [hoveredDay, currentYear, currentMonth, monthTasks]);

  // ── 特殊时段匹配 ──
  function isInPeriod(dateKey: string, period: any) {
    const d = new Date(dateKey);
    const s = new Date(period.startDate?.split("T")[0] || period.startDate);
    const e = new Date(period.endDate?.split("T")[0] || period.endDate);
    return d >= s && d <= e;
  }
  function isInVacation(dateKey: string) {
    if (!activeVacation) return false;
    const d = new Date(dateKey);
    const s = new Date(activeVacation.startDate?.split("T")[0] || activeVacation.startDate);
    const e = new Date(activeVacation.endDate?.split("T")[0] || activeVacation.endDate);
    return d >= s && d <= e;
  }

  const periodMap = useMemo(() => {
    const map = new Map<string, typeof specialPeriods>();
    if (!specialPeriods) return map;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = formatDate(currentYear, currentMonth, d);
      const matches = specialPeriods.filter((p: any) => isInPeriod(key, p));
      if (matches.length > 0) map.set(key, matches);
    }
    return map;
  }, [specialPeriods, currentYear, currentMonth, daysInMonth]);

  const jumpToVacation = useCallback((v: any) => {
    if (!v) return;
    const d = new Date(v.startDate);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  }, []);

  // ── Mutation ──
  const createTask = useMutation({
    mutationFn: async (data: { title: string; category: string; estimatedTime?: number; bookId?: number | null; bookTitle?: string | null }) => {
      const date = selectedDate || formatDate(currentYear, currentMonth, today.getDate());
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacationId: activeVacationId || 1, date, ...data }),
      });
      if (!r.ok) throw new Error("创建失败");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setQuickTitle("");
	      setQuickBookId(null);
	      setQuickEstTime(30);
      toast.success("任务已创建", "新的任务已经安排上啦，加油哦 💪");
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ taskId, data }: { taskId: number; data: any }) => {
      const r = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "UPDATE", ...data }),
      });
      if (!r.ok) throw new Error("更新失败");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setEditingTaskId(null);
      toast.success("任务已更新", "安排已调整，继续前进吧 🌟");
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (taskId: number) => {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("任务已删除", "已从计划中移除 🍃");
    },
  });

  const copyTasks = useMutation({
    mutationFn: async () => {
      if (!selectedDay || !dayTasks || copyTargets.length === 0) return;
      const tasksToCopy = selectedCopyTaskIds.length > 0
        ? dayTasks.filter((t: any) => selectedCopyTaskIds.includes(t.id))
        : dayTasks;
      if (tasksToCopy.length === 0) return;
      for (const td of copyTargets) {
        const date = formatDate(currentYear, currentMonth, td);
        for (const task of tasksToCopy) {
          await fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vacationId: activeVacationId || 1,
              date,
              title: task.title,
              category: task.category,
              estimatedTime: task.estimatedTime,
                bookId: task.bookId || null,
                bookTitle: task.bookTitle || null,
            }),
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["month-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      setCopySheetOpen(false);
      setCopyTargets([]);
      setSelectedCopyTaskIds([]);
      toast.success("任务已复制", `已复制到 ${copyTargets.length} 天，完成它们吧 ✨`);
    },
  });

  const saveVacation = useMutation({
    mutationFn: async () => {
      if (editingVacation) {
        const r = await fetch(`/api/vacation/${editingVacation.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vacationForm),
        });
        if (!r.ok) throw new Error("更新失败");
        return r.json();
      }
      const r = await fetch("/api/vacation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vacationForm),
      });
      if (!r.ok) throw new Error("创建失败");
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["vacations"] });
      if (!editingVacation && data?.id) { setSelectedVacationId(data.id); jumpToVacation(data); }
      setVacationDialogOpen(false);
      setEditingVacation(null);
      setVacationForm({ name: "", startDate: "", endDate: "" });
      toast.success(editingVacation ? "假期已更新" : "假期已创建", editingVacation ? "时间调整好了哦 📅" : "新的假期开始啦，一起规划吧 ☀️");
    },
  });

  const savePeriod = useMutation({
    mutationFn: async () => {
      if (editingPeriod) {
        const r = await fetch(`/api/special-periods/${editingPeriod.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(periodForm),
        });
        if (!r.ok) throw new Error("更新失败");
        return r.json();
      }
      const r = await fetch("/api/special-periods", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...periodForm, vacationId: activeVacationId }),
      });
      if (!r.ok) throw new Error("创建失败");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-periods"] });
      setPeriodDialogOpen(false);
      setEditingPeriod(null);
      setPeriodForm({ name: "", startDate: "", endDate: "", color: "blue", note: "" });
      toast.success(editingPeriod ? "事件已更新" : "事件已添加", "日历上已标注 📌");
    },
  });

  const deletePeriod = useMutation({
    mutationFn: async (periodId: number) => {
      await fetch(`/api/special-periods/${periodId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["special-periods"] });
      toast.success("事件已删除", "已移除该标注 🗑️");
    },
  });

  const deleteVacation = useMutation({
    mutationFn: async (vacationId: number) => {
      const r = await fetch(`/api/vacation/${vacationId}`, { method: "DELETE" });
      if (!r.ok) throw new Error("删除失败");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vacations"] });
      setVacationDialogOpen(false);
      setEditingVacation(null);
      setVacationForm({ name: "", startDate: "", endDate: "" });
      const remaining = vacations?.filter((v: any) => v.id !== editingVacation?.id);
      if (remaining && remaining.length > 0) {
        setSelectedVacationId(remaining[0].id);
        jumpToVacation(remaining[0]);
      } else {
        setSelectedVacationId(null);
      }
      toast.success("假期已删除", "已从记录中移除 🍂");
    },
    onError: (err: Error) => { toast.error("删除失败", err.message); },
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ── 评价任务混合（支持 task + reading） ──
  const [isReadingReview, setIsReadingReview] = useState(false);

  const gradeTask = useMutation({
    mutationFn: async () => {
      if (!gradingTask) return;
      if (isReadingReview) {
        const r = await fetch(`/api/reading/${gradingTask.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "grade", parentComment, points }),
        });
        if (!r.ok) { const err = await r.json(); throw new Error(err.error || "评价失败"); }
        return r.json();
      }
      const r = await fetch(`/api/tasks/${gradingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "GRADE", parentComment, points }),
      });
      if (!r.ok) { const err = await r.json(); throw new Error(err.error || "评价失败"); }
      return r.json();
    },
    onSuccess: () => {
      // 乐观更新：从待审核列表中即时移除已评任务
      if (isReadingReview) {
        queryClient.setQueryData(["reading", "pending"], (old: any) =>
          old?.filter((l: any) => l.id !== gradingTask?.id) || []
        );
      } else {
        queryClient.setQueryData(["tasks", "pending"], (old: any) =>
          old?.filter((t: any) => t.id !== gradingTask?.id) || []
        );
      }
      // 乐观更新：在月历缓存中将该任务状态改为 GRADED
      queryClient.setQueryData(["month-tasks", currentYear, currentMonth, activeVacationId], (old: any) =>
        old?.map((t: any) => t.id === gradingTask?.id ? { ...t, status: "GRADED" } : t) || []
      );
      // 后台刷新确认
      queryClient.invalidateQueries({ queryKey: ["month-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["reading", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setGradeDialogOpen(false);
      setGradingTask(null);
      setParentComment("");
      setPoints(3);
      toast.success("评价已提交", "孩子收到你的鼓励一定会很开心 🎉");
    },
    onError: (err: Error) => { toast.error("评价失败", err.message); },
  });

  const openGradeDialog = (item: any) => {
    setGradingTask(item);
    setIsReadingReview(item.reviewType === "reading");
    setParentComment("");
    setPoints(3);
    setGradeDialogOpen(true);
  };

  // ── 拖拽处理 ──
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    setDragTaskId(taskId);
    e.dataTransfer.effectAllowed = e.ctrlKey || e.metaKey ? "copy" : "move";
    e.dataTransfer.setData("text/plain", String(taskId));
  };

  const handleDragOver = (e: React.DragEvent, day: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (e.ctrlKey || e.metaKey) e.dataTransfer.dropEffect = "copy";
    setDropTargetDay(day);
  };

  const handleDragLeave = () => {
    setDropTargetDay(null);
  };

  const handleDrop = async (e: React.DragEvent, targetDay: number) => {
    e.preventDefault();
    setDropTargetDay(null);
    const taskId = parseInt(e.dataTransfer.getData("text/plain"));
    if (!taskId || targetDay === selectedDay) { setDragTaskId(null); return; }

    const isCopy = e.ctrlKey || e.metaKey;
    const targetDate = formatDate(currentYear, currentMonth, targetDay);

    if (isCopy) {
      const task = monthTasks?.find((t: any) => t.id === taskId);
      if (task) {
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vacationId: activeVacationId || 1,
            date: targetDate,
            title: task.title,
            category: task.category,
            estimatedTime: task.estimatedTime,
                bookId: task.bookId || null,
                bookTitle: task.bookTitle || null,
          }),
        });
        queryClient.invalidateQueries({ queryKey: ["month-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["day-tasks"] });
      }
    } else {
      await updateTask.mutateAsync({ taskId, data: { date: targetDate } });
    }
    setDragTaskId(null);
  };

  const handleDragEnd = () => {
    setDragTaskId(null);
    setDropTargetDay(null);
  };

  // ── 事件处理 ──
  const prevMonth = useCallback(() => {
    if (currentMonth === 0) { setCurrentYear(y => y - 1); setCurrentMonth(11); }
    else setCurrentMonth(m => m - 1);
    setSelectedDay(null);
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    if (currentMonth === 11) { setCurrentYear(y => y + 1); setCurrentMonth(0); }
    else setCurrentMonth(m => m + 1);
    setSelectedDay(null);
  }, [currentMonth]);

  const fillWeekdays = (weekday: number) => {
    const targets: number[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(currentYear, currentMonth, d).getDay() === weekday && d !== selectedDay) targets.push(d);
    }
    setCopyTargets(targets);
    setCopySheetOpen(true);
  };

  const startEdit = (task: any) => {
    setEditingTaskId(task.id);
    setEditForm({ title: task.title, category: task.category, estimatedTime: task.estimatedTime || 30 });
  };

  const cancelEdit = () => {
    setEditingTaskId(null);
  };

  const saveEdit = () => {
    if (!editingTaskId || !editForm.title.trim()) return;
    updateTask.mutate({ taskId: editingTaskId, data: editForm });
  };

  return (
    <div className="max-w-7xl mx-auto page-enter space-y-4">
      {/* ═══ 顶部标题栏 + 假期选择器 ═══ */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-warm">
        <div>
          <h1 className="text-base font-bold text-coffee font-serif">陪伴看板</h1>
          <p className="text-xs text-text-light mt-0.5">安排日程，查阅待审核，陪伴成长。</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-xs border-border-warm text-text-secondary h-8" disabled={!activeVacationId}
            onClick={() => { setEditingPeriod(null); setPeriodForm({ name: "", startDate: "", endDate: "", color: "blue", note: "" }); setPeriodDialogOpen(true); }}>
            <MapPin className="w-3.5 h-3.5 mr-1" />事件设置
          </Button>
          <Button variant="outline" className="text-xs border-border-warm text-text-secondary h-8"
            onClick={() => { setEditingVacation(null); setVacationForm({ name: "", startDate: "", endDate: "" }); setVacationDialogOpen(true); }}>
            <Umbrella className="w-3.5 h-3.5 mr-1" />新建假期
          </Button>
        </div>
      </header>

      {/* ═══ 数据概览行（StatsCards，来自工作台） ═══ */}
      <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={listItem}>
          <StatsCard icon={<Clock className="w-full h-full" />} label="专注时长" value={focusHours} unit="h" accentColor="caramel" />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard icon={<Target className="w-full h-full" />} label="任务完成" value={`${completedTasks}`} unit={`/ ${totalTasks}`} accentColor="coffee" />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard icon={<ClipboardList className="w-full h-full" />} label="待办审核" value={pendingCount} unit="项" accentColor="ribbon" />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard icon={<MessageSquare className="w-full h-full" />} label="待回复" value={allPending.length} unit="项" accentColor="sage" />
        </motion.div>
      </motion.div>

      {/* ═══ 假期选择器 ═══ */}
      {vacLoading ? (
        <div className="skeleton h-14 rounded-xl" />
      ) : vacations && vacations.length > 0 ? (
        <div className="bg-card-cream border border-border-warm rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <VacationSelect vacations={vacations} value={activeVacationId}
              onChange={(id) => { setSelectedVacationId(id); const v = vacations?.find((x: any) => x.id === id); if (v) jumpToVacation(v); }}
            />
            {activeVacation && (
              <>
                <div className="hidden sm:block w-px h-6 bg-border-warm" />
                <div className="flex items-center gap-3 text-xs text-text-light">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {new Date(activeVacation.startDate).toLocaleDateString("zh-CN")} → {new Date(activeVacation.endDate).toLocaleDateString("zh-CN")}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-caramel animate-sync-pulse" />进行中
                  </span>
                </div>
                <div className="sm:ml-auto flex items-center gap-1">
                  <button onClick={() => { setEditingVacation(activeVacation); setVacationForm({ name: activeVacation.name, startDate: activeVacation.startDate?.split("T")[0] || activeVacation.startDate, endDate: activeVacation.endDate?.split("T")[0] || activeVacation.endDate }); setVacationDialogOpen(true); }}
                    className="text-[10px] text-text-light hover:text-caramel px-2 py-1 rounded hover:bg-bg-warm transition-colors flex items-center gap-1">
                    <Pencil className="w-3 h-3" />编辑
                  </button>
                  <button onClick={() => jumpToVacation(activeVacation)}
                    className="text-[10px] text-text-light hover:text-caramel px-2 py-1 rounded hover:bg-bg-warm transition-colors" title="跳转到假期开始月份">
                    <CalendarDays className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 flex items-center gap-2">
          <Umbrella className="w-4 h-4 flex-shrink-0" />
          还没有创建假期，点击「新建假期」开始规划
        </div>
      )}

      {/* ═══ 特殊时段标签 ═══ */}
      {specialPeriods && specialPeriods.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {specialPeriods.map((p: any) => {
            const c = PERIOD_COLORS.find(x => x.value === p.color) || PERIOD_COLORS[0];
            return (
              <div key={p.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] ${c.bg} ${c.border} ${c.text} border`}>
                <span>{guessPeriodIcon(p.name)}</span>
                <span>{p.name}</span>
                <span className="opacity-60">
                  {new Date(p.startDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                  -{new Date(p.endDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                </span>
                <button onClick={() => { setEditingPeriod(p); setPeriodForm({ name: p.name, startDate: p.startDate?.split("T")[0] || p.startDate, endDate: p.endDate?.split("T")[0] || p.endDate, color: p.color || "blue", note: p.note || "" }); setPeriodDialogOpen(true); }}
                  className="ml-0.5 p-0.5 rounded hover:bg-black/10"><Pencil className="w-2.5 h-2.5" /></button>
                <button onClick={() => deletePeriod.mutate(p.id)} className="p-0.5 rounded hover:bg-black/10"><Trash2 className="w-2.5 h-2.5" /></button>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ 主体：月历 + 右侧栏 ═══ */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_18rem] gap-4">
        {/* ── 左列：月历 → 任务详情 ── */}
        <div className="space-y-4">
          {/* 月历 */}
          <div className="bg-card-cream border border-border-warm rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="p-1.5 hover:bg-bg-warm rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-text-secondary" />
              </button>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-coffee font-serif">
                  {currentYear}年{currentMonth + 1}月
                </h2>
                <button onClick={() => { setCurrentYear(today.getFullYear()); setCurrentMonth(today.getMonth()); setSelectedDay(today.getDate()); }}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20 border border-caramel/20 transition-colors">
                  回到今天
                </button>
              </div>
              <button onClick={nextMonth} className="p-1.5 hover:bg-bg-warm rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-text-secondary" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-px mb-px">
              {DAYS_OF_WEEK.map(d => (
                <div key={d} className="text-center text-[10px] text-text-light py-1 border-b border-border-warm">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateKey = formatDate(currentYear, currentMonth, day);
                const stats = tasksByDate.get(dateKey);
                const isTd = day === todayDate && currentMonth === today.getMonth() && currentYear === today.getFullYear();
                const isSel = day === selectedDay;
                const inVac = activeVacation ? isInVacation(dateKey) : false;
                const dayPeriods = periodMap.get(dateKey) || [];
                const isDropTarget = dropTargetDay === day;

                let bg = "bg-white", tx = "text-text-secondary", bo = "";
                if (isSel) { bg = "bg-caramel/5"; tx = "text-text-secondary"; }
                else if (isTd) { bg = "bg-sage-light"; bo = "border border-lime-300"; }
                else if (dayPeriods.length > 0) {
                  const ci = PERIOD_COLORS.find(x => x.value === dayPeriods[0].color) || PERIOD_COLORS[0];
                  bg = ci.bg; tx = ci.text; bo = `border ${ci.border}`;
                } else if (inVac) { bg = "bg-caramel/5"; bo = "border border-caramel/10"; }

                if (isDropTarget) bo = "border-2 border-caramel shadow-sm";

                const pc = pendingCountByDate.get(dateKey) || 0;
                const ic = ipCountByDate.get(dateKey) || 0;
                const rc = prCountByDate.get(dateKey) || 0;
                const dc = doneCountByDate.get(dateKey) || 0;
                const gc = gradedCountByDate.get(dateKey) || 0;
                const ft = focusTimeByDate.get(dateKey) || 0;

                return (
                  <div key={day}
                    onMouseEnter={(e) => handleCellMouseEnter(day, e)}
                    onMouseLeave={handleCellMouseLeave}
                    onClick={() => setSelectedDay(isSel ? null : day)}
                    onDragOver={(e) => handleDragOver(e, day)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day)}
                    className={`h-24 rounded px-2 py-1.5 cursor-pointer transition-all duration-150 relative flex flex-col ${bg} ${bo} ${
                      isSel ? "shadow-sm border-2 border-caramel" : "hover:border-caramel-light hover:bg-card-cream"
                    }`}
                    style={bo ? { borderWidth: isDropTarget ? 2 : 1, borderStyle: "solid" } : {}}
                  >
                    {/* 上半：日期 + 耗时 + 特殊时段标记 */}
                    <div className="flex items-start justify-between gap-0.5 shrink-0">
                      <span className={`text-base font-bold leading-tight ${tx}`}>{day}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {ft > 0 && (
                          <span className="flex items-center gap-0.5 text-[8px] text-stone-400">
                            <Clock className="w-2 h-2" />{Math.round(ft / 60)}m
                          </span>
                        )}
                        {dayPeriods.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded leading-none shrink-0 bg-white/50 text-gray-600 border border-gray-200/50" title={dayPeriods.map((p: any) => p.name).join(", ")}>
                            {guessPeriodIcon(dayPeriods[0].name)}
                            {dayPeriods.length <= 2 && <span className="max-w-[3rem] truncate">{dayPeriods[0].name}</span>}
                            {dayPeriods.length > 2 && <span>+{dayPeriods.length}</span>}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 中段：任务类别药丸 */}
                    {(() => {
                      const cCounts = categoryCountByDate.get(dateKey) || [];
                      if (cCounts.length === 0) return null;
                      return (
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap shrink-0">
                          {cCounts.map((cc: any) => (
                            <span key={cc.value} className={`text-[8px] leading-none px-1 py-[1px] rounded border whitespace-nowrap ${cc.pillColor}`}>
                              {cc.shortLabel}×{cc.count}
                            </span>
                          ))}
                        </div>
                      );
                    })()}

                    {/* 中下：状态统计 */}
                    {(pc + ic + dc + rc + gc) > 0 && (
                      <div className="flex items-center gap-1.5 mt-auto pt-0.5 shrink-0 flex-wrap">
                        {pc > 0 && <span className="text-[8px] text-gray-500">待{pc}</span>}
                        {ic > 0 && <span className="text-[8px] text-blue-600">进{ic}</span>}
                        {dc > 0 && <span className="text-[8px] text-lime-600">完{dc}</span>}
                        {rc > 0 && <span className="text-[8px] text-amber-600">评{rc}</span>}
                        {gc > 0 && <span className="text-[8px] text-emerald-600">✓{gc}</span>}
                      </div>
                    )}

                    {/* 底部：进度条 */}
                    {stats && (
                      <div className="mt-auto pt-0.5 shrink-0">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1 rounded-full bg-bg-warm overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${stats.completed >= stats.total ? "bg-sage/70" : "bg-caramel/60"}`}
                              style={{ width: `${(stats.completed / Math.max(stats.total, 1)) * 100}%` }} />
                          </div>
                          <span className={`text-[8px] font-medium leading-none whitespace-nowrap ${stats.completed >= stats.total ? "text-sage/80" : "text-caramel/80"}`}>
                            {stats.completed}/{stats.total}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 悬浮任务卡 */}
          {hoveredDay !== null && hoveredRect && hoveredTasks.length > 0 && (() => {
            const cardW = 288;
            const cardH = Math.min(hoveredTasks.length * 52 + 56, 360);
            let left = Math.min(hoveredRect.left, window.innerWidth - cardW - 8);
            if (left < 8) left = 8;
            let top = hoveredRect.bottom + 6;
            if (top + cardH > window.innerHeight - 8) {
              top = Math.max(8, hoveredRect.top - cardH - 6);
            }
            return (
              <div onMouseEnter={handleCardMouseEnter} onMouseLeave={handleCardMouseLeave}
                className="fixed z-50 bg-card-cream border border-border-warm rounded-xl shadow-xl p-3 overflow-y-auto"
                style={{ width: cardW, maxHeight: Math.min(cardH, 320), top, left }}>
                <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-border-warm">
                  <CalendarDays className="w-3.5 h-3.5 text-caramel shrink-0" />
                  <span className="text-xs font-medium text-coffee font-serif">{currentYear}年{currentMonth + 1}月{hoveredDay}日</span>
                  <span className="text-[10px] text-text-light ml-auto shrink-0">{hoveredTasks.length}项</span>
                </div>
                <div className="space-y-1">
                  {hoveredTasks.map((task: any) => {
                    const catColor = categories.find((c: any) => c.value === task.category)?.color || "bg-gray-50 text-gray-500";
                    return (
                      <div key={task.id} className="py-1.5 px-1 rounded hover:bg-bg-warm/50 transition-colors group">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] px-1 py-[1px] rounded border whitespace-nowrap shrink-0 ${catColor}`}>
                            {categories.find((c: any) => c.value === task.category)?.label || task.category}
                          </span>
                          <span className={`text-xs flex-1 min-w-0 truncate ${task.status === "GRADED" ? "line-through text-text-light" : "text-text-main"}`}>
                            {task.title}
                          </span>
                          {task.status === "PENDING_REVIEW" ? (
                            <button onClick={(e) => { e.stopPropagation(); openGradeDialog({ ...task, reviewType: "task" }); }}
                              className="text-[9px] px-1.5 py-[1px] rounded bg-caramel/10 text-caramel font-medium hover:bg-caramel/20 transition-colors shrink-0 opacity-0 group-hover:opacity-100">评价</button>
                          ) : (
                            <span className={`text-[9px] px-1 py-[1px] rounded-full whitespace-nowrap shrink-0 ${
                              task.status === "TODO" ? "bg-gray-100 text-gray-400" :
                              task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" :
                              task.status === "DONE" ? "bg-lime-100 text-lime-600" :
                              task.status === "PENDING_REVIEW" ? "bg-amber-50 text-amber-600" :
                              task.status === "GRADED" ? "bg-emerald-50/60 text-emerald-600" : "bg-gray-100 text-gray-400"
                            }`}>
                              {task.status === "TODO" ? "待开始" : task.status === "IN_PROGRESS" ? "进行中" : task.status === "DONE" ? "已完成" : task.status === "PENDING_REVIEW" ? "待评价" : task.status === "GRADED" ? "已评价" : task.status}
                            </span>
                          )}
                        </div>
                        {/* 任务用时 */}
                        <div className="flex items-center gap-2 mt-1 ml-1">
                          {task.estimatedTime && (
                            <span className="text-[9px] text-text-light flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />预估 {task.estimatedTime} 分钟
                            </span>
                          )}
                          {task.spentTime && (
                            <span className="text-[9px] text-sage/70 flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />实际 {Math.round(task.spentTime / 60)} 分钟
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* 拖拽操作提示 */}
          <div className="text-[10px] text-text-light flex items-center gap-3 px-1">
            <span className="inline-flex items-center gap-1"><GripVertical className="w-3 h-3" /> 拖拽任务到日历日期可移动</span>
            <span className="inline-flex items-center gap-1"><span className="text-xs font-mono">⌘</span> / <span className="text-xs font-mono">Ctrl</span> + 拖拽可复制</span>
          </div>

          {/* ── 选中日期的任务详情 ── */}
          {selectedDay && (
            <div className="bg-card-cream border border-border-warm rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-coffee font-serif flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-caramel" />
                  {currentYear}年{currentMonth + 1}月{selectedDay}日 的安排
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="text-xs border-border-warm text-text-secondary h-7"
                    onClick={() => {
                      if (selectedCopyTaskIds.length === 0) {
                        toast.info("请先勾选任务", "在下方任务列表中勾选要复制的一条或多条任务");
                        return;
                      }
                      setCopyTargets([]);
                      setCopySheetOpen(true);
                    }}>
                    <SquareStack className="w-3 h-3 mr-1" />复制到其他天
                    {selectedCopyTaskIds.length > 0 && (
                      <span className="ml-1 text-[9px] bg-caramel/15 text-caramel px-1 rounded-full">{selectedCopyTaskIds.length}</span>
                    )}
                  </Button>
                </div>
              </div>

              {(() => {
                const dateKey = formatDate(currentYear, currentMonth, selectedDay);
                const dp = periodMap.get(dateKey);
                if (dp && dp.length > 0) {
                  const pi = PERIOD_COLORS.find(x => x.value === dp[0].color) || PERIOD_COLORS[0];
                  return (
                    <div className={`${pi.bg} border ${pi.border} rounded-lg p-2 mb-3 flex items-center gap-1.5 text-xs ${pi.text}`}>
                      <span>{guessPeriodIcon(dp[0].name)}</span>
                      <span className="font-medium">{dp[0].name}</span>
                      {dp[0].note && <span className="opacity-70"> — {dp[0].note}</span>}
                    </div>
                  );
                }
                return null;
              })()}

              {dayTasks && dayTasks.length > 0 && (
                <div className="flex items-center gap-1.5 mb-2 pl-0.5">
                  <button onClick={() => {
                    setSelectedCopyTaskIds(prev =>
                      prev.length === dayTasks.length ? [] : dayTasks.map((t: any) => t.id)
                    );
                  }} className={
                    `w-4 h-4 rounded border flex items-center justify-center transition-colors hover:border-caramel/60 flex-shrink-0 cursor-pointer ${
                      selectedCopyTaskIds.length === dayTasks.length ? "bg-caramel/20 border-caramel/30" : "border-border-warm"
                    }`
                  }>
                    {selectedCopyTaskIds.length === dayTasks.length && <Check className="w-2.5 h-2.5 text-caramel" />}
                  </button>
                  <span className="text-[9px] text-text-light select-none">{selectedCopyTaskIds.length > 0 ? `已选 ${selectedCopyTaskIds.length} 项` : "全选"}</span>
                </div>
              )}

              <div className="space-y-1.5 mb-3">
                {(!dayTasks || dayTasks.length === 0) ? (
                  <p className="text-xs text-text-light text-center py-6">当天暂无任务</p>
                ) : (
                  dayTasks.map((task: any) => {
                    const isEditing = editingTaskId === task.id;
                    const catColor = categories.find((c: any) => c.value === task.category)?.color || "bg-gray-50";

                    return (
                      <div key={task.id}
                        draggable={!isEditing}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all ${
                          isEditing
                            ? "border-caramel bg-card-cream shadow-sm"
                            : "border-border-warm bg-bg-warm/40 hover:border-caramel/30"
                        } ${dragTaskId === task.id ? "opacity-50" : ""}`}
                      >
                        {!isEditing && (
                          <>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCopyTaskIds(prev =>
                                prev.includes(task.id) ? prev.filter((id: number) => id !== task.id) : [...prev, task.id]
                              );
                            }}
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                                selectedCopyTaskIds.includes(task.id)
                                  ? "bg-caramel/20 border-caramel/30"
                                  : "border-border-warm hover:border-caramel/40"
                              }`}
                            >
                              {selectedCopyTaskIds.includes(task.id) && <Check className="w-2.5 h-2.5 text-caramel" />}
                            </button>
                            <span className="text-text-light cursor-grab active:cursor-grabbing flex-shrink-0" title="拖拽到其他日期">
                              <GripVertical className="w-3.5 h-3.5" />
                            </span>
                          </>
                        )}

                        {isEditing ? (
                          <>
                            <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                              className="flex-1 h-8 text-sm border-border-warm focus-visible:ring-caramel/30" autoFocus
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                            />
                            <select value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}
                              className="h-8 rounded border border-border-warm bg-white px-1.5 text-[10px] focus:border-caramel/40">
                              {categories.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                            <Input type="number" value={editForm.estimatedTime} onChange={e => setEditForm(p => ({ ...p, estimatedTime: parseInt(e.target.value) || 30 }))}
                              className="w-16 h-8 text-[10px] border-border-warm focus-visible:ring-caramel/30" placeholder="分钟"
                            />
                            <button onClick={saveEdit} disabled={!editForm.title.trim() || updateTask.isPending}
                              className="p-1 text-sage hover:text-lime-600 transition-colors flex-shrink-0">
                              {updateTask.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={cancelEdit} className="p-1 text-text-light hover:text-red-500 transition-colors flex-shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap flex-shrink-0 ${catColor}`}>
                              {categories.find((c: any) => c.value === task.category)?.label || task.category}
                            </span>
                            <span className={`text-sm flex-1 min-w-0 truncate ${task.status === "GRADED" ? "line-through text-text-light" : "text-text-main"}`}>
                              {task.title}
                            </span>
                            <span className="text-[10px] text-text-light whitespace-nowrap flex items-center gap-0.5 flex-shrink-0">
                              <Clock className="w-3 h-3" />预估 {task.estimatedTime} 分钟
                            </span>
                            {task.spentTime && (
                              <span className="text-[10px] text-sage whitespace-nowrap flex-shrink-0">实际 {Math.round(task.spentTime / 60)} 分钟</span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                              task.status === "TODO" ? "bg-gray-100 text-gray-500" :
                              task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" :
                              task.status === "DONE" ? "bg-lime-100 text-lime-600" :
                              task.status === "PENDING_REVIEW" ? "bg-amber-50 text-amber-600" :
                              task.status === "GRADED" ? "bg-emerald-50/60 text-emerald-600" : "bg-gray-100 text-gray-500"
                            }`}>
                              {task.status === "TODO" ? "待开始" : task.status === "IN_PROGRESS" ? "进行中" :
                               task.status === "DONE" ? "已完成" :
                               task.status === "PENDING_REVIEW" ? "待评价" : task.status === "GRADED" ? "已评价" : task.status}
                            </span>
                            {task.status === "PENDING_REVIEW" && (
                              <button onClick={() => openGradeDialog({ ...task, reviewType: "task" })}
                                className="h-7 rounded px-2 bg-caramel/10 text-caramel font-medium text-[10px] hover:bg-caramel/20 transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-0.5">
                                <Star className="w-3 h-3" />评价
                              </button>
                            )}
                            <button onClick={() => startEdit(task)} className="p-1 text-text-light hover:text-caramel transition-colors flex-shrink-0">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteTask.mutate(task.id)} className="p-1 text-text-light hover:text-red-500 transition-colors flex-shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input value={quickTitle} onChange={e => setQuickTitle(e.target.value)}
                    placeholder="输入任务名称，回车添加..."
                    className="flex-1 h-8 border-border-warm text-sm focus-visible:ring-caramel/30"
                    onKeyDown={e => {
                      if (e.key === "Enter" && quickTitle.trim()) {
                        const selBook = quickBookId ? books?.find((b: any) => b.id === quickBookId) : null;
                        createTask.mutate({
                          title: quickTitle.trim(),
                          category: quickCategory,
                          estimatedTime: quickEstTime,
                          bookId: quickBookId,
                          bookTitle: selBook?.title || null,
                        });
                      }
                    }}
                  />
                  <select value={quickCategory} onChange={e => { setQuickCategory(e.target.value); setQuickBookId(null); }}
                    className="h-8 rounded border border-border-warm bg-white px-1.5 text-[10px] focus:border-caramel/40">
                    {categories.map((c: any) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <label className="text-[9px] text-text-light whitespace-nowrap">预估</label>
                    <Input type="number" value={quickEstTime} onChange={e => setQuickEstTime(parseInt(e.target.value) || 30)}
                      className="w-14 h-8 text-[10px] border-border-warm focus-visible:ring-caramel/30 text-center" min={1} />
                    <span className="text-[9px] text-text-light">分钟</span>
                  </div>
                  <Button className="bg-caramel/10 text-caramel font-medium text-xs h-8"
                    onClick={() => {
                      if (quickTitle.trim()) {
                        const selBook = quickBookId ? books?.find((b: any) => b.id === quickBookId) : null;
                        createTask.mutate({
                          title: quickTitle.trim(),
                          category: quickCategory,
                          estimatedTime: quickEstTime,
                          bookId: quickBookId,
                          bookTitle: selBook?.title || null,
                        });
                      }
                    }}
                    disabled={!quickTitle.trim() || createTask.isPending}>
                    {createTask.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  </Button>
                </div>
                {/* 书籍选择（阅读任务时显示） */}
                {quickCategory === "READING" && books && books.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-text-light shrink-0">📖 选择书籍</span>
                    <select value={quickBookId || ""} onChange={e => setQuickBookId(e.target.value ? parseInt(e.target.value) : null)}
                      className="flex-1 h-7 rounded border border-border-warm bg-white px-1.5 text-[10px] focus:border-caramel/40">
                      <option value="">-- 选择书籍 --</option>
                      {books.map((b: any) => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 右列：待审核 + 今日动态（来自工作台） ── */}
        <aside className="space-y-4">
          {/* 待审核队列 */}
          <PaperCard variant="paper" elevation="sm">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-coffee font-serif flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-caramel" />
                  待评价
                </h3>
                {allPending.length > 0 && (
                  <span className="bg-stone-100 text-stone-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{allPending.length}</span>
                )}
              </div>
              {allPending.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage/10 to-green-500/10 flex items-center justify-center mx-auto mb-3 border border-sage/20">
                    <CheckCircle className="w-6 h-6 text-stone-400" />
                  </div>
                  <p className="text-xs text-text-secondary font-serif">已全部评价 🎉</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {allPending.map((item: any) => (
                    <div key={`pending-${item.reviewType}-${item.id}`}
                      className="p-2.5 bg-bg-warm/40 rounded border border-border-warm transition-colors">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openGradeDialog(item)}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <CalendarDays className="w-3 h-3 text-text-light shrink-0" />
                            <span className="text-[10px] text-text-light shrink-0">
                              {new Date(item.date || item.createdAt).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
                            </span>
                            <span className="text-[10px] text-text-light/50">·</span>
                            <span className={`tag text-[9px] ${item.reviewType === "reading" ? "bg-emerald-50/60 text-stone-500" : "bg-amber-50/60 text-stone-500"}`}>
                              {item.reviewType === "reading" ? "阅读" : item.categoryLabel || "任务"}
                            </span>
                          </div>
                          <h4 className="text-xs font-medium text-text-main truncate">{item.title}</h4>
                        </div>
                        <button onClick={() => openGradeDialog(item)}
                          className="shrink-0 h-6 px-2 rounded bg-caramel/10 text-caramel font-medium text-[9px] hover:bg-caramel/20 transition-colors flex items-center gap-0.5 mt-0.5">
                          <Star className="w-2.5 h-2.5" />评价
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PaperCard>
        </aside>
      </div>

      {/* ═══ 复制任务 Sheet ═══ */}
      <Sheet open={copySheetOpen} onOpenChange={setCopySheetOpen}>
        <SheetContent side="right" className="w-[440px] p-6">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-coffee font-serif text-base flex items-center gap-2">
              <SquareStack className="w-4 h-4 text-caramel" />
              复制任务
            </SheetTitle>
            <SheetDescription className="text-xs text-text-secondary">
              将 <strong className="text-text-main">{selectedDay}</strong> 日的 <strong className="text-text-main">{selectedCopyTaskIds.length}</strong> 条任务复制到其他日期
            </SheetDescription>
            {selectedCopyTaskIds.length > 0 && (
              <div className="mt-2 space-y-1 bg-bg-warm/60 rounded-lg p-2 border border-border-warm max-h-24 overflow-y-auto">
                {dayTasks?.filter((t: any) => selectedCopyTaskIds.includes(t.id)).map((t: any) => {
                  const catStyle = catPillColors[t.category] || "bg-stone-50/60 text-stone-500/80 border-stone-200/60";
                  return (
                    <div key={t.id} className="flex items-center gap-1.5 text-[10px]">
                      <span className={`text-[8px] px-1 py-[1px] rounded border whitespace-nowrap ${catStyle}`}>
                        {shortCatLabels[t.category] || t.category}
                      </span>
                      <span className="text-text-light truncate">{t.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </SheetHeader>
          <div className="space-y-5 flex flex-col h-[calc(100vh-12rem)]">
            {/* 按星期快速选择 */}
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-2">按星期快速选择</label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, i) => {
                  const wd = i + 1 === 7 ? 0 : i + 1;
                  const isActive = (() => {
                    const targets: number[] = [];
                    for (let d = 1; d <= daysInMonth; d++) {
                      if (new Date(currentYear, currentMonth, d).getDay() === wd && d !== selectedDay) targets.push(d);
                    }
                    return targets.length > 0 && targets.every(t => copyTargets.includes(t));
                  })();
                  return (
                    <button key={i} onClick={() => {
                      const targets: number[] = [];
                      for (let d = 1; d <= daysInMonth; d++) {
                        if (new Date(currentYear, currentMonth, d).getDay() === wd && d !== selectedDay) targets.push(d);
                      }
                      if (targets.every(t => copyTargets.includes(t))) {
                        setCopyTargets(prev => prev.filter(t => !targets.includes(t)));
                      } else {
                        setCopyTargets(prev => [...new Set([...prev, ...targets])]);
                      }
                    }}
                      className={`px-2.5 py-1.5 text-[10px] rounded-lg border transition-all ${
                        isActive ? "bg-caramel/15 text-caramel border-caramel/30 font-medium" :
                        "bg-bg-warm text-text-secondary border-border-warm hover:border-caramel/40 hover:text-caramel"
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 主题日期选择 */}
            <div className="flex-1 min-h-0">
              <label className="text-xs text-text-secondary font-medium block mb-2">选择目标日期</label>
              <div className="h-full max-h-[340px] overflow-y-auto rounded-lg border border-border-warm bg-bg-warm/30 p-2">
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const isSrc = d === selectedDay;
                    const isTarget = copyTargets.includes(d);
                    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    return (
                      <button key={d} disabled={isSrc}
                        onClick={() => setCopyTargets(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                        className={`h-9 rounded-lg text-xs transition-all relative ${
                          isSrc ? "bg-caramel/10 text-text-light cursor-not-allowed line-through" :
                          isTarget ? "bg-caramel/15 text-caramel font-medium ring-2 ring-caramel/30 shadow-sm" :
                          isWeekend ? "bg-white text-text-light border border-border-warm/60 hover:border-caramel/30" :
                          "bg-white text-text-secondary border border-border-warm/60 hover:border-caramel/30"
                        }`}
                      >
                        {d}
                        {isWeekend && !isSrc && (
                          <span className="absolute -top-0.5 -right-0.5 text-[6px] text-text-light/40">六</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 底部操作栏 */}
            <div className="flex items-center justify-between pt-2 border-t border-border-warm">
              <span className="text-[10px] text-text-light">
                已选择 <strong className="text-caramel">{copyTargets.length}</strong> 个日期
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="text-xs border-border-warm h-8 text-text-secondary"
                  onClick={() => { setCopySheetOpen(false); setCopyTargets([]); }}>
                  取消
                </Button>
                <Button className="bg-caramel text-white font-medium text-xs h-8 hover:bg-amber-700 shadow-sm"
                  onClick={() => copyTasks.mutate()}
                  disabled={copyTargets.length === 0 || copyTasks.isPending}>
                  {copyTasks.isPending ? (
                    <><Loader2 className="w-3 h-3 mr-1 animate-spin" />复制中...</>
                  ) : (
                    <>开始复制 ({copyTargets.length} 天)</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ 假期 Dialog ═══ */}
      <Dialog open={vacationDialogOpen} onOpenChange={setVacationDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <Umbrella className="w-4 h-4 text-caramel" />
              {editingVacation ? "编辑假期" : "创建假期"}
            </DialogTitle>
            <DialogDescription>设定假期名称和起止日期</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">假期名称</label>
              <Input value={vacationForm.name} onChange={e => setVacationForm(p => ({ ...p, name: e.target.value }))}
                placeholder="例如：2026 暑假" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">开始日期</label>
                <Input type="date" value={vacationForm.startDate} onChange={e => setVacationForm(p => ({ ...p, startDate: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">结束日期</label>
                <Input type="date" value={vacationForm.endDate} onChange={e => setVacationForm(p => ({ ...p, endDate: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
            </div>
            <Button className="w-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20"
              onClick={() => saveVacation.mutate()}
              disabled={!vacationForm.name || !vacationForm.startDate || !vacationForm.endDate || saveVacation.isPending}>
              {saveVacation.isPending ? "保存中..." : editingVacation ? "更新假期" : "创建假期"}
            </Button>
            {editingVacation && (
              <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs"
                onClick={() => setDeleteConfirmOpen(true)}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />删除此假期
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 确认删除假期 ═══ */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <Trash2 className="w-4 h-4 text-red-500" />
              确认删除假期
            </DialogTitle>
            <DialogDescription>
              确定要删除「{editingVacation?.name || ""}」吗？该假期下的所有任务和事件也将一并删除，此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 border-border-warm text-text-secondary text-xs"
              onClick={() => setDeleteConfirmOpen(false)}>取消</Button>
            <Button className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs"
              onClick={() => { if (editingVacation) { deleteVacation.mutate(editingVacation.id); setDeleteConfirmOpen(false); } }}
              disabled={deleteVacation.isPending}>
              {deleteVacation.isPending ? "删除中..." : "确认删除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 特殊时间段 Dialog ═══ */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-caramel" />
              {editingPeriod ? "编辑事件" : "添加事件"}
            </DialogTitle>
            <DialogDescription>在月历上标注外出、疗休养等事件</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">时段名称</label>
              <Input value={periodForm.name} onChange={e => setPeriodForm(p => ({ ...p, name: e.target.value }))}
                placeholder="例如：外出疗休养、期中考" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">开始日期</label>
                <Input type="date" value={periodForm.startDate} onChange={e => setPeriodForm(p => ({ ...p, startDate: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">结束日期</label>
                <Input type="date" value={periodForm.endDate} onChange={e => setPeriodForm(p => ({ ...p, endDate: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-2">显示颜色</label>
              <div className="flex flex-wrap gap-2">
                {PERIOD_COLORS.map(c => (
                  <button key={c.value} onClick={() => setPeriodForm(p => ({ ...p, color: c.value }))}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${c.bg} ${c.border} ${
                      periodForm.color === c.value ? "ring-2 ring-caramel ring-offset-1 scale-110" : ""
                    }`} title={c.label} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">备注说明（可选）</label>
              <Textarea value={periodForm.note} onChange={e => setPeriodForm(p => ({ ...p, note: e.target.value }))}
                placeholder="补充说明" className="border-border-warm min-h-[60px] focus-visible:ring-caramel/30" />
            </div>
            <Button className="w-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20"
              onClick={() => savePeriod.mutate()}
              disabled={!periodForm.name || !periodForm.startDate || !periodForm.endDate || savePeriod.isPending}>
              {savePeriod.isPending ? "保存中..." : editingPeriod ? "更新时段" : "添加时段"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 评价任务 Dialog（支持 task + reading 混合评价） ═══ */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center">
              <Star className="w-4 h-4 mr-1.5 text-caramel" />
              评价 {isReadingReview ? "阅读心得" : "任务"}
            </DialogTitle>
            {gradingTask && (
              <p className="text-sm text-text-main font-medium mt-2">{gradingTask.title}</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            {/* ── 任务用时和详情（仅非阅读） ── */}
            {!isReadingReview && (
              <div className="flex flex-wrap gap-3 bg-bg-warm/30 p-3 rounded-lg border border-border-warm">
                {gradingTask?.estimatedTime && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>预估 <strong>{gradingTask.estimatedTime}</strong> 分钟</span>
                  </div>
                )}
                {gradingTask?.spentTime && (
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>实际用时 <strong>{Math.round(gradingTask.spentTime / 60)}</strong> 分钟</span>
                  </div>
                )}
              </div>
            )}

            {/* ── 照片（仅任务） ── */}
            {!isReadingReview && gradingTask?.photos && gradingTask.photos.length > 0 && (
              <div>
                <p className="text-[10px] text-text-light mb-2 flex items-center gap-1">
                  <span>📷</span> 提交的照片
                </p>
                <div className="flex flex-wrap gap-2">
                  {gradingTask.photos.map((photo: any) => (
                    <a key={photo.id} href={photo.url} target="_blank" rel="noopener noreferrer"
                      className="block w-20 h-20 rounded-lg border border-border-warm overflow-hidden hover:ring-2 hover:ring-caramel/30 transition-all">
                      <img src={photo.url} alt="提交的照片" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {gradingTask?.studentNote && (
              <div className="bg-bg-warm/50 p-3 rounded border-l-[3px] border-sage/30">
                <p className="text-[10px] text-text-light mb-1 flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1" />学生心得：
                </p>
                <p className="text-sm text-text-secondary italic font-serif">&ldquo;{gradingTask.studentNote}&rdquo;</p>
              </div>
            )}
            {gradingTask?.excerpts && (
              <div className="bg-bg-warm/30 p-3 rounded border-l-[3px] border-caramel/30">
                <p className="text-[10px] text-text-light mb-1">摘录内容：</p>
                <p className="text-sm text-text-secondary italic font-serif">{gradingTask.excerpts}</p>
              </div>
            )}

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-2">快捷评语</label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_COMMENTS.map((msg) => (
                  <button key={msg} onClick={() => setParentComment(msg)}
                    className={`text-[10px] px-2 py-1 rounded border transition-colors ${
                      parentComment === msg ? "bg-caramel/10 text-caramel border-caramel/30" : "bg-bg-warm text-text-secondary border-border-warm hover:border-caramel/30"
                    }`}>
                    {msg.length > 10 ? msg.slice(0, 10) + "..." : msg}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">评语</label>
              <Textarea value={parentComment} onChange={e => setParentComment(e.target.value)}
                placeholder="写一段话鼓励孩子..." className="border-border-warm min-h-[80px] focus-visible:ring-caramel/30" />
            </div>

            {/* ── 积分选择 1-5 ── */}
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-2">奖励积分</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setPoints(n)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                      points === n
                        ? "bg-caramel/15 text-caramel border-2 border-caramel/40 scale-110 shadow-sm"
                        : "bg-bg-warm text-text-secondary border border-border-warm hover:border-caramel/30 hover:text-caramel"
                    }`}>
                    {n}
                  </button>
                ))}
                <span className="text-[10px] text-text-light ml-1">流光币</span>
              </div>
            </div>

            <Button className="w-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20 transition-all duration-200 active:scale-[0.98]"
              onClick={() => gradeTask.mutate()} disabled={gradeTask.isPending}>
              {gradeTask.isPending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" /><span>提交中...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /><span>确认评价 · 奖励 {points} 流光币</span>
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
