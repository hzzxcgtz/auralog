"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PaperCard from "@/components/shared/PaperCard";
import StatsCard from "@/components/shared/StatsCard";
import { staggerContainer, listItem } from "@/lib/motionVariants";
import {
  Gift,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Coins,
  Package,
  Clock,
} from "lucide-react";

export default function RewardsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<any>(null);
  const [form, setForm] = useState({ title: "", cost: "", stock: "1" });

  const { data: rewards, isLoading } = useQuery({
    queryKey: ["rewards"],
    queryFn: async () => {
      const res = await fetch("/api/rewards");
      return res.json();
    },
  });

  const availableRewards = rewards?.filter((r: any) => r.status === "AVAILABLE") || [];
  const pendingRewards = rewards?.filter((r: any) => r.status === "PENDING") || [];
  const processedRewards = rewards?.filter((r: any) => r.status === "APPROVED" || r.status === "REJECTED") || [];

  const saveReward = useMutation({
    mutationFn: async () => {
      const body = { action: "CREATE", title: form.title, cost: parseInt(form.cost), stock: parseInt(form.stock) || 1 };
      if (editingReward) {
        const res = await fetch(`/api/rewards/${editingReward.id}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: form.title, cost: parseInt(form.cost) || 0, stock: parseInt(form.stock) || 1 }),
        });
        if (!res.ok) throw new Error("更新失败");
        return res.json();
      }
      const res = await fetch("/api/rewards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("创建失败");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rewards"] });
      setDialogOpen(false);
      setEditingReward(null);
      setForm({ title: "", cost: "", stock: "1" });
    },
  });

  const handleAction = useMutation({
    mutationFn: async ({ rewardId, action }: { rewardId: number; action: string }) => {
      const res = await fetch("/api/rewards", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rewardId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "操作失败"); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rewards"] }),
  });

  const deleteReward = useMutation({
    mutationFn: async (id: number) => { await fetch(`/api/rewards/${id}`, { method: "DELETE" }); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rewards"] }),
  });

  return (
    <div className="max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-5 pb-4 border-b border-border-warm">
        <div>
          <h1 className="text-base font-bold text-coffee font-serif">奖池管理</h1>
          <p className="text-xs text-text-light">上架奖励，兑换审核。</p>
        </div>
        <Button className="bg-caramel text-white text-xs hover:bg-amber-700"
          onClick={() => { setEditingReward(null); setForm({ title: "", cost: "", stock: "1" }); setDialogOpen(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1" />上架奖品
        </Button>
      </header>

      {/* 统计卡片 */}
      <motion.div className="grid grid-cols-4 gap-4 mb-6"
        variants={staggerContainer} initial="initial" animate="animate">
        <motion.div variants={listItem}>
          <StatsCard icon={<Gift className="w-full h-full" />} label="总奖品"
            value={rewards?.length || 0} accentColor="caramel" />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard icon={<Package className="w-full h-full" />} label="在售"
            value={availableRewards.filter((r: any) => r.stock > 0).length} accentColor="sage" />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard icon={<Clock className="w-full h-full" />} label="待审核"
            value={pendingRewards.length} accentColor="ribbon" />
        </motion.div>
        <motion.div variants={listItem}>
          <StatsCard icon={<CheckCircle className="w-full h-full" />} label="已处理"
            value={processedRewards.length} accentColor="coffee" />
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="border-border-warm bg-bg-warm/50 mb-4">
          <TabsTrigger value="available" className="text-xs">奖池商品</TabsTrigger>
          <TabsTrigger value="pending" className="text-xs">
            待审核{pendingRewards.length > 0 && ` (${pendingRewards.length})`}
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">兑换记录</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <PaperCard variant="paper" elevation="sm">
            {isLoading ? (
              <div className="text-center py-8"><Loader2 className="w-5 h-5 text-caramel animate-spin mx-auto" /></div>
            ) : availableRewards.length === 0 ? (
              <div className="text-center py-12 text-text-light text-xs">暂无奖品</div>
            ) : (
              <div className="divide-y divide-border-warm">
                {availableRewards.map((reward: any, idx: number) => (
                  <motion.div key={reward.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-warm/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-text-main">{reward.title}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-caramel flex-shrink-0">
                      <Coins className="w-3.5 h-3.5" /><span>{reward.cost}</span>
                    </span>
                    <Badge className={`flex-shrink-0 ${reward.stock > 0
                      ? "bg-sage/10 text-sage border-sage/20"
                      : "bg-red-50 text-red-600 border-red-100"}`}>
                      {reward.stock > 0 ? `${reward.stock} 件` : "已售罄"}
                    </Badge>
                    <Badge className="bg-sage/10 text-sage border-sage/20 flex-shrink-0">在售</Badge>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => {
                        setEditingReward(reward);
                        setForm({ title: reward.title, cost: reward.cost.toString(), stock: reward.stock.toString() });
                        setDialogOpen(true);
                      }} className="p-1.5 text-text-light hover:text-caramel hover:bg-caramel/5 rounded transition-colors" title="编辑">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => {
                        if (confirm(`确定删除奖品「${reward.title}」？`)) deleteReward.mutate(reward.id);
                      }} className="p-1.5 text-text-light hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="删除">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </PaperCard>
        </TabsContent>

        <TabsContent value="pending">
          <PaperCard variant="paper" elevation="sm">
            {pendingRewards.length === 0 ? (
              <div className="text-center py-12 text-text-light text-xs">暂无待审核兑换</div>
            ) : (
              <div className="divide-y divide-border-warm">
                {pendingRewards.map((reward: any, idx: number) => (
                  <motion.div key={reward.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-warm/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-text-main">{reward.title}</span>
                      <span className="text-xs text-text-light ml-2">{reward.user?.name || "未知"}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-caramel flex-shrink-0">
                      <Coins className="w-3.5 h-3.5" /><span>{reward.cost}</span>
                    </span>
                    <span className="text-[11px] text-text-light flex-shrink-0">
                      {new Date(reward.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => handleAction.mutate({ rewardId: reward.id, action: "APPROVE" })}
                        className="inline-flex items-center gap-1 text-xs bg-sage/10 text-sage px-2 py-1 rounded border border-sage/20 hover:bg-sage/20 transition-colors">
                        <CheckCircle className="w-3 h-3" /><span>批准</span>
                      </button>
                      <button onClick={() => handleAction.mutate({ rewardId: reward.id, action: "REJECT" })}
                        className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 hover:bg-red-100 transition-colors">
                        <XCircle className="w-3 h-3" /><span>拒绝</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </PaperCard>
        </TabsContent>

        <TabsContent value="history">
          <PaperCard variant="paper" elevation="sm">
            {processedRewards.length === 0 ? (
              <div className="text-center py-12 text-text-light text-xs">暂无记录</div>
            ) : (
              <div className="divide-y divide-border-warm">
                {processedRewards.map((reward: any, idx: number) => (
                  <motion.div key={reward.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-bg-warm/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-text-main">{reward.title}</span>
                      <span className="text-xs text-text-light ml-2">{reward.user?.name || "未知"}</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-sm font-bold text-caramel flex-shrink-0">
                      <Coins className="w-3.5 h-3.5" /><span>{reward.cost}</span>
                    </span>
                    <Badge className={`flex-shrink-0 ${
                      reward.status === "APPROVED"
                        ? "bg-sage/10 text-sage border-sage/20"
                        : "bg-red-50 text-red-600 border-red-100"
                    }`}>
                      {reward.status === "APPROVED" ? "已批准" : "已拒绝"}
                    </Badge>
                    <span className="text-[11px] text-text-light flex-shrink-0">
                      {new Date(reward.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </PaperCard>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card-cream border-border-warm max-w-md">
          <DialogHeader>
            <DialogTitle className="text-coffee font-serif">{editingReward ? "编辑奖品" : "上架新奖品"}</DialogTitle>
            <DialogDescription>{editingReward ? "修改奖品信息" : "添加新的可兑换奖品"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-secondary font-medium block mb-1">奖品名称 *</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="买本课外书" className="border-border-warm focus-visible:ring-caramel/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">所需积分 *</label>
                <Input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                  placeholder="80" className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
              <div>
                <label className="text-xs text-text-secondary font-medium block mb-1">库存</label>
                <Input type="number" value={form.stock} onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                  className="border-border-warm focus-visible:ring-caramel/30" />
              </div>
            </div>
            <Button className="w-full bg-caramel text-white hover:bg-amber-700"
              onClick={() => saveReward.mutate()}
              disabled={!form.title || !form.cost || saveReward.isPending}>
              {saveReward.isPending ? "保存中..." : editingReward ? "更新奖品" : "上架奖品"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
