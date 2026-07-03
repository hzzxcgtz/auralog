"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import PaperCard from "@/components/shared/PaperCard";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import {
  ArrowLeft,
  BarChart3,
  Clock,
  Target,
  Coins,
  BookOpen,
  Quote,
  Heart,
  Star,
  Frown,
  Loader2,
} from "lucide-react";

export default function ReportPage() {
  const params = useParams();
  const id = params.id;

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${id}`);
      if (!res.ok) throw new Error("加载失败");
      return res.json();
    },
    enabled: !!id,
  });

  const data = (() => {
    if (!report?.dataSnapshot) return null;
    try { return JSON.parse(report.dataSnapshot); }
    catch { return null; }
  })();

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <Loader2 className="w-8 h-8 text-caramel animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-light">加载战报中...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-caramel/8 to-amber-500/8 flex items-center justify-center mx-auto mb-4 border border-caramel/15">
          <Frown className="w-10 h-10 text-caramel" />
        </div>
        <h2 className="text-lg font-bold text-coffee font-serif mb-2">战报未找到</h2>
        <p className="text-xs text-text-light mb-4">可能已被删除或链接有误</p>
        <Link href="/" className="inline-flex items-center gap-1 text-xs text-caramel hover:text-amber-700 font-medium transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回首页</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-5 pb-4 border-b border-border-warm">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-text-light hover:text-caramel transition-colors p-1 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-coffee font-serif">成长战报</h1>
            <p className="text-[11px] text-text-light">记录每一步成长。</p>
          </div>
        </div>
      </header>

      <motion.div
        className="space-y-6"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* 阶段标识 */}
        <motion.div variants={listItem}>
          <PaperCard variant="caramel" elevation="md">
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-caramel to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white font-serif">{report.stageNumber || "?"}</span>
              </div>
              <h2 className="text-xl font-bold text-coffee font-serif">
                {report.type === "STAGE" ? `第${report.stageNumber || "?"}阶段战报` : "总结战报"}
              </h2>
              <p className="text-xs text-text-light mt-2">
                {new Date(report.startDate).toLocaleDateString("zh-CN")} - {new Date(report.endDate).toLocaleDateString("zh-CN")}
              </p>
            </div>
          </PaperCard>
        </motion.div>

        {/* 数据卡片 2x2 */}
        <motion.div variants={listItem} className="grid grid-cols-2 gap-4">
          <PaperCard variant="paper" elevation="sm" accentBar>
            <div className="p-5 pl-6 text-center">
              <Target className="w-6 h-6 text-caramel mx-auto mb-2" />
              <div className="text-3xl font-bold text-caramel font-serif">{data?.completedTasks || 0}</div>
              <div className="text-xs text-text-secondary mt-1">完成任务总数</div>
            </div>
          </PaperCard>
          <PaperCard variant="paper" elevation="sm" accentBar>
            <div className="p-5 pl-6 text-center">
              <Clock className="w-6 h-6 text-sage mx-auto mb-2" />
              <div className="text-3xl font-bold text-sage font-serif">{data?.totalFocusHours || 0}</div>
              <div className="text-xs text-text-secondary mt-1">总学习时长 (h)</div>
            </div>
          </PaperCard>
        </motion.div>

        <motion.div variants={listItem} className="grid grid-cols-2 gap-4">
          <PaperCard variant="paper" elevation="sm" accentBar>
            <div className="p-5 pl-6 text-center">
              <Coins className="w-6 h-6 text-coffee mx-auto mb-2" />
              <div className="text-3xl font-bold text-coffee font-serif">{data?.totalPoints || 0}</div>
              <div className="text-xs text-text-secondary mt-1">获得流光币</div>
            </div>
          </PaperCard>
          <PaperCard variant="paper" elevation="sm" accentBar>
            <div className="p-5 pl-6 text-center">
              <BarChart3 className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <div className="text-3xl font-bold text-orange-500 font-serif">{data?.completionRate || 0}%</div>
              <div className="text-xs text-text-secondary mt-1">任务完成率</div>
            </div>
          </PaperCard>
        </motion.div>

        {/* 阅读概览 */}
        <motion.div variants={listItem}>
          <PaperCard variant="paper" elevation="sm">
            <div className="p-5">
              <h3 className="text-sm font-medium text-coffee font-serif mb-4 flex items-center">
                <BookOpen className="w-4 h-4 mr-1.5 text-caramel" />
                阅读概览
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-bg-warm/50 rounded-lg border border-border-warm">
                  <Quote className="w-5 h-5 text-caramel mx-auto mb-1" />
                  <div className="text-lg font-bold text-caramel font-serif">{data?.readingCount || 0}</div>
                  <div className="text-[10px] text-text-light">阅读记录</div>
                </div>
                <div className="text-center p-4 bg-bg-warm/50 rounded-lg border border-border-warm">
                  <Star className="w-5 h-5 text-sage mx-auto mb-1" />
                  <div className="text-lg font-bold text-sage font-serif">{data?.excerptsCount || 0}</div>
                  <div className="text-[10px] text-text-light">摘录好词好句</div>
                </div>
              </div>
              {(data?.booksRead || 0) > 0 && (
                <p className="text-xs text-text-light mt-3 text-center">共阅读了 {data.booksRead} 本书</p>
              )}
            </div>
          </PaperCard>
        </motion.div>

        {/* 家长寄语 */}
        {report.parentComment && (
          <motion.div variants={listItem}>
            <PaperCard variant="caramel" elevation="sm" className="border-l-[4px] border-caramel">
              <div className="p-6">
                <h3 className="text-sm font-medium text-caramel font-serif mb-3 flex items-center">
                  <Heart className="w-4 h-4 mr-1.5" />
                  家长寄语
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed italic font-serif">
                  &ldquo;{report.parentComment}&rdquo;
                </p>
              </div>
            </PaperCard>
          </motion.div>
        )}

        {/* 徽章 */}
        {report.badgeAwarded && (
          <motion.div variants={listItem}>
            <PaperCard variant="paper" elevation="sm">
              <div className="p-8 text-center">
                <h3 className="text-sm font-medium text-coffee font-serif mb-4">获得徽章</h3>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-caramel to-amber-400 flex items-center justify-center mx-auto shadow-lg animate-coin-shine">
                  <Star className="w-10 h-10 text-white" />
                </div>
                <p className="text-sm font-bold text-caramel mt-4 font-serif">{report.badgeAwarded}</p>
              </div>
            </PaperCard>
          </motion.div>
        )}

        {/* 无数据兜底 */}
        {!data && (
          <motion.div variants={listItem}>
            <PaperCard variant="paper" elevation="sm" className="border border-dashed">
              <div className="p-10 text-center">
                <BarChart3 className="w-8 h-8 text-text-light mx-auto mb-2" />
                <p className="text-xs text-text-light">暂无详细数据</p>
              </div>
            </PaperCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
