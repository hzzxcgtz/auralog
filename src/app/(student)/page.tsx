"use client";

import { useState, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { useTaskTimer } from "@/hooks/useTaskTimer";
import { useTaskMutations } from "@/hooks/useTaskMutations";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import PhotoUploader, { PhotoViewer } from "@/components/shared/PhotoUploader";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/StatusBadge";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import {
  BookOpen,
  Clock,
  Target,
  ClipboardList,
  CalendarDays,
  Sparkles,
  Play,
  Square,
  Send,
  MessageCircle,
  ChevronRight,
  Brain,
  MessageSquareText,
  Image,
  CheckCircle,
  Timer,
  ChevronLeft,
  GripVertical,
  SquareStack,
  Loader2,
} from "lucide-react";

const DAYS_OF_WEEK = ["日", "一", "二", "三", "四", "五", "六"];

const CAT_COLOR_MAP: Record<string, string> = {
  orange:  "bg-orange-50/60 text-orange-600/80 border-orange-200/60",
  caramel: "bg-amber-50/60 text-amber-700/80 border-amber-200/60",
  emerald: "bg-emerald-50/60 text-emerald-600/80 border-emerald-200/60",
  teal:    "bg-teal-50/60 text-teal-600/80 border-teal-200/60",
  sky:     "bg-sky-50/60 text-sky-600/80 border-sky-200/60",
  blue:    "bg-blue-50/60 text-blue-600/80 border-blue-200/60",
  indigo:  "bg-indigo-50/60 text-indigo-600/80 border-indigo-200/60",
  purple:  "bg-purple-50/60 text-purple-600/80 border-purple-200/60",
  pink:    "bg-pink-50/60 text-pink-600/80 border-pink-200/60",
  rose:    "bg-rose-50/60 text-rose-600/80 border-rose-200/60",
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

async function fetchDashboard() {
  const res = await fetch("/api/dashboard");
  if (!res.ok) throw new Error("加载失败");
  return res.json();
}

async function fetchTasks(params: string) {
  const res = await fetch(`/api/tasks?${params}`);
  if (!res.ok) throw new Error("加载失败");
  return res.json();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-28 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-52 rounded-xl" />
      <div className="skeleton h-32 rounded-xl" />
      <div className="skeleton h-28 rounded-xl" />
    </div>
  );
}

