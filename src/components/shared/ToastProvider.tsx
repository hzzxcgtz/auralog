"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Info, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "info" | "error";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, description?: string) => void;
  success: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const TOAST_CONFIG = {
  success: {
    icon: CheckCircle,
    accentBar: "bg-sage",
    bg: "bg-sage/5",
    border: "border-sage/20",
    iconColor: "text-sage",
  },
  info: {
    icon: Info,
    accentBar: "bg-caramel",
    bg: "bg-caramel/5",
    border: "border-caramel/20",
    iconColor: "text-caramel",
  },
  error: {
    icon: AlertCircle,
    accentBar: "bg-red-500",
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
  },
};

const MESSAGES: Record<string, { message: string; description: string }> = {
  // ── 任务操作 ──
  "task-created": { message: "任务已创建", description: "新的任务已经安排上啦，加油哦 💪" },
  "task-updated": { message: "任务已更新", description: "安排已调整，继续前进吧 🌟" },
  "task-deleted": { message: "任务已删除", description: "已从计划中移除 🍃" },
  "task-copied": { message: "任务已复制", description: "复制到目标日期啦，完成它们吧 ✨" },
  "task-graded": { message: "评价已提交", description: "孩子收到你的鼓励一定会很开心 🎉" },
  "task-graded-done": { message: "评价已更新", description: "评语已修改，孩子会看到的 💌" },

  // ── 假期操作 ──
  "vacation-created": { message: "假期已创建", description: "新的假期开始啦，一起规划吧 ☀️" },
  "vacation-updated": { message: "假期已更新", description: "时间调整好了哦 📅" },
  "vacation-deleted": { message: "假期已删除", description: "已从记录中移除 🍂" },

  // ── 事件操作 ──
  "period-created": { message: "事件已添加", description: "日历上已标注，安排时会注意 📌" },
  "period-updated": { message: "事件已更新", description: "信息已同步 📌" },
  "period-deleted": { message: "事件已删除", description: "已移除该标注 🗑️" },

  // ── 学生操作 ──
  "student-created": { message: "学生账号已创建", description: "新同学加入啦，欢迎 👋" },
  "student-updated": { message: "学生信息已更新", description: "资料已保存 📝" },
  "student-deleted": { message: "学生已删除", description: "账号已移除 🍃" },
  "password-reset": { message: "密码已重置", description: "新密码已生效 🔑" },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, message: string, description?: string) => {
    const id = `toast-${++counterRef.current}`;
    setToasts(prev => [...prev.slice(-2), { id, type, message, description }]);
    setTimeout(() => removeToast(id), 3500);
  }, [removeToast]);

  const toast = useCallback((type: ToastType, message: string, description?: string) => {
    addToast(type, message, description);
  }, [addToast]);

  const success = useCallback((message: string, description?: string) => addToast("success", message, description), [addToast]);
  const info = useCallback((message: string, description?: string) => addToast("info", message, description), [addToast]);
  const error = useCallback((message: string, description?: string) => addToast("error", message, description), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, info, error }}>
      {children}

      {/* 悬浮提示容器 — 右下角 */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 440 }}>
        <AnimatePresence mode="popLayout">
          {toasts.map(t => {
            const cfg = TOAST_CONFIG[t.type];
            const Icon = cfg.icon;
            return (
              <motion.div key={t.id}
                layout
                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className={`pointer-events-auto relative flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} shadow-lg overflow-hidden`}
              >
                {/* 左侧色条 */}
                <div className={`w-1 self-stretch shrink-0 ${cfg.accentBar}`} />

                <div className="flex-1 py-3 pr-3 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 shrink-0 ${cfg.iconColor}`} />
                    <span className="text-xs font-medium text-text-main">{t.message}</span>
                  </div>
                  {t.description && (
                    <p className="text-[10px] text-text-light mt-0.5 leading-relaxed">{t.description}</p>
                  )}
                </div>

                <button onClick={() => removeToast(t.id)}
                  className="absolute top-2 right-2 p-0.5 rounded text-text-light/50 hover:text-text-light transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
