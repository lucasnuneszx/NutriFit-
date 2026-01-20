"use client";

import * as React from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import { cn } from "@/lib/utils";

type TiltCardProps = React.PropsWithChildren<{
  className?: string;
  shine?: boolean;
}>;

export function TiltCard({ children, className, shine = true }: TiltCardProps) {
  const rxRaw = useMotionValue(0);
  const ryRaw = useMotionValue(0);
  const shineX = useMotionValue(50);
  const shineY = useMotionValue(50);

  const rx = useSpring(rxRaw, { stiffness: 220, damping: 18, mass: 0.2 });
  const ry = useSpring(ryRaw, { stiffness: 220, damping: 18, mass: 0.2 });

  const rotateX = useTransform(rx, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(ry, [-0.5, 0.5], [-12, 12]);

  const shineBg = useMotionTemplate`radial-gradient(650px circle at ${shineX}% ${shineY}%, color-mix(in oklab, var(--neon-cyan) 24%, transparent), transparent 55%)`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = x / rect.width - 0.5;
    const py = y / rect.height - 0.5;

    ryRaw.set(px);
    rxRaw.set(py);
    shineX.set((x / rect.width) * 100);
    shineY.set((y / rect.height) * 100);
  };

  const onLeave = () => {
    ryRaw.set(0);
    rxRaw.set(0);
    shineX.set(50);
    shineY.set(50);
  };

  return (
    <motion.div
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn(
        "relative will-change-transform [perspective:1200px]",
        className,
      )}
    >
      {shine ? (
        <motion.div
          aria-hidden="true"
          style={{
            backgroundImage: shineBg,
            transform: "translateZ(20px)",
          }}
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
      ) : null}
      <div style={{ transform: "translateZ(40px)" }}>{children}</div>
    </motion.div>
  );
}

