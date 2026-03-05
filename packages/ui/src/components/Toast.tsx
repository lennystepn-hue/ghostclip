"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle, Info, Clipboard } from "lucide-react";
import { cn } from "../utils";

type ToastType = "info" | "success" | "warning" | "clip";

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  visible: boolean;
  onDismiss?: () => void;
}

const icons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  clip: Clipboard,
};

const colors = {
  info: "text-ghost-400",
  success: "text-accent-green",
  warning: "text-accent-orange",
  clip: "text-ghost-300",
};

export function Toast({ type, title, description, visible, onDismiss }: ToastProps) {
  const Icon = icons[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            "flex items-start gap-3 p-3 rounded-xl max-w-sm",
            "bg-surface-200/90 backdrop-blur-lg border border-white/5",
            "shadow-glass-lg",
          )}
        >
          <Icon className={cn("w-5 h-5 shrink-0 mt-0.5", colors[type])} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900">{title}</p>
            {description && <p className="text-xs text-surface-700 mt-0.5">{description}</p>}
          </div>
          {onDismiss && (
            <button onClick={onDismiss} className="p-0.5 rounded hover:bg-surface-300 transition-colors">
              <X className="w-3.5 h-3.5 text-surface-700" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