export default function StudentHomePage() {
  const { data: session } = useSession();
  const studentName = session?.user?.name || "彤";
  const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submittingTask, setSubmittingTask] = useState<any>(null);
  const [studentNote, setStudentNote] = useState("");
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [previewPhotos, setPreviewPhotos] = useState<string[] | null>(null);

  // ── 悬浮卡状态 ──
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const getDayTasks = (day: number) => {
    const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!monthTasks) return [];
    return monthTasks.filter((t: any) => (t.date?.split("T")[0] || t.date) === dateKey);
  };

  // ── 获取该日期的任务列表（用于悬浮卡） ──

  const todayStr = new Date().toISOString().split("T")[0];
  const selectedDateStr = useMemo(() => {
    if (selectedDay === null) return todayStr;
    return `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;
  }, [selectedDay, currentYear, currentMonth]);
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  const { data: tasks } = useQuery({
    queryKey: ["tasks", selectedDateStr],
    queryFn: () => fetchTasks(`date=${selectedDateStr}`),
  });

  // 获取假期和特殊时间段（用于月历展示）
  const { data: vacations } = useQuery({
    queryKey: ["vacations"],
    queryFn: async () => {
      const res = await fetch("/api/vacation");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // 获取最新假期下的特殊时间段
  const currentVacation = useMemo(() => {
    if (!vacations || vacations.length === 0) return null;
    const now = new Date();
    const active = vacations.find((v: any) => {
      const s = new Date(v.startDate);
      const e = new Date(v.endDate);
      return now >= s && now <= e;
    });
    return active || vacations[0];
  }, [vacations]);

  const { data: specialPeriods } = useQuery({
    queryKey: ["special-periods", currentVacation?.id],
    queryFn: async () => {
      if (!currentVacation?.id) return [];
      const res = await fetch(`/api/special-periods?vacationId=${currentVacation.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!currentVacation?.id,
  });

  // 获取当月任务统计
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const { data: monthTasks } = useQuery({
    queryKey: ["tasks", "month", monthStr],
    queryFn: async () => {
      const r = await fetch(`/api/tasks?month=${monthStr}`);
      if (!r.ok) return [];
      return r.json();
    },
  });

  // ── 获取任务类别（用于颜色标识） ──
  const { data: apiCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const r = await fetch("/api/admin/categories");
      return r.ok ? r.json() : [];
    },
    staleTime: 30000,
  });

  // ── 类别文字 → CSS 样式映射 ──
  const categoryStyles = useMemo(() => {
    const map: Record<string, string> = {};
    if (apiCategories && apiCategories.length > 0) {
      apiCategories.forEach((c: any) => {
        map[c.value] = CAT_COLOR_MAP[c.color] || "bg-stone-50/60 text-stone-500/80 border-stone-200/60";
      });
    }
    return map;
  }, [apiCategories]);

  const categoryLabels = useMemo(() => {
    const map: Record<string, string> = {};
    if (apiCategories && apiCategories.length > 0) {
      apiCategories.forEach((c: any) => { map[c.value] = c.label; });
    }
    return map;
  }, [apiCategories]);

  // 按日期统计任务完成情况
  const tasksByDate = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; inProgress: number; todo: number }>();
    if (!monthTasks) return map;
    monthTasks.forEach((task: any) => {
      const dk = task.date?.split("T")[0];
      if (!dk) return;
      const e = map.get(dk) || { total: 0, completed: 0, inProgress: 0, todo: 0 };
      e.total++;
      if (task.status === "GRADED" || task.status === "PENDING_REVIEW") e.completed++;
      if (task.status === "IN_PROGRESS") e.inProgress++;
      if (task.status === "TODO") e.todo++;
      map.set(dk, e);
    });
    return map;
  }, [monthTasks]);

  // ── 按日期统计类别数量（类别药丸） ──
  const categoryCountByDate = useMemo(() => {
    const map = new Map<string, { value: string; count: number; pillColor: string; shortLabel: string }[]>();
    if (!monthTasks) return map;
    monthTasks.forEach((task: any) => {
      const dk = task.date?.split("T")[0];
      if (!dk) return;
      const arr = map.get(dk) || [];
      const existing = arr.find((x: any) => x.value === task.category);
      const label = categoryLabels[task.category] || task.category;
      if (existing) {
        existing.count++;
      } else {
        arr.push({
          value: task.category,
          count: 1,
          pillColor: categoryStyles[task.category] || "bg-stone-50/60 text-stone-500/80 border-stone-200/60",
          shortLabel: label.length > 2 ? label.slice(0, 2) : label,
        });
      }
      map.set(dk, arr);
    });
    return map;
  }, [monthTasks, categoryStyles, categoryLabels]);

  // ── 按日期统计专注时间 ──
  const focusTimeByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk || !t.spentTime) return;
      map.set(dk, (map.get(dk) || 0) + t.spentTime);
    });
    return map;
  }, [monthTasks]);

  // ── 按日期统计待评价和进行中数量 ──
  const pendingCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      if (t.status === "PENDING_REVIEW") map.set(dk, (map.get(dk) || 0) + 1);
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

  const prCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthTasks?.forEach((t: any) => {
      const dk = t.date?.split("T")[0];
      if (!dk) return;
      if (t.status === "PENDING_REVIEW") map.set(dk, (map.get(dk) || 0) + 1);
    });
    return map;
  }, [monthTasks]);

  const isDateInPeriods = (dateStr: string): { inPeriod: boolean; name: string; color: string } | null => {
    if (!specialPeriods) return null;
    const d = new Date(dateStr);
    for (const p of specialPeriods) {
      const s = new Date(p.startDate?.split("T")[0] || p.startDate);
      const e = new Date(p.endDate?.split("T")[0] || p.endDate);
      if (d >= s && d <= e) {
        return { inPeriod: true, name: p.name, color: p.color || "blue" };
      }
    }
    return null;
  };

  const isDateInVacation = (dateStr: string): boolean => {
    if (!vacations) return false;
    const d = new Date(dateStr);
    return vacations.some((v: any) => {
      const s = new Date(v.startDate?.split("T")[0] || v.startDate);
      const e = new Date(v.endDate?.split("T")[0] || v.endDate);
      return d >= s && d <= e;
    });
  };

  const timer = useTaskTimer();
  const { updateStatus } = useTaskMutations();

  const handleStartTimer = (taskId: number) => {
    timer.startTimer(taskId);
    updateStatus.mutate({ taskId, action: "START" });
  };

  const handleStopTimer = () => {
    const result = timer.stopTimer();
    if (result) {
      updateStatus.mutate({
        taskId: result.taskId,
        action: "STOP",
        data: { spentTime: result.spentSeconds },
      });
    }
  };

  const handleSubmitTask = () => {
    if (!submittingTask || !studentNote.trim()) return;
    updateStatus.mutate({
      taskId: submittingTask.id,
      action: "SUBMIT",
      data: { studentNote, photoIds: [] },
    });
    setSubmitDialogOpen(false);
    setSubmittingTask(null);
    setStudentNote("");
    setUploadedPhotos([]);
  };

  const openSubmitDialog = (task: any) => {
    setSubmittingTask(task);
    setStudentNote(task.studentNote || "");
    setUploadedPhotos([]);
    setSubmitDialogOpen(true);
  };

  const today = new Date().getDate();
  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentYear, currentMonth]);
  const firstDayOfMonth = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentYear, currentMonth]);

  const monthData = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const monthStr = String(currentMonth + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      const period = isDateInPeriods(dateStr);
      const inVacation = isDateInVacation(dateStr);
      const dayStats = tasksByDate.get(dateStr);
      const catCounts = categoryCountByDate.get(dateStr) || [];
      const ft = focusTimeByDate.get(dateStr) || 0;
      const pc = pendingCountByDate.get(dateStr) || 0;
      const ic = ipCountByDate.get(dateStr) || 0;
      const dc = doneCountByDate.get(dateStr) || 0;
      const gc = gradedCountByDate.get(dateStr) || 0;
      const rc = prCountByDate.get(dateStr) || 0;
      return {
        day,
        active: day === selectedDay,
        inVacation,
        period,
        stats: dayStats || null,
        catCounts,
        focusTime: ft,
        todoCount: pc,
        ipCount: ic,
        doneCount: dc,
        gradedCount: gc,
        prCount: rc,
        dateStr,
      };
    });
  }, [daysInMonth, currentMonth, currentYear, selectedDay, specialPeriods, vacations, tasksByDate, categoryCountByDate, focusTimeByDate, pendingCountByDate, ipCountByDate, doneCountByDate, gradedCountByDate, prCountByDate]);

  const focusHours = dashboard?.todayFocus?.toFixed(1) || "0.0";
  const totalTasks = dashboard?.totalTasks || 0;
  const completedTasks = dashboard?.completedTasks || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const allPhotos = tasks?.flatMap((t: any) => t.photos?.map((p: any) => p.url) || []) || [];

  return (
    <>
      {/* 顶栏 */}
      <header className="flex justify-between items-center mb-5 pb-4 border-b border-border-warm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-coffee font-serif">纸间流光</h1>
            <p className="text-[11px] text-text-light">记录光阴，见证成长。</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-sage border-r border-border-warm pr-4">
            <span className="w-1.5 h-1.5 rounded-full bg-sage animate-sync-pulse" />
            <span>已与家长端同步</span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary border-r border-border-warm pr-4">
            <Sparkles className="w-3.5 h-3.5 text-caramel" />
            <span className="text-xs font-medium">
              流光币: <span className="text-caramel font-bold">{dashboard?.myPoints != null ? dashboard.myPoints : (session?.user ? "—" : "185")}</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white font-medium text-xs shadow-sm">
            {studentName.charAt(0)}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <main className="lg:col-span-2 space-y-5">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* 顶部概览 — StatsCard 组件 */}
              <motion.div
                className="grid grid-cols-3 gap-4"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                <motion.div variants={listItem}>
                  <StatsCard
                    icon={<Clock className="w-full h-full" />}
                    label="今日专注"
                    value={focusHours}
                    unit="小时"
                    accentColor="caramel"
                  />
                </motion.div>
                <motion.div variants={listItem}>
                  <StatsCard
                    icon={<Target className="w-full h-full" />}
                    label="任务进度"
                    value={`${completedTasks}`}
                    unit={`/ ${totalTasks}`}
                    accentColor="coffee"
                    progress={completionRate}
                    progressComplete={completionRate >= 100}
                  />
                </motion.div>
                <motion.div variants={listItem}>
                  <StatsCard
                    icon={<ClipboardList className="w-full h-full" />}
                    label="待办审核"
                    value={dashboard?.pendingReview || 0}
                    unit="项"
                    accentColor="orange"
                  />
                </motion.div>
              </motion.div>

              {/* 月历 */}
              <motion.div
                className="bg-card-cream border border-border-warm rounded-xl shadow-sm p-4"
                variants={listItem}
                initial="initial"
                animate="animate"
              >
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentYear(y => y - 1);
                      setCurrentMonth(11);
                    } else {
                      setCurrentMonth(m => m - 1);
                    }
                    setSelectedDay(null);
                  }} className="p-1 hover:bg-bg-warm rounded-lg transition-colors">
                    <ChevronLeft className="w-4 h-4 text-text-secondary" />
                  </button>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-coffee font-serif flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-caramel" />
                      {currentYear}年{currentMonth + 1}月
                    </h2>
                    <button onClick={() => {
                      setCurrentYear(new Date().getFullYear());
                      setCurrentMonth(new Date().getMonth());
                      setSelectedDay(new Date().getDate());
                    }}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20 border border-caramel/20 transition-colors">
                      今天
                    </button>
                    {currentVacation && (
                      <span className="text-[10px] text-caramel/70 bg-caramel/5 px-2 py-0.5 rounded-lg border border-caramel/15">
                        🏖️ {currentVacation.name}
                      </span>
                    )}
                  </div>
                  <button onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentYear(y => y + 1);
                      setCurrentMonth(0);
                    } else {
                      setCurrentMonth(m => m + 1);
                    }
                    setSelectedDay(null);
                  }} className="p-1 hover:bg-bg-warm rounded-lg transition-colors">
                    <ChevronRight className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-px mb-px">
                  {DAYS_OF_WEEK.map(d => (
                    <div key={d} className="text-center text-[10px] text-text-light py-1 border-b border-border-warm">{d}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-px">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`e-${i}`} />
                  ))}
                  {monthData.map((item) => {
                    const isTd = item.day === today && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();

                    let bg = "bg-white", tx = "text-text-secondary", bo = "border border-transparent";
                    if (item.active) { bg = "bg-caramel/5"; tx = "text-text-secondary"; bo = "border-2 border-caramel"; }
                    else if (isTd) { bg = "bg-sage-light"; bo = "border border-lime-300"; }
                    else if (item.period) {
                      const pc = PERIOD_COLORS.find((c: any) => c.value === item.period!.color) || PERIOD_COLORS[0];
                      bg = pc.bg; bo = `border ${pc.border}`; tx = pc.text;
                    } else if (item.inVacation) { bg = "bg-caramel/5"; bo = "border border-caramel/10"; }

                    const hasCatPills = item.catCounts.length > 0;

                    return (
                      <div key={item.day}
                        onMouseEnter={(e) => handleCellMouseEnter(item.day, e)}
                        onMouseLeave={handleCellMouseLeave}
                        onClick={() => setSelectedDay(item.active ? null : item.day)}
                        className={`h-20 rounded px-1.5 py-1 cursor-pointer transition-all duration-150 relative flex flex-col ${bg} ${bo} ${
                          item.active ? "shadow-sm" : "hover:border-caramel-light hover:bg-card-cream"
                        }`}
                      >
                        {/* 上半：日期 + 耗时 + 特殊时段标记 */}
                        <div className="flex items-start justify-between gap-0.5 shrink-0">
                          <span className={`text-base font-bold leading-tight ${tx}`}>{item.day}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {item.focusTime > 0 && (
                              <span className="flex items-center gap-0.5 text-[8px] text-stone-400">
                                <Clock className="w-2 h-2" />{Math.round(item.focusTime / 60)}m
                              </span>
                            )}
                            {item.period && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded leading-none shrink-0 bg-white/50 text-gray-600 border border-gray-200/50 max-w-[4rem] truncate" title={item.period.name}>
                                📌{item.period.name}
                              </span>
                            )}
                          </div>
                        </div>


                        {/* 中段：任务类别药丸 */}
                        {hasCatPills && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap shrink-0">
                            {item.catCounts.slice(0, 3).map((cc: any) => (
                              <span key={cc.value} className={`text-[8px] leading-none px-1 py-[1px] rounded border whitespace-nowrap ${cc.pillColor}`}>
                                {cc.shortLabel}×{cc.count}
                              </span>
                            ))}
                            {item.catCounts.length > 3 && (
                              <span className="text-[8px] text-text-light">+{item.catCounts.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* 中下：状态统计 */}
                        {(item.todoCount + item.ipCount + item.doneCount + item.prCount + item.gradedCount) > 0 && (
                          <div className="flex items-center gap-1.5 mt-auto pt-0.5 shrink-0 flex-wrap">
                            {item.todoCount > 0 && <span className="text-[8px] text-gray-500">待{item.todoCount}</span>}
                            {item.ipCount > 0 && <span className="text-[8px] text-blue-600">进{item.ipCount}</span>}
                            {item.doneCount > 0 && <span className="text-[8px] text-lime-600">完{item.doneCount}</span>}
                            {item.prCount > 0 && <span className="text-[8px] text-amber-600">评{item.prCount}</span>}
                            {item.gradedCount > 0 && <span className="text-[8px] text-emerald-600">✓{item.gradedCount}</span>}
                          </div>
                        )}

                        {/* 下半：进度条 */}
                        <div className="flex items-center gap-1 mt-auto pt-0.5 shrink-0">
                          {item.stats && (
                            <>
                              <span className={`text-[8px] font-medium ${
                                item.active ? "text-caramel" : item.stats.completed >= item.stats.total ? "text-sage" : "text-caramel"
                              }`}>
                                {item.stats.completed}/{item.stats.total}
                              </span>
                              <div className={`flex-1 h-1 rounded-full ${item.active ? "bg-caramel/15" : "bg-bg-warm"} overflow-hidden`}>
                                <div className={`h-full rounded-full transition-all duration-500 ${item.stats.completed >= item.stats.total ? "bg-sage" : "bg-caramel"}`}
                                  style={{ width: `${(item.stats.completed / Math.max(item.stats.total, 1)) * 100}%` }} />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* 悬浮弹出卡 */}
              <AnimatePresence>
                {hoveredDay && hoveredRect && (() => {
                  const dayTasks = getDayTasks(hoveredDay);
                  if (!dayTasks.length) return null;
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="fixed z-[60] bg-card-cream border border-border-warm rounded-xl shadow-lg p-3"
                      style={{
                        left: Math.min(hoveredRect.left, window.innerWidth - 360),
                        top: hoveredRect.bottom + 4,
                        width: 340,
                      }}
                    >
                      <div className="text-[10px] text-text-light mb-2 flex items-center gap-1.5">
                        <CalendarDays className="w-3 h-3 text-caramel" />
                        {currentYear}年{currentMonth + 1}月{hoveredDay}日 · {dayTasks.length} 项任务
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {dayTasks.map((task: any) => {
                          const catStyle = categoryStyles[task.category] || "bg-stone-50/60 text-stone-500/80 border-stone-200/60";
                          return (
                            <div key={task.id} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-bg-warm/40 border border-border-warm">
                              <span className={`text-[9px] px-1 py-0.5 rounded border whitespace-nowrap shrink-0 ${catStyle}`}>
                                {categoryLabels[task.category] || task.category}
                              </span>
                              <span className={`text-[11px] flex-1 min-w-0 truncate ${task.status === "GRADED" ? "line-through text-text-light" : "text-text-main"}`}>
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {task.estimatedTime && (
                                  <span className="text-[8px] text-text-light flex items-center gap-0.5">
                                    <Clock className="w-2 h-2" />预估 {task.estimatedTime} 分钟
                                  </span>
                                )}
                              </div>
                              <span className={`text-[8px] px-1 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                                task.status === "TODO" ? "bg-gray-100 text-gray-500" :
                                task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-600" :
                                task.status === "PENDING_REVIEW" ? "bg-amber-50 text-amber-600" :
                                task.status === "GRADED" ? "bg-emerald-50/60 text-emerald-600" : "bg-gray-100 text-gray-500"
                              }`}>
                                {task.status === "TODO" ? "待开始" : task.status === "IN_PROGRESS" ? "进行中" :
                                 task.status === "DONE" ? "已完成" :
                                 task.status === "PENDING_REVIEW" ? "待评价" : task.status === "GRADED" ? "已评价" : task.status}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })()}
              </AnimatePresence>

              {/* 今日待办标题 */}
              <div className="flex justify-between items-center px-1 pt-1">
                <h3 className="text-sm font-medium text-coffee font-serif flex items-center">
                  <ClipboardList className="w-4 h-4 mr-1.5 text-caramel" />
                  {selectedDay !== null && (selectedDay !== new Date().getDate() || currentMonth !== new Date().getMonth() || currentYear !== new Date().getFullYear())
                    ? `${currentYear}年${currentMonth + 1}月${selectedDay}日 的任务`
                    : "今日待办"}
                </h3>
              </div>

              {/* 任务列表 */}
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-28 rounded-xl" />
                  ))}
                </div>
              ) : !tasks || tasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card-cream border border-border-warm rounded-xl shadow-sm p-12 text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-caramel/8 to-amber-500/8 flex items-center justify-center mx-auto mb-4 border border-caramel/15">
                    <CheckCircle className="w-8 h-8 text-caramel" />
                  </div>
                  <p className="text-base text-text-secondary font-serif mb-1">今天没有待办任务 ✨</p>
                  <p className="text-xs text-text-light">去阅读、休息，或者享受自由时光吧~</p>
                </motion.div>
              ) : (
                <motion.div
                  className="space-y-3"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {tasks.map((task: any) => {
                    const isTimerRunning = timer.isRunning && timer.activeTaskId === task.id;
                    const taskPhotos = task.photos?.map((p: any) => p.url) || [];

                    // 左侧状态色条
                    const statusBar: Record<string, string> = {
                      TODO: "bg-gray-300",
                      IN_PROGRESS: "bg-blue-500",
                      DONE: "bg-lime-500",
                      PENDING_REVIEW: "bg-orange-500",
                      GRADED: "bg-caramel",
                    };

                    return (
                      <motion.div
                        key={task.id}
                        variants={listItem}
                        className="bg-card-cream border border-border-warm rounded-xl shadow-sm relative overflow-hidden card-hover"
                      >
                        {/* 左侧状态色条 */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${statusBar[task.status] || "bg-gray-300"}`} />

                        <div className="p-4 pl-5">
                          {/* 纸胶带装饰 */}
                          {task.status === "PENDING_REVIEW" && <div className="washi-tape washi-tape-caramel" />}
                          {task.status === "GRADED" && <div className="washi-tape washi-tape-sage" />}

                          {/* 标题行 */}
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className={`tag whitespace-nowrap ${categoryStyles[task.category] || "bg-stone-50/60 text-stone-500/80 border-stone-200/60"}`}>
                                {categoryLabels[task.category] || task.category}
                              </span>
                              <h4 className={`text-sm font-medium truncate ${
                                task.status === "DONE" || task.status === "PENDING_REVIEW" || task.status === "GRADED"
                                  ? "line-through text-text-light"
                                  : "text-text-main"
                              }`}>
                                {task.title}
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                              <StatusBadge status={task.status} />
                              <span className="text-xs text-text-light whitespace-nowrap">
                                {task.status === "IN_PROGRESS" && isTimerRunning ? timer.display :
                                 task.spentTime ? `实际 ${Math.round(task.spentTime / 60)} 分钟` :
                                 `预估 ${task.estimatedTime} 分钟`}
                              </span>
                            </div>
                          </div>

                          {/* 照片展示 */}
                          {taskPhotos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {taskPhotos.slice(0, 4).map((url: string, i: number) => (
                                <div
                                  key={url}
                                  className="w-14 h-14 rounded-lg overflow-hidden border border-border-warm cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => setPreviewPhotos(taskPhotos)}
                                >
                                  <img src={url} alt={`照片 ${i + 1}`} className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {taskPhotos.length > 4 && (
                                <button
                                  onClick={() => setPreviewPhotos(taskPhotos)}
                                  className="w-14 h-14 rounded-lg bg-bg-warm border border-border-warm flex items-center justify-center text-[10px] text-text-light hover:text-caramel"
                                >
                                  <Image className="w-3 h-3 mr-1" />
                                  +{taskPhotos.length - 4}
                                </button>
                              )}
                            </div>
                          )}

                          {/* 心得/评语 */}
                          {task.studentNote && (
                            <div className="bg-bg-warm/50 p-2.5 rounded text-xs text-text-secondary leading-relaxed border-l-[3px] border-sage/30 pl-3 italic font-serif mt-2">
                              &ldquo;{task.studentNote}&rdquo;
                            </div>
                          )}
                          {task.parentComment && (
                            <div className="bg-amber-50/50 p-2.5 rounded text-xs text-text-secondary leading-relaxed border-l-[3px] border-caramel/40 pl-3 mt-2 flex items-start gap-1.5">
                              <MessageCircle className="w-3 h-3 text-caramel mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-bold text-caramel">[家长回信]</span> {task.parentComment}
                              </div>
                            </div>
                          )}

                          {/* 操作按钮 */}
                          <div className="flex items-center justify-between mt-3">
                            {task.status === "TODO" && (
                              <button
                                onClick={() => handleStartTimer(task.id)}
                                className="inline-flex items-center gap-1 bg-caramel text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 transition-all duration-200 active:scale-[0.97] shadow-sm"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                <span>开始计时</span>
                              </button>
                            )}
                            {task.status === "IN_PROGRESS" && isTimerRunning && (
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex-1 bg-bg-warm/50 p-2 rounded-lg border border-border-warm flex items-center gap-2">
                                  <div
                                    className="w-6 h-6 rounded-full bg-gray-900 animate-vinyl-spin flex-shrink-0 ring-1 ring-gray-700"
                                    style={{
                                      backgroundImage: "repeating-radial-gradient(circle at center, #222 0px, #222 1px, #111 2px)",
                                    }}
                                  />
                                  <span className="text-sm font-mono font-medium text-caramel">
                                    <Timer className="w-3 h-3 inline mr-1" />
                                    {timer.display}
                                  </span>
                                </div>
                                <button
                                  onClick={handleStopTimer}
                                  className="inline-flex items-center gap-1 bg-caramel text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 transition-all duration-200 active:scale-[0.97] flex-shrink-0 shadow-sm"
                                >
                                  <Square className="w-3.5 h-3.5" />
                                  <span>停止</span>
                                </button>
                              </div>
                            )}
                            {task.status === "IN_PROGRESS" && !isTimerRunning && (
                              <button
                                onClick={() => handleStartTimer(task.id)}
                                className="inline-flex items-center gap-1 bg-caramel text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 transition-all duration-200 active:scale-[0.97] shadow-sm"
                              >
                                <Play className="w-3.5 h-3.5 fill-white" />
                                <span>继续计时</span>
                              </button>
                            )}
                            {task.status === "DONE" && (
                              <button
                                onClick={() => openSubmitDialog(task)}
                                className="inline-flex items-center gap-1 bg-sage text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-lime-600 transition-all duration-200 active:scale-[0.97] shadow-sm"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>提交审核</span>
                              </button>
                            )}
                            {task.status === "PENDING_REVIEW" && (
                              <span className="text-[10px] text-sage/80 font-medium flex items-center">
                                <span className="w-1 h-1 rounded-full bg-sage/80 mr-1.5 animate-pulse" />
                                等待家长评价...
                              </span>
                            )}
                            {task.status === "GRADED" && task.points && (
                              <span className="text-xs font-bold text-caramel flex items-center">
                                <Sparkles className="w-3.5 h-3.5 mr-1" />
                                +{task.points} 流光币
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </>
          )}
        </main>

        {/* 右侧侧边栏 */}
        <aside className="space-y-4">
          <div className="bg-card-cream border border-caramel/25 rounded-xl shadow-sm p-4 bg-gradient-to-br from-card-cream to-bg-warm card-hover">
            <h3 className="text-sm font-medium text-coffee font-serif mb-3 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-caramel" />
              课外阅读
            </h3>
            <p className="text-xs text-text-secondary text-center py-4">暂无阅读记录</p>
          </div>

          <div className="bg-card-cream border border-border-warm rounded-xl shadow-sm p-4 card-hover">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-coffee font-serif">本周频段</h3>
              <span className="text-xs text-text-light">小时</span>
            </div>
            <div className="flex items-end justify-between h-24 gap-2">
              {(() => {
                const weekDays = [];
                const todayLocal = new Date();
                for (let i = 6; i >= 0; i--) {
                  const d = new Date(todayLocal);
                  d.setDate(d.getDate() - i);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                  const focusSeconds = focusTimeByDate.get(key) || 0;
                  const hours = focusSeconds / 3600;
                  const label = i === 6 ? "今日" : ["周日","周一","周二","周三","周四","周五","周六"][d.getDay()];
                  weekDays.push({ key, hours, label, isToday: i === 6 });
                }
                const maxHours = Math.max(...weekDays.map(d => d.hours), 0.1);
                return weekDays.map((day) => (
                  <div key={day.key} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <div className={`w-full rounded-t transition-all duration-500 ${day.isToday ? "bg-gradient-to-t from-caramel to-amber-400 shadow-sm" : "bg-paper border border-border-warm"}`}
                      style={{ height: `${Math.max((day.hours / maxHours) * 100, 4)}%` }} />
                    <span className={`text-[10px] ${day.isToday ? "text-caramel font-bold" : "text-text-light"}`}>{day.label}</span>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="bg-card-cream border border-caramel/25 rounded-xl shadow-sm p-4 bg-gradient-to-br from-card-cream to-bg-warm card-hover flex items-center justify-between">
            <div>
              <h4 className="text-xs font-medium text-caramel font-serif">手账回信局</h4>
              <p className="text-[10px] text-text-secondary mt-0.5">记录阅读感悟</p>
            </div>
            <a href="/reading" className="inline-flex items-center gap-0.5 text-xs text-caramel font-medium hover:text-amber-700 transition-colors">
              <span>写信</span>
              <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </aside>
      </div>

      {/* 提交审核对话框 */}
      <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif">提交任务审核</DialogTitle>
            {submittingTask && (
              <p className="text-xs text-text-secondary">正在提交：「{submittingTask.title}」</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">学习心得 *</label>
              <Textarea
                value={studentNote}
                onChange={e => setStudentNote(e.target.value)}
                placeholder="写下你今天完成这项任务的感受..."
                className="border-border-warm min-h-[100px] focus-visible:ring-caramel/30"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1 flex items-center">
                <Image className="w-3 h-3 mr-1" />
                上传照片（可选）
              </label>
              <PhotoUploader onUploadComplete={setUploadedPhotos} maxCount={6} />
            </div>
            <button
              onClick={handleSubmitTask}
              disabled={!studentNote.trim() || updateStatus.isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-sage text-white py-2 rounded-lg text-sm font-medium hover:bg-lime-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{updateStatus.isPending ? "提交中..." : "提交审核"}</span>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 照片查看器 */}
      {previewPhotos && (
        <PhotoViewer urls={previewPhotos} onClose={() => setPreviewPhotos(null)} />
      )}

      {/* AI 陪伴者 — 小夜灯造型 */}
      <div className="fixed bottom-24 lg:bottom-8 right-4 md:right-8 z-50 group cursor-pointer">
        <div className="relative flex flex-col items-center">
          <div className="absolute -top-2 w-4 h-4 border-2 border-caramel/40 rounded-full animate-radio-wave opacity-0" />
          <div className="absolute -top-2 w-4 h-4 border-2 border-caramel/40 rounded-full animate-radio-wave" style={{ animationDelay: "0.5s" }} />
          {/* 小夜灯造型 */}
          <div className="w-14 h-12 bg-gradient-to-br from-amber-300 to-caramel rounded-2xl flex items-center justify-center shadow-lg border border-amber-200/50 group-hover:shadow-xl transition-shadow relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-caramel/20 to-transparent" />
            <Brain className="w-5 h-5 text-white/90 relative z-10" />
          </div>
          <div className="w-1 h-3 bg-coffee/30 rounded mx-auto -mt-0.5" />
          <div className="w-3 h-1 bg-coffee/20 rounded-full mx-auto" />
          <p className="text-[10px] text-caramel mt-1.5 font-medium flex items-center">
            <MessageSquareText className="w-3 h-3 mr-0.5" />
            小光
          </p>
        </div>
      </div>
    </>
  );
}
