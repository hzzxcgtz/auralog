"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PaperCard from "@/components/shared/PaperCard";
import { useToast } from "@/components/shared/ToastProvider";
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  KeyRound,
  Loader2,
  Coins,
  UserPlus,
  Tags,
  AlertTriangle,
  RefreshCw,
  Bookmark,
  Palette,
  ChevronRight,
  GripVertical,
} from "lucide-react";

const COLOR_THEMES = [
  { value: "orange", label: "橙", css: "bg-orange-400", ring: "ring-orange-300", light: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "caramel", label: "焦糖", css: "bg-amber-600", ring: "ring-amber-300", light: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "emerald", label: "翠绿", css: "bg-emerald-500", ring: "ring-emerald-300", light: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "teal", label: "青绿", css: "bg-teal-500", ring: "ring-teal-300", light: "bg-teal-50 text-teal-700 border-teal-200" },
  { value: "sky", label: "天蓝", css: "bg-sky-500", ring: "ring-sky-300", light: "bg-sky-50 text-sky-700 border-sky-200" },
  { value: "blue", label: "蓝", css: "bg-blue-500", ring: "ring-blue-300", light: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "indigo", label: "靛蓝", css: "bg-indigo-500", ring: "ring-indigo-300", light: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "purple", label: "紫", css: "bg-purple-500", ring: "ring-purple-300", light: "bg-purple-50 text-purple-700 border-purple-200" },
  { value: "pink", label: "粉", css: "bg-pink-400", ring: "ring-pink-300", light: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "rose", label: "玫红", css: "bg-rose-500", ring: "ring-rose-300", light: "bg-rose-50 text-rose-700 border-rose-200" },
];

