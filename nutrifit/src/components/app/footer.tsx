"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-black/40 backdrop-blur-sm mt-12">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-center sm:text-left text-xs sm:text-sm text-muted-foreground order-2 sm:order-1">
            <span>© 2026 NutriFit</span>
            <span className="hidden sm:inline">•</span>
            <span>Powered By Lucas Nunes</span>
          </div>
          <Image
            src="https://icrqzxuaajuxseszdinz.supabase.co/storage/v1/object/public/logos/ss.png"
            alt="NutriFit+ Logo"
            width={40}
            height={40}
            className="h-12 w-12 order-1 sm:order-2"
          />
        </div>
      </div>
    </footer>
  );
}
