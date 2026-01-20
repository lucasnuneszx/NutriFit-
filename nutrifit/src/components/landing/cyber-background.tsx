"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export function CyberBackground() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const x = useSpring(mx, { stiffness: 110, damping: 22, mass: 0.25 });
  const y = useSpring(my, { stiffness: 110, damping: 22, mass: 0.25 });

  React.useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mx.set(e.clientX - window.innerWidth / 2);
      my.set(e.clientY - window.innerHeight / 2);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black bg-[radial-gradient(1500px_circle_at_20%_0%,#39ff8815_0%,transparent_50%),radial-gradient(1200px_circle_at_80%_30%,#00f5ff20_0%,transparent_50%),radial-gradient(1000px_circle_at_40%_100%,#00ff8830_0%,transparent_50%)]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50 [background-image:linear-gradient(to_right,rgba(0,245,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,245,255,0.1)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(65%_55%_at_50%_40%,black,transparent)]"
      />

      <motion.div
        aria-hidden="true"
        style={{ x, y }}
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-40 [background:radial-gradient(circle_at_center,rgba(0,245,255,0.5),transparent_70%)]"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,#00f5ff_1px,transparent_1px)] [background-size:50px_50px]"
      />
    </div>
  );
}

