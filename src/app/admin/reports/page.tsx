"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PaperCard from "@/components/shared/PaperCard";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import {
  BarChart3,
  Plus,
  Loader2,
  Star,
  Heart,
  Target,
  Clock,
  Coins,
  BookOpen,
  Quote,
  Medal,
} from "lucide-react";

const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

const BADGES = [
  { value: "自律之星", label: "⭐ 自律之星", desc: "连续完成任务", color: "from-caramel to-amber-400" },
  { value: "阅读达人", label: "📖 阅读达人", desc: "完成多本书籍", color: "from-sage to-green-400" },
  { value: "进步之星", label: "📈 进步之星", desc: "成绩显著提升", color: "from-blue-400 to-cyan-400" },
  { value: "勤奋标兵", label: "💪 勤奋标兵", desc: "长时间专注学习", color: "from-purple-400 to-pink-400" },
  { value: "坚持王者", label: "👑 坚持王者", desc: "全勤无缺", color: "from-caramel to-yellow-400" },
];

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [genDialogOpen, setGenDialogOpen] = useState(false);
  const [form, setForm] = useState({
    type: "STAGE", stageNumber: "1",
    startDate: "", endDate: "",
    parentComment: "", badgeAwarded: "",
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await fetch("/api/reports");
      return res.json();
    },
  });

  const generateReport = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reports", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type, stageNumber: parseInt(form.stageNumber) || 1,
          startDate: form.startDate, endDate: form.endDate,
          parentComment: form.parentComment || null, badgeAwarded: form.badgeAwarded || null,
        }),
      });
      if (!res.ok) throw new Error("生成失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setGenDialogOpen(false);
      setForm({ type: "STAGE", stageNumber: "1", startDate: "", endDate: "", parentComment: "", badgeAwarded: "" });
    },
  });

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const { data: weekData } = useQuery({
    queryKey: ["reports", "week"],
    queryFn: async () => {
      const results = [];
      for (const date of weekDates) {
        const res = await fetch(`/api/tasks?date=${date}`);
        if (res.ok) {
          const tasks = await res.json();
          const completed = tasks.filter((t: any) => t.status === "GRADED" || t.status === "PENDING_REVIEW").length;
          const focusSec = tasks.reduce((sum: number, t: any) => sum + (t.spentTime || 0), 0);
          results.push({ date, total: tasks.length, completed, focusHours: Math.round((focusSec / 3600) * 10) / 10 });
        }
      }
      return results;
    },
  });

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-5 pb-4 border-b border-border-warm">
        <div>
          <h1 className="text-base font-bold text-coffee font-serif">报表中心</h1>
          <p className="text-xs text-text-light">阶段回顾与假期总结，见证每一步成长。</p>
        </div>
        <Button className="bg-caramel text-white text-xs hover:bg-amber-700"
          onClick={() => setGenDialogOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />生成战报
        </Button>
      </header>

      {/* 本周概览图表 */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6"
        variants={staggerContainer} initial="initial" animate="animate"
      >
        <motion.div variants={listItem}>
          <PaperCard variant="paper" elevation="sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-coffee font-serif mb-4 flex items-center">
                <Target className="w-4 h-4 mr-1.5 text-caramel" />
                近 7 天完成任务
              </h3>
              {weekData ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D4" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#A8A29E" }}
                      tickFormatter={(v: string) => `${new Date(v).getDate()}日`} />
                    <YAxis tick={{ fontSize: 10, fill: "#A8A29E" }} />
                    <Tooltip contentStyle={{ background: "#FEFDFB", border: "1px solid #EDE4D4", borderRadius: "8px" }} />
                    <Bar dataKey="completed" fill="#D97706" radius={[4, 4, 0, 0]} name="完成数" />
                    <Bar dataKey="total" fill="#FED7AA" radius={[4, 4, 0, 0]} name="总任务数" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-caramel animate-spin" />
                </div>
              )}
            </div>
          </PaperCard>
        </motion.div>

        <motion.div variants={listItem}>
          <PaperCard variant="paper" elevation="sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-coffee font-serif mb-4 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-caramel" />
                本周专注时长 (h)
              </h3>
              {weekData ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE4D4" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#A8A29E" }}
                      tickFormatter={(v: string) => `${new Date(v).getDate()}日`} />
                    <YAxis tick={{ fontSize: 10, fill: "#A8A29E" }} />
                    <Tooltip contentStyle={{ background: "#FEFDFB", border: "1px solid #EDE4D4", borderRadius: "8px" }} />
                    <Bar dataKey="focusHours" fill="#84CC16" radius={[4, 4, 0, 0]} name="专注时长 (h)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-caramel animate-spin" />
                </div>
              )}
            </div>
          </PaperCard>
        </motion.div>
      </motion.div>

      {/* 已生成战报列表 */}
      <PaperCard variant="paper" elevation="sm">
        <div className="px-4 py-3 border-b border-border-warm bg-bg-warm/50">
          <h3 className="text-sm font-medium text-coffee font-serif">已生成战报</h3>
        </div>

        {isLoading ? (
          <div className="text-center py-8"><Loader2 className="w-5 h-5 text-caramel animate-spin mx-auto" /></div>
        ) : reports?.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-caramel/8 to-amber-500/8 flex items-center justify-center mx-auto mb-4 border border-caramel/15">
              <BarChart3 className="w-8 h-8 text-caramel" />
            </div>
            <p className="text-sm text-text-secondary font-serif mb-1">还没有生成过战报</p>
            <p className="text-xs text-text-light">点击右上角「生成战报」创建第一阶段总结</p>
          </div>
        ) : (
          <div className="divide-y divide-border-warm">
            {reports?.map((report: any, idx: number) => {
              const data = (() => {
                try { return JSON.parse(report.dataSnapshot || "{}"); }
                catch { return {}; }
              })();

              const statFields = [
                { key: "completedTasks", label: "完成任务", val: data.completedTasks || 0, icon: Target },
                { key: "totalFocusHours", label: "专注时长", val: `${data.totalFocusHours || 0}h`, icon: Clock },
                { key: "totalPoints", label: "获得积分", val: data.totalPoints || 0, icon: Coins },
                { key: "readingCount", label: "阅读记录", val: data.readingCount || 0, icon: BookOpen },
              ];

              return (
                <motion.div key={report.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className="p-4 hover:bg-bg-warm/30 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                        report.badgeAwarded ? "from-caramel to-amber-400" : "from-gray-300 to-gray-400"
                      } flex items-center justify-center text-white shadow-sm`}>
                        {report.badgeAwarded ? <Medal className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-text-main">
                          {report.type === "STAGE" ? `第${report.stageNumber || "?"}阶段战报` : "总结战报"}
                          {report.badgeAwarded && (
                            <Badge className="ml-2 bg-caramel/10 text-caramel border-caramel/20 text-[9px]">
                              <Star className="w-3 h-3 mr-0.5" />{report.badgeAwarded}
                            </Badge>
                          )}
                        </h4>
                        <p className="text-xs text-text-light">
                          {new Date(report.startDate).toLocaleDateString("zh-CN")} - {new Date(report.endDate).toLocaleDateString("zh-CN")}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-text-light">
                      {new Date(report.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-3">
                    {statFields.map(({ key, label, val, icon: Icon }) => (
                      <div key={key} className="text-center p-2.5 bg-bg-warm/40 rounded-lg border border-border-warm">
                        <Icon className="w-4 h-4 mx-auto mb-1 text-caramel/70" />
                        <div className="text-sm font-bold text-text-main">{val}</div>
                        <div className="text-[9px] text-text-light">{label}</div>
                      </div>
                    ))}
                  </div>

                  {report.parentComment && (
                    <div className="mt-3 bg-card-cream border-l-[3px] border-caramel rounded-lg p-3 text-xs text-text-secondary italic font-serif flex items-start gap-1.5">
                      <Heart className="w-3 h-3 text-caramel mt-0.5 flex-shrink-0" />
                      <span>&ldquo;{report.parentComment}&rdquo;</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </PaperCard>

      <Dialog open={genDialogOpen} onOpenChange={setGenDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif">生成战报</DialogTitle>
            <DialogDescription>选择时间段和数据范围，生成阶段总结</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">类型</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full h-9 rounded-md border border-border-warm bg-white px-3 text-sm focus:border-caramel/40 focus:ring-1 focus:ring-caramel/20">
                <option value="STAGE">阶段战报</option>
                <option value="FINAL">总结战报</option>
              </select>
            </div>
            {form.type === "STAGE" && (
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">阶段编号</label>
                <Input type="number" value={form.stageNumber}
                  onChange={e => setForm(p => ({ ...p, stageNumber: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">开始日期</label>
                <Input type="date" value={form.startDate}
                  onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">结束日期</label>
                <Input type="date" value={form.endDate}
                  onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">家长寄语</label>
              <Textarea value={form.parentComment}
                onChange={e => setForm(p => ({ ...p, parentComment: e.target.value }))}
                placeholder="写一段话鼓励孩子..."
                className="border-border-warm min-h-[80px] focus-visible:ring-caramel/30" />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">颁发徽章</label>
              <select value={form.badgeAwarded}
                onChange={e => setForm(p => ({ ...p, badgeAwarded: e.target.value }))}
                className="w-full h-9 rounded-md border border-border-warm bg-white px-3 text-sm focus:border-caramel/40 focus:ring-1 focus:ring-caramel/20">
                <option value="">不颁发</option>
                {BADGES.map(b => (<option key={b.value} value={b.value}>{b.label}</option>))}
              </select>
            </div>
            <Button className="w-full bg-caramel text-white hover:bg-amber-700"
              onClick={() => generateReport.mutate()}
              disabled={!form.startDate || !form.endDate || generateReport.isPending}>
              {generateReport.isPending ? "生成中..." : "确认生成战报"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
