import React, { useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

export interface DockProps {
  children: React.ReactNode;
  className?: string;
}

export const Dock = ({ children, className }: DockProps) => {
  return (
    <motion.div
      className={cn(
        "flex gap-2 rounded-full border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-2",
        className
      )}
    >
      {children}
    </motion.div>
  );
};

export interface DockIconProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const DockIcon = ({ children, className, onClick }: DockIconProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      whileHover={{ scale: 1.2, y: -8 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "flex items-center justify-center rounded-full px-4 py-2 text-white text-sm font-medium transition-colors hover:bg-white/10",
        className
      )}
    >
      {children}
    </motion.button>
  );
};