type TabKey = "students" | "categories";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>("students");

  // ── 学生管理状态 ──
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPwdOpen, setResetPwdOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [createForm, setCreateForm] = useState({ username: "", name: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", username: "", points: "" });
  const [resetForm, setResetForm] = useState({ password: "", confirmPassword: "" });

  // ── 任务类别状态 ──
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ label: "", color: "blue" });

  // ── 系统初始化状态 ──
  const [initConfirmOpen, setInitConfirmOpen] = useState(false);

  // ── 数据查询 ──
  const { data: students, isLoading } = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      return res.ok ? res.json() : [];
    },
  });

  // ── Mutations ──
  const createStudent = useMutation({
    mutationFn: async () => {
      if (createForm.password.length < 6) throw new Error("密码至少 6 位");
      const res = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "创建失败"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setCreateDialogOpen(false);
      setCreateForm({ username: "", name: "", password: "" });
      toast.success("学生账号已创建", "新同学加入啦，欢迎 👋");
    },
    onError: (err: Error) => { toast.error("创建失败", err.message); },
  });

  const updateStudent = useMutation({
    mutationFn: async () => {
      if (!editingStudent) return;
      const res = await fetch(`/api/admin/users/${editingStudent.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, username: editForm.username, points: editForm.points ? parseInt(editForm.points) : undefined }),
      });
      if (!res.ok) throw new Error("更新失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setEditDialogOpen(false);
      setEditingStudent(null);
      toast.success("学生信息已更新", "资料已保存 📝");
    },
  });

  const resetPassword = useMutation({
    mutationFn: async () => {
      if (!editingStudent) return;
      if (resetForm.password.length < 6) throw new Error("密码至少 6 位");
      if (resetForm.password !== resetForm.confirmPassword) throw new Error("两次密码不一致");
      const res = await fetch(`/api/admin/users/${editingStudent.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetForm.password }),
      });
      if (!res.ok) throw new Error("重置失败");
      return res.json();
    },
    onSuccess: () => {
      setResetPwdOpen(false);
      setEditingStudent(null);
      setResetForm({ password: "", confirmPassword: "" });
      toast.success("密码已重置", "新密码已生效 🔑");
    },
    onError: (err: Error) => { toast.error("重置失败", err.message); },
  });

  const deleteStudent = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("学生已删除", "账号已移除 🍃");
    },
  });

  const createCategory = useMutation({
    mutationFn: async () => {
      if (!catForm.label) throw new Error("请填写类别名称");
      const autoValue = catForm.label.replace(/\s+/g, "_").toUpperCase();
      const res = await fetch("/api/admin/categories", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...catForm, value: autoValue }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "创建失败"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setCatDialogOpen(false);
      setCatForm({ label: "", color: "blue" });
      toast.success("任务类别已添加", "新的分类已生效 📋");
    },
    onError: (err: Error) => { toast.error("创建失败", err.message); },
  });

  const updateCategory = useMutation({
    mutationFn: async () => {
      if (!editingCat) return;
      const res = await fetch(`/api/admin/categories/${editingCat.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: catForm.label, color: catForm.color }),
      });
      if (!res.ok) throw new Error("更新失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      setCatDialogOpen(false);
      setEditingCat(null);
      toast.success("任务类别已更新", "已保存 📝");
    },
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("删除失败");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      toast.success("任务类别已删除", "已移除 🗑️");
    },
  });

  // ── 拖拽排序（插入线） ──
  const [dragCatId, setDragCatId] = useState<number | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{ beforeId: number | null } | null>(null);
  const catCardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const reorderCategories = useMutation({
    mutationFn: async (orderedIds: number[]) => {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      });
      if (!res.ok) throw new Error("排序失败");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });

  const handleCatDragStart = (catId: number) => {
    setDragCatId(catId);
  };

  const handleCatDragOver = (e: React.DragEvent, catId: number) => {
    e.preventDefault();
    if (dragCatId === catId) return;
    // 判断鼠标在目标卡的上半还是下半
    const el = catCardRefs.current.get(catId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const beforeId = e.clientY < midY ? catId : null;
    setDropIndicator({ beforeId });
  };

  const handleCatDragLeave = (e: React.DragEvent, catId: number) => {
    // 只有当鼠标真的离开了整个卡片区域才清除
    const el = catCardRefs.current.get(catId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (
      clientX < rect.left || clientX > rect.right ||
      clientY < rect.top || clientY > rect.bottom
    ) {
      setDropIndicator(null);
    }
  };

  const handleCatDrop = () => {
    if (!dragCatId || !categories) { resetDrag(); return; }

    const ids = categories.map((c: any) => c.id);
    const fromIdx = ids.indexOf(dragCatId);
    if (fromIdx === -1) { resetDrag(); return; }

    // 计算新顺序
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    const newToIdx = dropIndicator?.beforeId !== null && dropIndicator?.beforeId !== undefined
      ? newIds.indexOf(dropIndicator.beforeId)
      : newIds.length;
    if (newToIdx < 0 || fromIdx === (newToIdx >= fromIdx ? newToIdx + 1 : newToIdx)) { resetDrag(); return; }
    newIds.splice(newToIdx, 0, dragCatId);

    // 乐观更新：立即重排缓存，避免闪动
    const ordered = newIds
      .map((id: number) => categories.find((c: any) => c.id === id))
      .filter(Boolean);
    queryClient.setQueryData(["admin", "categories"], ordered);

    resetDrag(); // 清除拖拽状态
    reorderCategories.mutate(newIds); // 后台持久化
  };

  const handleCatDragEnd = () => {
    resetDrag();
  };

  const resetDrag = () => {
    setDragCatId(null);
    setDropIndicator(null);
  };

  const resetSystem = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/init", { method: "POST" });
      if (!res.ok) throw new Error("重置失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setInitConfirmOpen(false);
      toast.info("系统已初始化", "所有数据已清空，请重新运行种子数据");
    },
    onError: (err: Error) => { toast.error("重置失败", err.message); },
  });

  const totalPoints = students?.reduce((s: number, u: any) => s + (u.points || 0), 0) || 0;

  const openEdit = (student: any) => {
    setEditingStudent(student);
    setEditForm({ name: student.name, username: student.username, points: student.points?.toString() || "0" });
    setEditDialogOpen(true);
  };

  const openResetPwd = (student: any) => {
    setEditingStudent(student);
    setResetForm({ password: "", confirmPassword: "" });
    setResetPwdOpen(true);
  };

  const TABS: { key: TabKey; icon: any; label: string; desc: string }[] = [
    { key: "students", icon: Users, label: "学生管理", desc: "创建和管理学生账号" },
    { key: "categories", icon: Tags, label: "任务类别", desc: "配置任务分类和颜色" },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* ═══ 顶部 ═══ */}
      <header className="flex items-center justify-between mb-6 pb-5 border-b border-border-warm">
        <div>
          <h1 className="text-lg font-bold text-coffee font-serif tracking-wide">系统设置</h1>
          <p className="text-xs text-text-light mt-1">管理学生账号、配置任务类别、维护系统数据</p>
        </div>
      </header>

      {/* ═══ Tab 导航（卡片式） ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                isActive
                  ? "bg-card-cream border-caramel/30 shadow-sm"
                  : "bg-card-cream/60 border-border-warm hover:border-caramel/20 hover:shadow-sm"
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isActive ? "bg-caramel/10 text-caramel" : "bg-bg-warm text-text-light"
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-main">{tab.label}</div>
                <div className="text-[10px] text-text-light mt-0.5">{tab.desc}</div>
              </div>
              {isActive && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full bg-caramel/60" />
              )}
            </button>
          );
        })}
        <button onClick={() => setInitConfirmOpen(true)}
          className="flex items-center gap-3 p-4 rounded-xl border border-border-warm bg-card-cream/60 hover:border-red-200 hover:shadow-sm text-left transition-all group">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-400 group-hover:bg-red-100 group-hover:text-red-500 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-main group-hover:text-red-600 transition-colors">系统初始化</div>
            <div className="text-[10px] text-text-light mt-0.5">清空所有数据并重置</div>
          </div>
          <ChevronRight className="w-4 h-4 text-text-light/40 group-hover:text-red-300 transition-colors" />
        </button>
      </div>

      {/* ════════════════════════════════════════ */}
      {/* Tab: 学生管理 */}
      {/* ════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
      {activeTab === "students" && (
        <motion.div key="students" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {/* 概览卡片 */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <PaperCard variant="paper" elevation="sm">
              <div className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-caramel/20 to-amber-500/10 flex items-center justify-center border border-caramel/10">
                  <Users className="w-6 h-6 text-caramel/70" />
                </div>
                <div>
                  <p className="text-[10px] text-text-light font-medium tracking-wide">学生总数</p>
                  <p className="text-2xl font-bold font-serif text-caramel/80 mt-0.5">{students?.length || 0}</p>
                </div>
              </div>
            </PaperCard>
            <PaperCard variant="paper" elevation="sm">
              <div className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sage/20 to-emerald-500/10 flex items-center justify-center border border-sage/10">
                  <Coins className="w-6 h-6 text-sage/70" />
                </div>
                <div>
                  <p className="text-[10px] text-text-light font-medium tracking-wide">总流光币</p>
                  <p className="text-2xl font-bold font-serif text-sage/80 mt-0.5">{totalPoints}</p>
                </div>
              </div>
            </PaperCard>
          </div>

          {/* 操作 + 列表 */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-text-main flex items-center gap-1.5">
              <Users className="w-4 h-4 text-caramel/60" />
              已创建的学生账号
            </h3>
            <Button className="bg-caramel/10 text-caramel font-medium text-xs hover:bg-caramel/20"
              onClick={() => { setCreateForm({ username: "", name: "", password: "" }); setCreateDialogOpen(true); }}>
              <UserPlus className="w-3.5 h-3.5 mr-1" />新建学生
            </Button>
          </div>

          <PaperCard variant="paper" elevation="sm">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 gap-2 text-text-light text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />加载中...
              </div>
            ) : students?.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-bg-warm flex items-center justify-center mb-3 border border-border-warm">
                  <Users className="w-6 h-6 text-text-light" />
                </div>
                <p className="text-xs text-text-light">还没有学生账号</p>
                <p className="text-[10px] text-text-light/60 mt-1">点击「新建学生」开始创建</p>
              </div>
            ) : (
              <div className="divide-y divide-border-warm/60">
                {students?.map((student: any, idx: number) => (
                  <motion.div key={student.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg-warm/50 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm shrink-0">
                      {student.name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-text-main font-medium">{student.name}</span>
                        <span className="text-[10px] text-text-light/50 bg-bg-warm px-1.5 py-0.5 rounded">@{student.username}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-[10px] text-text-light">
                          <Coins className="w-3 h-3" />{student.points || 0} 流光币
                        </span>
                        <span className="text-text-light/30">·</span>
                        <span className="text-[10px] text-text-light">创建于 {new Date(student.createdAt).toLocaleDateString("zh-CN")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(student)}
                        className="p-1.5 text-text-light hover:text-caramel hover:bg-caramel/5 rounded-lg transition-colors" title="编辑">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openResetPwd(student)}
                        className="p-1.5 text-text-light hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="重置密码">
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => {
                        if (confirm(`确定删除学生「${student.name}」及其所有数据？此操作不可恢复！`)) deleteStudent.mutate(student.id);
                      }} className="p-1.5 text-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </PaperCard>
        </motion.div>
      )}

      {/* ════════════════════════════════════════ */}
      {/* Tab: 任务类别 */}
      {/* ════════════════════════════════════════ */}
      {activeTab === "categories" && (
        <motion.div key="categories" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {/* 类别说明 */}
          <PaperCard variant="paper" elevation="sm" className="mb-4">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bookmark className="w-4 h-4 text-caramel/60" />
                <span className="text-sm font-medium text-text-main">任务类别配置</span>
              </div>
              <p className="text-[10px] text-text-light leading-relaxed">
                自定义任务的分类体系。预设了「校内作业」「新课预习」「教辅练习」「阅读」四项基础类别，你可以在这里修改名称、颜色，或添加新的类别。
              </p>
            </div>
          </PaperCard>

          {/* 操作栏 */}
          <div className="flex justify-end mb-3">
            <Button className="bg-caramel/10 text-caramel font-medium text-xs hover:bg-caramel/20"
              onClick={() => { setEditingCat(null); setCatForm({ label: "", color: "blue" }); setCatDialogOpen(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" />添加类别
            </Button>
          </div>

          {/* 类别卡片网格 */}
          {catLoading ? (
            <div className="flex items-center justify-center py-10 gap-2 text-text-light text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />加载中...
            </div>
          ) : categories?.length === 0 ? (
            <PaperCard variant="paper" elevation="sm">
              <div className="flex flex-col items-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-bg-warm flex items-center justify-center mb-3 border border-border-warm">
                  <Tags className="w-6 h-6 text-text-light" />
                </div>
                <p className="text-xs text-text-light">还没有任务类别</p>
                <p className="text-[10px] text-text-light/60 mt-1">点击「添加类别」开始配置</p>
              </div>
            </PaperCard>
          ) : (
            <div className="space-y-2">
              {categories?.map((cat: any, idx: number) => {
                const theme = COLOR_THEMES.find(c => c.value === cat.color) || COLOR_THEMES[0];
                const isDrag = dragCatId === cat.id;
                const showBefore = dropIndicator?.beforeId === cat.id;
                const showAfter = !showBefore && dropIndicator !== null && idx === categories.length - 1 && dropIndicator.beforeId === null;
                return (
                  <div key={cat.id} ref={(el) => { if (el) catCardRefs.current.set(cat.id, el); else catCardRefs.current.delete(cat.id); }}
                    className="relative"
                  >
                    {/* 插入线（上方） */}
                    {showBefore && (
                      <div className="absolute -top-[3px] left-0 right-0 z-10 flex items-center pointer-events-none">
                        <div className="h-[3px] flex-1 rounded-full bg-caramel" />
                        <div className="w-2 h-2 rounded-full bg-caramel shadow-sm -ml-1" />
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.05 }}
                      draggable
                      onDragStart={() => handleCatDragStart(cat.id)}
                      onDragOver={(e) => handleCatDragOver(e, cat.id)}
                      onDragLeave={(e) => handleCatDragLeave(e, cat.id)}
                      onDrop={handleCatDrop}
                      onDragEnd={handleCatDragEnd}
                      className={`transition-all duration-150 ${isDrag ? "opacity-40" : ""}`}
                    >
                    <PaperCard variant="paper" elevation="sm" className="group border border-border-warm">
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* 拖拽手柄 */}
                            <span className="text-text-light/40 hover:text-text-light cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
                              title="拖拽调整顺序">
                              <GripVertical className="w-4 h-4" />
                            </span>
                            {/* 颜色小方块 */}
                            <div className={`w-4 h-4 rounded ${theme.css} shadow-sm shrink-0`} />
                            <span className="text-sm font-medium text-text-main">{cat.label}</span>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => {
                              setEditingCat(cat);
                              setCatForm({ label: cat.label, color: cat.color });
                              setCatDialogOpen(true);
                            }} className="p-1.5 text-text-light hover:text-caramel hover:bg-caramel/5 rounded-lg transition-colors" title="编辑">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => {
                              if (confirm(`确定删除类别「${cat.label}」？已有的任务仍会保留此分类信息。`)) deleteCategory.mutate(cat.id);
                            }} className="p-1.5 text-text-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="删除">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </PaperCard>
                  </motion.div>
                    {/* 插入线（下方 — 拖到最后一项之后） */}
                    {showAfter && (
                      <div className="absolute -bottom-[3px] left-0 right-0 z-10 flex items-center pointer-events-none">
                        <div className="h-[3px] flex-1 rounded-full bg-caramel" />
                        <div className="w-2 h-2 rounded-full bg-caramel shadow-sm -ml-1" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* ═══ 创建学生 Dialog ═══ */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-caramel/10 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-caramel" />
              </div>
              创建学生账号
            </DialogTitle>
            <DialogDescription>添加新的学生，学生可以使用用户名和密码登录。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">显示姓名 *</label>
              <Input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                placeholder="彤彤" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">用户名 *</label>
              <Input value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))}
                placeholder="tong" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">密码 *（至少 6 位）</label>
              <Input type="password" value={createForm.password}
                onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                placeholder="设置登录密码" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <Button className="w-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20"
              onClick={() => createStudent.mutate()}
              disabled={!createForm.name || !createForm.username || !createForm.password || createStudent.isPending}>
              {createStudent.isPending ? "创建中..." : "创建账号"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 编辑学生 Dialog ═══ */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-caramel/10 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-caramel" />
              </div>
              编辑学生信息
            </DialogTitle>
            <DialogDescription>修改姓名、用户名或积分</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">显示姓名</label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">用户名</label>
              <Input value={editForm.username} onChange={e => setEditForm(p => ({ ...p, username: e.target.value }))}
                className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">流光币</label>
              <Input type="number" value={editForm.points}
                onChange={e => setEditForm(p => ({ ...p, points: e.target.value }))}
                className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <Button className="w-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20"
              onClick={() => updateStudent.mutate()}
              disabled={!editForm.name || updateStudent.isPending}>
              {updateStudent.isPending ? "保存中..." : "保存修改"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 重置密码 Dialog ═══ */}
      <Dialog open={resetPwdOpen} onOpenChange={setResetPwdOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-caramel/10 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-caramel" />
              </div>
              重置密码
            </DialogTitle>
            <DialogDescription>为 {editingStudent?.name || "该学生"} 设置新密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">新密码 *</label>
              <Input type="password" value={resetForm.password}
                onChange={e => setResetForm(p => ({ ...p, password: e.target.value }))}
                placeholder="至少 6 位" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">确认密码 *</label>
              <Input type="password" value={resetForm.confirmPassword}
                onChange={e => setResetForm(p => ({ ...p, confirmPassword: e.target.value }))}
                placeholder="再次输入密码" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <Button className="w-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20"
              onClick={() => resetPassword.mutate()}
              disabled={!resetForm.password || !resetForm.confirmPassword || resetPassword.isPending}>
              {resetPassword.isPending ? "重置中..." : "确认重置"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 任务类别 Dialog ═══ */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-caramel/10 flex items-center justify-center">
                <Tags className="w-4 h-4 text-caramel" />
              </div>
              {editingCat ? "编辑任务类别" : "添加任务类别"}
            </DialogTitle>
            <DialogDescription>{editingCat ? "修改类别名称或颜色" : "新增一个任务分类"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1.5">名称 *</label>
              <Input value={catForm.label} onChange={e => setCatForm(p => ({ ...p, label: e.target.value }))}
                placeholder="校内作业" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-2 flex items-center gap-1">
                <Palette className="w-3 h-3" />颜色
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_THEMES.map(c => (
                  <button key={c.value} onClick={() => setCatForm(p => ({ ...p, color: c.value }))}
                    className={`w-9 h-9 rounded-xl transition-all ${c.css} ${
                      catForm.color === c.value
                        ? `ring-2 ring-caramel ring-offset-2 scale-110 shadow-sm`
                        : "opacity-50 hover:opacity-80 hover:scale-105"
                    }`} title={c.label} />
                ))}
              </div>
            </div>
            <Button className="w-full bg-caramel/10 text-caramel font-medium hover:bg-caramel/20"
              onClick={() => (editingCat ? updateCategory : createCategory).mutate()}
              disabled={!catForm.label || createCategory.isPending || updateCategory.isPending}>
              {createCategory.isPending || updateCategory.isPending ? "保存中..." : editingCat ? "保存修改" : "添加类别"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ 系统初始化 Dialog ═══ */}
      <Dialog open={initConfirmOpen} onOpenChange={setInitConfirmOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              确认初始化系统
            </DialogTitle>
            <DialogDescription>
              此操作将<strong>清空所有数据</strong>，包括任务、阅读记录、奖品、学生账号等，且不可恢复。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 text-xs text-red-700">
              <p className="font-medium mb-2 flex items-center gap-1">⚠️ 将会清空以下数据：</p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-red-600/70">
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />每日任务及照片</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />阅读手账记录</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />所有学生账号</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />书目和奖品</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />假期和事件</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />成长战报</li>
                <li className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />任务类别配置</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 border-border-warm text-text-secondary text-xs"
                onClick={() => setInitConfirmOpen(false)}>取消</Button>
              <Button className="flex-1 bg-red-600 text-white hover:bg-red-700 text-xs"
                onClick={() => resetSystem.mutate()}
                disabled={resetSystem.isPending}>
                {resetSystem.isPending ? "清空中..." : "确认清空"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
