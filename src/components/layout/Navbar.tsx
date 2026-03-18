"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { ShieldCheck, Search, LogOut, LayoutDashboard, User, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Ocultar Navbar en rutas de auth y admin
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isAdminPage = pathname?.startsWith("/admin");
  
  if (isAuthPage || isAdminPage) return null;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl border-b border-primary/20">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center group">
          <img 
            src="/certificate/logo.png" 
            alt="BPM Salud Logo" 
            className="h-14 w-auto object-contain group-hover:scale-105 transition-transform" 
          />
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/verify" className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-primary transition-colors">
            <Search className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">Verificar Certificado</span>
          </Link>
          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              {(session.user.role === "STUDENT" || session.user.role === "BUYER") && (
                <Link 
                  href="/course-content"
                  className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-light text-white rounded-lg transition-all text-sm font-bold shadow-brand active:scale-95"
                >
                  <GraduationCap size={18} className="shrink-0" />
                  <span className="hidden sm:inline">Curso</span>
                </Link>
              )}
              <Link 
                href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"} 
                className="flex items-center gap-2 px-4 py-2 bg-primary-light hover:bg-primary/20 rounded-lg text-sm font-semibold border border-primary/20 transition-all text-primary-dark"
              >
                {session.user.role === "ADMIN" ? <LayoutDashboard size={16} /> : <User size={16} />}
                <span className="hidden sm:inline">{session.user.role === "ADMIN" ? "Panel" : "Mi Panel"}</span>
              </Link>
              <button 
                onClick={() => signOut()}
                className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 transition-all"
                title="Cerrar Sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link href="/login" className="px-6 py-2.5 bg-accent hover:bg-accent-light rounded-lg text-sm uppercase tracking-wide font-bold transition-all shadow-brand text-white">
              Iniciar Sesión
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
