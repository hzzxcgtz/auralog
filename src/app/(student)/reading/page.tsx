"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import PaperCard from "@/components/shared/PaperCard";
import EmptyState from "@/components/shared/EmptyState";
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Sparkles,
  BookMarked,
  Quote,
  Heart,
  Loader2,
  Hash,
} from "lucide-react";
import Link from "next/link";

export default function ReadingPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    bookId: "", progressRead: "", excerpts: "", thoughts: "",
  });

  const { data: books, isLoading: booksLoading } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      const res = await fetch("/api/books");
      return res.json();
    },
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["reading"],
    queryFn: async () => {
      const res = await fetch("/api/reading");
      return res.json();
    },
  });

  const totalExcerpts = logs?.filter((l: any) => l.excerpts).length || 0;
  const repliedLogs = logs?.filter((l: any) => l.parentComment).length || 0;
  const pendingReview = logs?.filter((l: any) => l.status === "PENDING_REVIEW").length || 0;

  const vocabSet = new Set<string>();
  logs?.forEach((log: any) => {
    if (log.excerpts) {
      const words = log.excerpts.match(/[一-鿿]{2,4}/g);
      words?.forEach((w: string) => {
        if (w.length >= 2) vocabSet.add(w);
      });
    }
  });
  const vocabList = Array.from(vocabSet).slice(0, 16);

  const currentBooks = books?.slice(0, 3) || [];

  const createLog = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: parseInt(form.bookId),
          progressRead: form.progressRead,
          excerpts: form.excerpts || null,
          thoughts: form.thoughts || null,
        }),
      });
      if (!res.ok) throw new Error("创建失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reading"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      setDialogOpen(false);
      setForm({ bookId: "", progressRead: "", excerpts: "", thoughts: "" });
    },
  });

  const isLoading = booksLoading || logsLoading;

  const readingBooks = new Map();
  logs?.forEach((log: any) => {
    const key = log.book?.title || "未知";
    if (!readingBooks.has(key)) {
      const book = books?.find((b: any) => b.id === log.bookId);
      readingBooks.set(key, { title: key, author: book?.author || log.book?.author, total: 0, id: log.bookId });
    }
    readingBooks.get(key).total++;
  });

  return (
    <>
      <header className="flex justify-between items-center mb-5 pb-4 border-b border-border-warm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-text-light hover:text-caramel transition-colors p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-coffee font-serif">阅读手账局</h1>
            <p className="text-[11px] text-text-light">纸间留墨，岁月生香。</p>
          </div>
        </div>
        <button
          onClick={() => setDialogOpen(true)}
          className="inline-flex items-center gap-1 bg-caramel text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 transition-all duration-200 active:scale-[0.97] shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>新建摘录</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          {/* 当前阅读 — 书脊效果 */}
          {isLoading ? (
            <div className="skeleton h-28 rounded-xl" />
          ) : currentBooks.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card-cream border border-border-warm rounded-xl shadow-sm overflow-hidden relative"
            >
              {/* 左侧书脊 */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-caramel to-amber-600" />
              <div className="p-5 pl-6 flex items-center gap-4">
                <div className="w-14 h-20 bg-gradient-to-br from-caramel to-coffee rounded-lg shadow-md flex items-center justify-center text-white font-serif text-[10px] p-2 text-center leading-tight flex-shrink-0">
                  {currentBooks[0].title?.slice(0, 4) || "阅读"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-text-main font-serif truncate">《{currentBooks[0].title}》</h3>
                  <p className="text-xs text-text-light mt-1">
                    {currentBooks[0].author || ""}
                    {currentBooks[0].totalChapters ? ` · 共 ${currentBooks[0].totalChapters} 章` : ""}
                    · 摘录 {logs?.filter((l: any) => l.bookId === currentBooks[0].id).length || 0} 条
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}

          {/* 手账墙标题 */}
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-coffee font-serif flex items-center">
              <Quote className="w-4 h-4 mr-1.5 text-caramel" />
              手账墙
            </h3>
            <span className="text-xs text-text-light">(共 {logs?.length || 0} 条摘录)</span>
            {pendingReview > 0 && (
              <span className="text-[10px] text-orange-500 flex items-center">
                <span className="w-1 h-1 rounded-full bg-orange-500 mr-1 animate-pulse" />
                {pendingReview} 条待回复
              </span>
            )}
          </div>

          {/* 瀑布流手账墙 */}
          <div className="masonry">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="skeleton h-40 rounded-xl" />)}
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="lg:col-span-2">
                <EmptyState
                  icon={<BookOpen className="w-8 h-8" />}
                  title="还没有阅读记录"
                  description="点击「新建摘录」开始记录吧~"
                />
              </div>
            ) : (
              <motion.div
                className="contents"
                variants={staggerContainer}
                initial="initial"
                animate="animate"
              >
                {logs?.map((log: any, idx: number) => (
                  <motion.div key={log.id} variants={listItem} className="masonry-item">
                    <PaperCard
                      variant="paper"
                      elevation="sm"
                      washiTape={log.status === "GRADED"}
                      washiColor={log.status === "GRADED" ? "sage" : "caramel"}
                    >
                      <div className="p-4 mt-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-caramel/10 text-caramel border-caramel/20 text-[9px] font-normal">
                            {log.book?.title || "未知"}
                          </Badge>
                          {log.status === "PENDING_REVIEW" && (
                            <span className="text-[9px] text-orange-500 flex items-center">
                              <span className="w-1 h-1 rounded-full bg-orange-500 mr-1 animate-pulse" />
                              待回复
                            </span>
                          )}
                          {log.status === "GRADED" && (
                            <span className="text-[9px] text-sage flex items-center">
                              <span className="w-1 h-1 rounded-full bg-sage mr-1" />
                              已回复
                            </span>
                          )}
                        </div>

                        {log.progressRead && (
                          <p className="text-[10px] text-text-light mb-2 flex items-center">
                            <BookMarked className="w-3 h-3 mr-1" />
                            {log.progressRead}
                          </p>
                        )}

                        {log.excerpts && (
                          <div className="bg-bg-warm/50 p-3 rounded border-l-[3px] border-caramel/40">
                            <div className="flex items-start gap-1.5">
                              <Quote className="w-3 h-3 text-caramel/60 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-text-secondary leading-relaxed italic font-serif">
                                &ldquo;{log.excerpts}&rdquo;
                              </p>
                            </div>
                          </div>
                        )}

                        {log.thoughts && (
                          <div className="mt-3 text-xs text-text-main leading-relaxed font-serif">
                            {log.thoughts}
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-3 text-[10px] text-text-light">
                          <span>{new Date(log.date).toLocaleDateString("zh-CN")}</span>
                        </div>

                        {/* 家长回信 */}
                        {log.parentComment && (
                          <div className="mt-3 bg-amber-50/50 p-2.5 rounded text-xs text-text-secondary leading-relaxed border-l-[3px] border-caramel/40 pl-3">
                            <span className="font-bold text-caramel flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              [妈妈回信]
                            </span>
                            <span className="mt-1 block">{log.parentComment}</span>
                          </div>
                        )}

                        {/* 等待状态 */}
                        {log.status === "PENDING_REVIEW" && !log.parentComment && (
                          <div className="text-right mt-2 text-[10px] text-sage/80 font-medium flex items-center justify-end">
                            <span className="w-1 h-1 rounded-full bg-sage/80 mr-1.5 animate-pulse" />
                            等待家长回信...
                          </div>
                        )}

                        {/* 积分 */}
                        {log.status === "GRADED" && log.points && (
                          <div className="mt-2 text-right">
                            <span className="text-[10px] font-bold text-caramel flex items-center justify-end">
                              <Sparkles className="w-3 h-3 mr-1" />
                              +{log.points} 流光币
                            </span>
                          </div>
                        )}
                      </div>
                    </PaperCard>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </main>

        {/* 右侧侧边栏 */}
        <aside className="space-y-4">
          {/* 假期书架 */}
          <PaperCard variant="paper" elevation="sm">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-coffee font-serif flex items-center">
                  <BookMarked className="w-4 h-4 mr-1.5 text-caramel" />
                  假期书架
                </h3>
              </div>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="skeleton h-10 rounded" />)}
                  </div>
                ) : currentBooks.length === 0 ? (
                  <p className="text-xs text-text-light text-center py-4">暂无书目</p>
                ) : (
                  currentBooks.map((book: any) => {
                    const bookLogs = logs?.filter((l: any) => l.bookId === book.id) || [];
                    return (
                      <div key={book.id} className="flex items-center gap-3 p-2.5 bg-bg-warm/40 rounded-lg border border-caramel/20 hover:border-caramel/40 transition-colors">
                        <div className="w-8 h-10 bg-gradient-to-br from-caramel to-coffee rounded flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-text-main truncate font-serif">《{book.title}》</h4>
                          <p className="text-[10px] text-caramel">
                            {bookLogs.length > 0 ? `${bookLogs.length} 条摘录` : "待读"}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </PaperCard>

          {/* 手账印记 */}
          <PaperCard variant="caramel" elevation="sm">
            <div className="p-4">
              <h3 className="text-sm font-medium text-coffee font-serif mb-3">手账印记</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-white/50 rounded-lg border border-border-warm">
                  <div className="text-xl font-bold text-caramel font-serif">{logs?.length || 0}</div>
                  <div className="text-[10px] text-text-light mt-1">总摘录数</div>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg border border-border-warm">
                  <div className="text-xl font-bold text-sage font-serif">{repliedLogs}</div>
                  <div className="text-[10px] text-text-light mt-1">已获回信</div>
                </div>
              </div>
            </div>
          </PaperCard>

          {/* 生词花篮 */}
          {vocabList.length > 0 && (
            <PaperCard variant="paper" elevation="sm">
              <div className="p-4">
                <h3 className="text-sm font-medium text-coffee font-serif mb-3 flex items-center">
                  <Hash className="w-4 h-4 mr-1.5 text-caramel" />
                  生词花篮
                </h3>
                <div className="flex flex-wrap gap-2">
                  {vocabList.map((word) => (
                    <span
                      key={word as string}
                      className="px-2.5 py-1 bg-orange-50 text-orange-700 text-[10px] rounded-lg border border-orange-100 font-serif hover:bg-orange-100 transition-colors cursor-default"
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </PaperCard>
          )}
        </aside>
      </div>

      {/* 新建摘录对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif">新建阅读摘录</DialogTitle>
            <DialogDescription>记录阅读中的好词好句和心得感悟</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">选择书目 *</label>
              <select
                value={form.bookId}
                onChange={e => setForm(p => ({ ...p, bookId: e.target.value }))}
                className="w-full h-9 rounded-md border border-border-warm bg-white px-3 text-sm focus:border-caramel/40 focus:ring-1 focus:ring-caramel/20"
              >
                <option value="">请选择</option>
                {books?.map((book: any) => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">阅读进度</label>
              <Input
                value={form.progressRead}
                onChange={e => setForm(p => ({ ...p, progressRead: e.target.value }))}
                placeholder="例如：第 5 章 / 读到第 8 章"
                className="border-border-warm focus-visible:ring-caramel/30"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1 flex items-center">
                <Quote className="w-3 h-3 mr-1" />
                好词好句摘录
              </label>
              <Textarea
                value={form.excerpts}
                onChange={e => setForm(p => ({ ...p, excerpts: e.target.value }))}
                placeholder="输入文中精彩段落或句子..."
                className="border-border-warm min-h-[80px] focus-visible:ring-caramel/30"
              />
            </div>
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">读后感</label>
              <Textarea
                value={form.thoughts}
                onChange={e => setForm(p => ({ ...p, thoughts: e.target.value }))}
                placeholder="读完这段话有什么想法？"
                className="border-border-warm min-h-[80px] focus-visible:ring-caramel/30"
              />
            </div>
            <button
              onClick={() => createLog.mutate()}
              disabled={!form.bookId || createLog.isPending}
              className="w-full inline-flex items-center justify-center gap-1.5 bg-caramel text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-700 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {createLog.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>提交中...</span></>
              ) : (
                <><Plus className="w-4 h-4" /><span>提交摘录</span></>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
