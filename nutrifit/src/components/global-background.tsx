"use client";

import { motion } from "framer-motion";

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      {/* Base gradient organizado */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, #0a0a0a 0%, #0f1a1a 25%, #0a0f1a 50%, #0f1a1a 75%, #0a0a0a 100%)
          `,
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Camada de gradientes radiais organizados */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 0% 0%, rgba(57, 255, 136, 0.3) 0%, transparent 50%),
            radial-gradient(ellipse 90% 100% at 100% 0%, rgba(0, 245, 255, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 110% 90% at 50% 100%, rgba(57, 255, 136, 0.2) 0%, transparent 50%)
          `,
        }}
      />
      
      {/* Luzes animadas organizadas - canto superior esquerdo */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-0 top-0 h-[600px] w-[600px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(57, 255, 136, 0.4) 0%, transparent 70%)',
        }}
      />

      {/* Luzes animadas organizadas - canto superior direito */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.25, 0.45, 0.25],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute right-0 top-0 h-[550px] w-[550px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.35) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}
