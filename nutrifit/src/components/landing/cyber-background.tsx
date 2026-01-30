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
      {/* Base com gradiente colorido visível - FUNDO PRINCIPAL */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, 
              #0a0a0a 0%, 
              #0d1a1f 15%, 
              #0f1a1a 30%, 
              #0a0f1a 45%, 
              #0f1a1a 60%, 
              #0d1a1f 75%, 
              #0a0a0a 100%
            )
          `,
        }}
      />
      
      {/* BASE COLORIDA MAIS ESCURA - Para destacar logo e elementos */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 0% 0%, rgba(57, 255, 136, 0.25) 0%, rgba(57, 255, 136, 0.1) 25%, transparent 50%),
            radial-gradient(ellipse 90% 100% at 100% 0%, rgba(0, 245, 255, 0.22) 0%, rgba(0, 245, 255, 0.08) 25%, transparent 50%),
            radial-gradient(ellipse 110% 90% at 50% 100%, rgba(57, 255, 136, 0.2) 0%, rgba(57, 255, 136, 0.08) 25%, transparent 50%)
          `,
        }}
      />

      {/* GRADIENTES RADIAIS MAIS ESCUROS */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 90% at 0% 0%, rgba(57, 255, 136, 0.2) 0%, rgba(57, 255, 136, 0.08) 30%, transparent 60%),
            radial-gradient(ellipse 90% 100% at 100% 0%, rgba(0, 245, 255, 0.18) 0%, rgba(0, 245, 255, 0.06) 30%, transparent 60%),
            radial-gradient(ellipse 110% 90% at 50% 100%, rgba(57, 255, 136, 0.15) 0%, rgba(57, 255, 136, 0.06) 30%, transparent 60%),
            radial-gradient(ellipse 90% 100% at 20% 50%, rgba(184, 77, 255, 0.12) 0%, rgba(184, 77, 255, 0.04) 30%, transparent 55%)
          `,
        }}
      />

      {/* GRID MAIS SUTIL E ESCURO */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-30 cyber-grid-responsive"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(57, 255, 136, 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 245, 255, 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 640px) {
          .cyber-grid-responsive {
            background-size: 80px 80px !important;
          }
        }
        @media (min-width: 1024px) {
          .cyber-grid-responsive {
            background-size: 100px 100px !important;
          }
        }
      `}} />

      {/* LUZ PRINCIPAL - RESPONSIVA */}
      <motion.div
        aria-hidden="true"
        style={{ x, y }}
        className="absolute left-1/2 top-1/2 h-[500px] w-[500px] sm:h-[700px] sm:w-[700px] lg:h-[900px] lg:w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
      >
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="h-full w-full rounded-full"
          style={{
            background: 'radial-gradient(circle at center, rgba(57, 255, 136, 0.3) 0%, rgba(0, 245, 255, 0.25) 25%, rgba(184, 77, 255, 0.15) 50%, transparent 75%)',
          }}
        />
      </motion.div>

      {/* LUZ CANTO SUPERIOR ESQUERDO - RESPONSIVA */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -left-[100px] -top-[100px] sm:-left-[150px] sm:-top-[150px] lg:-left-[200px] lg:-top-[200px] h-[400px] w-[400px] sm:h-[600px] sm:w-[600px] lg:h-[800px] lg:w-[800px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(57, 255, 136, 0.25) 0%, rgba(57, 255, 136, 0.1) 40%, transparent 70%)',
        }}
      />

      {/* LUZ CANTO SUPERIOR DIREITO - RESPONSIVA */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.65, 0.35],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute -right-[100px] -top-[100px] sm:-right-[150px] sm:-top-[150px] lg:-right-[200px] lg:-top-[200px] h-[350px] w-[350px] sm:h-[550px] sm:w-[550px] lg:h-[750px] lg:w-[750px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(0, 245, 255, 0.22) 0%, rgba(0, 245, 255, 0.08) 40%, transparent 70%)',
        }}
      />

      {/* LUZ CENTRO INFERIOR - RESPONSIVA */}
      <motion.div
        aria-hidden="true"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute left-1/2 -bottom-[80px] sm:-bottom-[120px] lg:-bottom-[150px] h-[300px] w-[400px] sm:h-[450px] sm:w-[650px] lg:h-[600px] lg:w-[900px] -translate-x-1/2 rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(ellipse, rgba(184, 77, 255, 0.2) 0%, rgba(184, 77, 255, 0.08) 40%, transparent 70%)',
        }}
      />

      {/* LINHAS DE ENERGIA MUITO MAIS VISÍVEIS */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 0%, rgba(57, 255, 136, 0.2) 20%, rgba(57, 255, 136, 0.3) 50%, rgba(57, 255, 136, 0.2) 80%, transparent 100%),
            linear-gradient(0deg, transparent 0%, rgba(0, 245, 255, 0.15) 20%, rgba(0, 245, 255, 0.25) 50%, rgba(0, 245, 255, 0.15) 80%, transparent 100%)
          `,
          backgroundSize: '100% 2px, 2px 100%',
          backgroundPosition: '0% 25%, 35% 0%',
          opacity: 0.3,
        }}
      />

      {/* OVERLAY FINAL SUTIL */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, rgba(10, 10, 10, 0.15) 100%)',
        }}
      />
    </div>
  );
}

