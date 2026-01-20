"use client";

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      {/* Gradiente principal */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, 
            #0a0a0a 0%, 
            #0d2620 15%, 
            #0a1a1d 30%,
            #0d1520 45%,
            #150a15 60%,
            #1a0d2a 75%,
            #0d1a15 90%,
            #0a0a0a 100%)`,
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Overlay de cores adicionais */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(ellipse at 20% 50%, rgba(57, 255, 136, 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 80% 20%, rgba(0, 245, 255, 0.12) 0%, transparent 50%),
                       radial-gradient(ellipse at 50% 100%, rgba(0, 255, 136, 0.1) 0%, transparent 50%)`
        }}
      />
    </div>
  );
}
