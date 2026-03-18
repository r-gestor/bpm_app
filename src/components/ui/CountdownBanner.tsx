"use client";

import { useState, useEffect } from "react";
import { Flame, Clock } from "lucide-react";

// Ciclo de 5 días. Usa una fecha base fija para que el temporizador
// sea consistente entre usuarios y sesiones, y se reinicie solo.
const CYCLE_MS  = 5 * 24 * 60 * 60 * 1000;            // 5 días en ms
const BASE_DATE = new Date("2024-01-01T00:00:00Z").getTime();

function getRemainingMs(): number {
  const elapsed = Date.now() - BASE_DATE;
  return CYCLE_MS - (elapsed % CYCLE_MS);
}

function split(ms: number) {
  const total = Math.floor(ms / 1000);
  const dd = Math.floor(total / 86400);
  const hh = Math.floor((total % 86400) / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  return { dd, hh, mm, ss };
}

const pad = (n: number) => String(n).padStart(2, "0");

interface UnitProps { value: number; label: string }

function Unit({ value, label }: UnitProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="
        bg-white/20 backdrop-blur-sm border border-white/30
        rounded-lg px-2.5 py-1 min-w-[42px] text-center
        shadow-inner
      ">
        <span className="text-white font-black text-lg leading-none tabular-nums">
          {pad(value)}
        </span>
      </div>
      <span className="text-white/70 text-[9px] font-bold uppercase tracking-widest mt-0.5">
        {label}
      </span>
    </div>
  );
}

function Colon() {
  return (
    <span className="text-white/60 font-black text-base mb-3 mx-0.5 select-none">:</span>
  );
}

export default function CountdownBanner() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    setRemaining(getRemainingMs());
    const id = setInterval(() => setRemaining(getRemainingMs()), 1000);
    return () => clearInterval(id);
  }, []);

  // No renderizar en SSR para evitar hydration mismatch
  if (remaining === null) return null;

  const { dd, hh, mm, ss } = split(remaining);

  return (
    <div className="
      fixed top-20 left-0 right-0 z-40
      bg-gradient-to-r from-red-600 via-rose-500 to-orange-500
      shadow-lg shadow-red-500/30
    ">
      {/* Shimmer line en la parte superior */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

      <div className="
        container mx-auto px-4
        flex flex-wrap items-center justify-center gap-x-5 gap-y-1
        py-2
      ">

        {/* Texto izquierdo */}
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-yellow-300 shrink-0 animate-pulse" />
          <span className="text-white font-black text-sm uppercase tracking-wide leading-tight">
            Aprovecha nuestros descuentos
            <span className="hidden sm:inline"> · Oferta por tiempo limitado</span>
          </span>
        </div>

        {/* Separador */}
        <div className="hidden sm:block w-px h-6 bg-white/30" />

        {/* Temporizador */}
        <div className="flex items-end gap-1">
          <Clock size={14} className="text-white/70 mb-3 shrink-0" />
          <Unit value={dd} label="días" />
          <Colon />
          <Unit value={hh} label="horas" />
          <Colon />
          <Unit value={mm} label="min" />
          <Colon />
          <Unit value={ss} label="seg" />
        </div>

      </div>

      {/* Shimmer line en la parte inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}
