"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`bg-card-cream border border-border-warm rounded-xl shadow-sm p-10 text-center ${className}`}
    >
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-caramel/8 to-amber-500/8 flex items-center justify-center mx-auto mb-4 border border-caramel/15">
          <div className="text-caramel/70">{icon}</div>
        </div>
      )}
      <p className="text-base text-text-secondary font-serif mb-1">{title}</p>
      {description && (
        <p className="text-xs text-text-light">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  );
}
