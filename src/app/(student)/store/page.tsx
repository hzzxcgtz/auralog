"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PaperCard from "@/components/shared/PaperCard";
import EmptyState from "@/components/shared/EmptyState";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import {
  ShoppingBag,
  Sparkles,
  Gift,
  Coins,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Lightbulb,
  Settings,
  Heart,
  ShoppingCart,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

export default function StorePage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const studentName = session?.user?.name || "彤";
  const userPoints = (session?.user as any)?.points ?? 185;

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      return res.json();
    },
  });

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return {};
      return res.json();
    },
  });

  const availableRewards = rewards?.filter((r: any) => r.status === "AVAILABLE" && r.stock > 0) || [];
  const redeemedRewards = rewards?.filter((r: any) => r.status !== "AVAILABLE" && r.userId) || [];
  const myPoints = userPoints || 0;

  const totalEarned = (dashboard?.completedTasks || 0) * 10 + 150;
  const spentPoints = redeemedRewards.reduce((s: number, r: any) => s + (r.cost || 0), 0);

  const exchangeReward = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REDEEM", rewardId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "兑换失败");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const [activeCategory, setActiveCategory] = useState("全部");
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; reward: any }>({ open: false, reward: null });

  const categories = ["全部", "娱乐特权", "实物奖品", "学习工具"];

  const handleExchange = (reward: any) => {
    setConfirmDialog({ open: true, reward });
  };

  const confirmExchange = () => {
    if (confirmDialog.reward) {
      exchangeReward.mutate(confirmDialog.reward.id);
    }
    setConfirmDialog({ open: false, reward: null });
  };

  return (
    <>
      <header className="flex justify-between items-center mb-5 pb-4 border-b border-border-warm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white shadow-sm">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-coffee font-serif">时光杂货铺</h1>
            <p className="text-[11px] text-text-light">积攒流光，兑换心愿。</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="flex items-center gap-2 bg-caramel/10 px-3 py-1.5 rounded-lg border border-caramel/20"
          >
            <Coins className="w-4 h-4 text-caramel" />
            <span className="text-sm font-bold text-caramel">{myPoints}</span>
          </motion.div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-caramel to-amber-600 flex items-center justify-center text-white font-medium text-xs shadow-sm">
            {studentName.charAt(0)}
          </div>
        </div>
      </header>

      {/* 余额横幅 */}
      <PaperCard variant="caramel" elevation="sm" className="mb-6">
        <div className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-caramel to-amber-500 flex items-center justify-center text-white shadow-md">
              <Coins className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-coffee font-serif">{studentName} 的流光币余额</h2>
              <p className="text-xs text-text-secondary mt-1">
                累计赚取 <span className="font-medium text-caramel">{totalEarned}</span> 流光币，
                已兑换 <span className="font-medium text-coffee">{spentPoints}</span> 流光币。
              </p>
            </div>
          </div>
        </div>
      </PaperCard>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <main className="lg:col-span-2 space-y-6">
          {/* 分类切换 */}
          <div className="flex items-center gap-4 border-b border-border-warm pb-2 overflow-x-auto scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-sm pb-2 -mb-2 whitespace-nowrap transition-all duration-200 ${
                  cat === activeCategory
                    ? "text-caramel border-b-2 border-caramel font-medium"
                    : "text-text-light hover:text-text-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 商品网格 */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton h-56 rounded-xl" />
              ))}
            </div>
          ) : availableRewards.length === 0 ? (
            <EmptyState
              icon={<Gift className="w-8 h-8" />}
              title="奖品暂未上架 🎁"
              description="等妈妈来添加奖品吧~"
            />
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {availableRewards.map((reward: any) => {
                const canAfford = myPoints >= reward.cost;
                return (
                  <motion.div key={reward.id} variants={listItem}>
                    <PaperCard
                      variant={canAfford ? "caramel" : "paper"}
                      elevation="sm"
                      washiTape={canAfford}
                      washiColor="caramel"
                      className={!canAfford ? "opacity-70" : ""}
                    >
                      <div className="p-4 mt-1 flex flex-col items-center">
                        {/* 图标 */}
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-amber-50 rounded-full flex items-center justify-center mb-3 border border-orange-100">
                          <Gift className={`w-8 h-8 ${canAfford ? "text-caramel/60" : "text-gray-400"}`} />
                        </div>
                        <h4 className="text-sm font-medium text-text-main font-serif text-center">{reward.title}</h4>
                        {reward.stock <= 2 && (
                          <p className="text-[10px] text-orange-500 mt-1">仅剩 {reward.stock} 件</p>
                        )}
                        <div className="flex items-center mt-3 mb-3">
                          <Coins className={`w-3.5 h-3.5 mr-1 ${canAfford ? "text-caramel" : "text-text-secondary"}`} />
                          <span className={`text-base font-bold ${canAfford ? "text-caramel" : "text-text-secondary"}`}>
                            {reward.cost}
                          </span>
                        </div>
                        {canAfford ? (
                          <button
                            onClick={() => handleExchange(reward)}
                            disabled={exchangeReward.isPending}
                            className="w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-caramel text-white hover:bg-amber-700 transition-all duration-200 active:scale-[0.97] shadow-sm disabled:opacity-50"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>立即兑换</span>
                          </button>
                        ) : (
                          <button className="w-full py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-400 cursor-not-allowed" disabled>
                            还差 {reward.cost - myPoints} 币
                          </button>
                        )}
                      </div>
                    </PaperCard>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </main>

        <aside className="space-y-4">
          {/* 我的兑换单 */}
          <PaperCard variant="paper" elevation="sm">
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-coffee font-serif flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-1.5 text-caramel" />
                  我的兑换单
                </h3>
              </div>
              {redeemedRewards.length === 0 ? (
                <p className="text-xs text-text-light text-center py-4">暂无兑换记录</p>
              ) : (
                <div className="space-y-3">
                  {redeemedRewards.slice(0, 5).map((reward: any) => (
                    <div key={reward.id} className="p-2.5 bg-bg-warm/40 rounded-lg border border-border-warm">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-xs font-medium text-text-main flex items-center">
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            reward.status === "PENDING" ? "bg-orange-500 animate-pulse" :
                            reward.status === "APPROVED" ? "bg-sage" :
                            "bg-red-500"
                          }`} />
                          {reward.title}
                        </h4>
                        <span className={`text-[10px] flex items-center ${
                          reward.status === "PENDING" ? "text-orange-600" :
                          reward.status === "APPROVED" ? "text-sage" :
                          "text-red-600"
                        } font-medium`}>
                          {reward.status === "PENDING" ? <><Clock className="w-3 h-3 mr-0.5" />待确认</> :
                           reward.status === "APPROVED" ? <><CheckCircle className="w-3 h-3 mr-0.5" />已完成</> :
                           <><XCircle className="w-3 h-3 mr-0.5" />已拒绝</>}
                        </span>
                      </div>
                      <p className="text-[10px] text-text-light">
                        已扣除 {reward.cost} 币 · {new Date(reward.createdAt).toLocaleDateString("zh-CN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PaperCard>

          {/* 家长奖池管理入口 */}
          <PaperCard variant="coffee" elevation="sm">
            <Link href="/admin/rewards" className="flex items-center gap-3 p-4">
              <div className="w-8 h-8 rounded-lg bg-coffee/10 flex items-center justify-center text-coffee">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-coffee font-serif">家长奖池管理</h4>
                <p className="text-[10px] text-text-light">妈妈可以在这里管理奖品</p>
              </div>
            </Link>
          </PaperCard>

          {/* 小贴士 */}
          <PaperCard variant="paper" elevation="sm" className="border-l-[3px] border-caramel/40">
            <div className="p-4">
              <h4 className="text-xs font-medium text-caramel font-serif mb-2 flex items-center">
                <Lightbulb className="w-3.5 h-3.5 mr-1.5" />
                赚取小贴士
              </h4>
              <ul className="text-[10px] text-text-secondary space-y-1.5 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-caramel mt-0.5 flex-shrink-0" />
                  <span>按时完成任务可获得基础流光币</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Heart className="w-3 h-3 text-sage mt-0.5 flex-shrink-0" />
                  <span>获得家长&ldquo;4星&rdquo;以上评价有额外奖励</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <BookOpen className="w-3 h-3 text-coffee mt-0.5 flex-shrink-0" />
                  <span>坚持每日阅读并记录心得</span>
                </li>
              </ul>
            </div>
          </PaperCard>
        </aside>
      </div>

      {/* 确认兑换对话框 */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ open, reward: null })}>
        <DialogContent className="bg-card-cream border-border-warm max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif">确认兑换</DialogTitle>
            <DialogDescription>
              {confirmDialog.reward && (
                <span>确定要用 <span className="font-bold text-caramel">{confirmDialog.reward.cost}</span> 流光币兑换「{confirmDialog.reward.title}」吗？</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDialog({ open: false, reward: null })}
              className="flex-1 py-2 rounded-lg text-xs font-medium bg-bg-warm text-text-secondary border border-border-warm hover:bg-bg-warm/80 transition-colors"
            >
              取消
            </button>
            <button
              onClick={confirmExchange}
              disabled={exchangeReward.isPending}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium bg-caramel text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {exchangeReward.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>兑换中...</span></>
              ) : (
                <><ShoppingCart className="w-3.5 h-3.5" /><span>确认兑换</span></>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
