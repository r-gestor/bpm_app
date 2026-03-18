"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Download, Clock, ClipboardCheck, UserCheck } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const isSanitation = searchParams.get("type") === "sanitation";

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full"></div>

      <div className="max-w-2xl w-full text-center relative">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-success/10 rounded-3xl flex items-center justify-center border border-success/20 shadow-2xl shadow-success/10">
            <CheckCircle2 className="text-success w-12 h-12" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-accent">
          ¡Pago <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-light">Confirmado</span>!
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-text-muted mb-10 leading-relaxed max-w-lg mx-auto">
          {isSanitation
            ? "Tu pago ha sido procesado con éxito. Tu plan de saneamiento está en preparación."
            : "Tu transacción ha sido procesada con éxito. Ya puedes acceder a tus servicios desde tu panel personal."}
        </p>

        {/* Reference */}
        <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] mb-8 flex flex-col items-center gap-6 shadow-brand">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-2">Referencia de Pago</span>
            <code className="text-primary-dark font-mono text-lg bg-primary/5 px-4 py-2 rounded-xl border border-primary/20">
              {ref || "—"}
            </code>
          </div>

          {isSanitation ? (
            /* Sanitation plan: 12-24 hours notice */
            <div className="w-full space-y-3">
              <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 border-l-4 border-l-amber-400 text-left">
                <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Tiempo de entrega</p>
                  <p className="text-sm font-semibold text-amber-800">
                    Tu plan de saneamiento estará listo en <strong>12 a 24 horas</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-bg-section rounded-2xl border border-slate-200 border-l-4 border-l-primary text-left">
                <UserCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Elaborado por un profesional</p>
                  <p className="text-sm font-medium text-text">
                    El profesional encargado elaborará tu plan de saneamiento personalizado y te lo entregará debidamente firmado.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-bg-section rounded-2xl border border-slate-200 border-l-4 border-l-accent text-left">
                <ClipboardCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-text-muted uppercase tracking-widest mb-1">Próximo paso</p>
                  <p className="text-sm font-medium text-text">
                    Revisa tu correo electrónico. Te notificaremos cuando tu plan esté disponible en tu dashboard.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Course: original cards */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              <div className="p-4 bg-bg-section rounded-2xl border border-slate-200 text-left border-l-4 border-l-primary">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Próximo paso</p>
                <p className="text-sm font-medium text-text">Revisa tu correo para el recibo oficial.</p>
              </div>
              <div className="p-4 bg-bg-section rounded-2xl border border-slate-200 text-left border-l-4 border-l-accent">
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">Acceso</p>
                <p className="text-sm font-medium text-text">El servicio se ha activado automáticamente.</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-10 py-5 bg-primary hover:bg-primary-dark text-white rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all shadow-brand group"
          >
            Ir a mi Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          {!isSanitation && (
            <button className="w-full sm:w-auto px-10 py-5 bg-white hover:bg-bg-section border border-slate-200 text-text rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all">
              <Download className="w-5 h-5" /> Descargar Factura
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
