"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, Lock, Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ActivatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"form" | "success" | "error">("form");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token de activación no encontrado.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setStatus("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      {/* Decorative background blobs */}
      <div className="fixed top-0 right-0 w-[40vw] h-[40vw] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[30vw] h-[30vw] bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <Link href="/" className="flex items-center gap-3 group mb-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-brand">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-accent">
              BPM <span className="text-primary">Salud</span>
            </span>
          </Link>
          <p className="text-text-muted text-xs font-bold uppercase tracking-widest text-center">
            Activación de Cuenta de Estudiante
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-brand">

          {/* FORM */}
          {status === "form" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-accent tracking-tight">Crea tu contraseña</h2>
                <p className="text-text-muted text-sm mt-1">
                  Para empezar a capacitarte, define una contraseña para tu cuenta.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                  <AlertCircle size={18} className="shrink-0" /> {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-text placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-text-muted mb-2 ml-1">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-text placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-brand flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : "Activar mi Cuenta"}
                </button>
              </form>

              <p className="text-center text-xs text-text-muted mt-6">
                ¿Ya tienes cuenta?{" "}
                <Link href="/login" className="text-primary font-bold hover:text-primary-dark transition-colors">
                  Iniciar sesión
                </Link>
              </p>
            </>
          )}

          {/* SUCCESS */}
          {status === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-success" />
              </div>
              <h2 className="text-2xl font-black text-accent mb-2">¡Todo listo!</h2>
              <p className="text-text-muted text-sm mb-6">
                Tu cuenta ha sido activada correctamente. Redirigiéndote al inicio de sesión...
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors"
              >
                Ir al Inicio de Sesión <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* ERROR */}
          {status === "error" && !token && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h2 className="text-2xl font-black text-accent mb-2">Enlace inválido</h2>
              <p className="text-text-muted text-sm mb-6">{errorMessage}</p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-dark transition-colors"
              >
                Volver al Inicio <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
