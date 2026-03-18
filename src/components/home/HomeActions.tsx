"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";

export default function HomeActions() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const handleSanitationClick = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  const onAuthSuccess = () => {
    router.push("/sanitation/generate");
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Massive Button 1: Course */}
        <Link 
          href="/manipulacion-alimentos"
          className="group relative overflow-hidden bg-primary hover:bg-primary-dark p-8 md:p-12 rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-brand border border-black/5"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
          <div className="relative flex items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">
                Curso de Manipulación de Alimentos
              </h2>
              <p className="text-white/90 font-medium opacity-90">
                Certificado firmado por Ingeniero de Alimentos - Válido a nivel nacional.
              </p>
            </div>
            <div className="bg-white/20 p-4 md:p-6 rounded-3xl backdrop-blur-md">
              <GraduationCap className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
          </div>
        </Link>

        {/* Massive Button 2: Sanitation Plan */}
        <Link 
          href="/plan-de-saneamiento"
          className="group relative overflow-hidden bg-white p-8 md:p-12 rounded-[2.5rem] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-brand border border-slate-100"
        >
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
          <div className="relative flex items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-black text-accent uppercase tracking-tight mb-2">
                Plan de Saneamiento
              </h2>
              <p className="text-text-muted font-medium">
                Obtén tu plan de saneamiento en minutos. Verificable y firmado por profesional autorizado.
              </p>
            </div>
            <div className="bg-primary/10 p-4 md:p-6 rounded-3xl border border-primary/20">
              <ShieldCheck className="w-10 h-10 md:w-12 md:h-12 text-primary" />
            </div>
          </div>
        </Link>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={onAuthSuccess}
      />
    </>
  );
}
