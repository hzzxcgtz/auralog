"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PaperCard from "@/components/shared/PaperCard";
import StatsCard from "@/components/shared/StatsCard";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  BookMarked,
  BookHeart,
} from "lucide-react";

export default function BooksPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", author: "", isRequired: false,
    totalChapters: "", totalPages: "", studentId: "",
  });

  const { data: books, isLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const res = await fetch("/api/books");
      return res.json();
    },
  });

  const saveBook = useMutation({
    mutationFn: async () => {
      const body = {
        title: form.title,
        author: form.author || null,
        isRequired: form.isRequired,
        totalChapters: form.totalChapters ? parseInt(form.totalChapters) : null,
        totalPages: form.totalPages ? parseInt(form.totalPages) : null,
        studentId: form.studentId ? parseInt(form.studentId) : null,
      };
      if (editingBook) {
        const res = await fetch(`/api/books/${editingBook.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("更新失败");
        return res.json();
      }
      const res = await fetch("/api/books", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("创建失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteBook = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/books/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["books"] }),
  });

  const resetForm = () => {
    setForm({ title: "", author: "", isRequired: false, totalChapters: "", totalPages: "", studentId: "" });
    setEditingBook(null);
  };

  const openEdit = (book: any) => {
    setEditingBook(book);
    setForm({
      title: book.title, author: book.author || "",
      isRequired: book.isRequired,
      totalChapters: book.totalChapters?.toString() || "",
      totalPages: book.totalPages?.toString() || "",
      studentId: book.studentId?.toString() || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-5 pb-4 border-b border-border-warm">
        <div>
          <h1 className="text-base font-bold text-coffee font-serif">书单管理</h1>
          <p className="text-xs text-text-light">管理课外阅读书目，标记必读/选读。</p>
        </div>
        <Button
          className="bg-caramel text-white text-xs hover:bg-amber-700"
          onClick={() => { resetForm(); setDialogOpen(true); }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          添加书目
        </Button>
      </header>

      {/* 统计卡片 */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={listItem}>
          <StatsCard
            icon={<BookOpen className="w-full h-full" />}
            label="总书目"
            value={books?.length || 0}
            accentColor="caramel"
          />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard
            icon={<BookMarked className="w-full h-full" />}
            label="必读书目"
            value={books?.filter((b: any) => b.isRequired).length || 0}
            accentColor="sage"
          />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard
            icon={<BookHeart className="w-full h-full" />}
            label="选读书目"
            value={books?.filter((b: any) => !b.isRequired).length || 0}
            accentColor="coffee"
          />
        </motion.div>
      </motion.div>

      {/* 书单列表 — 卡片行风格 */}
      <PaperCard variant="paper" elevation="sm">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-5 h-5 text-caramel animate-spin mx-auto" />
          </div>
        ) : books?.length === 0 ? (
          <div className="text-center py-12 text-text-light text-xs">暂无书目，点击上方添加</div>
        ) : (
          <div className="divide-y divide-border-warm">
            {books?.map((book: any, idx: number) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.03 }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-bg-warm/40 transition-colors"
              >
                {/* 书脊色条 */}
                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                  book.isRequired ? "bg-caramel" : "bg-sage"
                }`} />
                {/* 书名 */}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-text-main font-serif font-medium">{book.title}</span>
                  {book.author && (
                    <span className="text-xs text-text-light ml-2">{book.author}</span>
                  )}
                </div>
                {/* 类型 */}
                <Badge className={`text-[10px] font-medium flex-shrink-0 ${
                  book.isRequired
                    ? "bg-caramel/10 text-caramel border-caramel/20"
                    : "bg-sage/10 text-sage border-sage/20"
                }`}>
                  {book.isRequired ? "必读" : "选读"}
                </Badge>
                {/* 章节/页数 */}
                <span className="text-[11px] text-text-light flex-shrink-0 w-16 text-right">
                  {book.totalChapters ? `${book.totalChapters}章` : "—"}
                  {book.totalPages ? `/${book.totalPages}p` : ""}
                </span>
                {/* 操作 */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(book)}
                    className="p-1.5 text-text-light hover:text-caramel hover:bg-caramel/5 rounded transition-colors"
                    title="编辑"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定删除《${book.title}》？`)) deleteBook.mutate(book.id);
                    }}
                    className="p-1.5 text-text-light hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </PaperCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif">
              {editingBook ? "编辑书目" : "添加书目"}
            </DialogTitle>
            <DialogDescription>
              {editingBook ? "修改书目信息" : "添加新的课外阅读书目"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">书名 *</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="输入书名" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">作者</label>
                <Input value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))}
                  placeholder="老舍" className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isRequired}
                    onChange={e => setForm(p => ({ ...p, isRequired: e.target.checked }))}
                    className="rounded border-border-warm text-caramel accent-caramel" />
                  <span className="text-xs text-text-secondary">标记为必读</span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">总章数</label>
                <Input type="number" value={form.totalChapters}
                  onChange={e => setForm(p => ({ ...p, totalChapters: e.target.value }))}
                  placeholder="24" className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">总页数</label>
                <Input type="number" value={form.totalPages}
                  onChange={e => setForm(p => ({ ...p, totalPages: e.target.value }))}
                  placeholder="300" className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
            </div>
            <Button className="w-full bg-caramel text-white hover:bg-amber-700"
              onClick={() => saveBook.mutate()}
              disabled={!form.title || saveBook.isPending}>
              {saveBook.isPending ? "保存中..." : editingBook ? "更新书目" : "添加书目"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
