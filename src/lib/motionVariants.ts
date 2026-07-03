import type { Variants } from "framer-motion";

/** 页面切入 — 淡入 + 上滑 */
export const pageEnter: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

/** 交错容器 — 子元素依次出现 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

/** 交错列表项 — 淡入 + 上滑 */
export const listItem: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

/** 卡片悬停效果 */
export const cardHover = {
  whileHover: {
    y: -2,
    boxShadow: "0 8px 24px rgba(120,53,15,0.1)",
    transition: { duration: 0.2, ease: "easeOut" },
  },
  whileTap: { scale: 0.99 },
};

/** 弹窗/对话框入场 */
export const dialogEnter: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/** 下滑展开 */
export const expandDown: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

/** 数字跳动（用于积分/统计数字变化） */
export const countUp = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.15, 1],
    transition: { duration: 0.3, ease: "easeOut" },
  },
};
