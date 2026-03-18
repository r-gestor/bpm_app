"use client";

import React, { useState } from "react";
import ConversationalForm from "@/components/sanitation/ConversationalForm";
import PlanViewer from "@/components/sanitation/PlanViewer";
import { Sparkles, ArrowLeft, ShieldCheck, Download } from "lucide-react";
import Link from "next/link";

export default function SanitationGeneratorPage() {
 const [plan, setPlan] = useState<any>(null);

 return (
 <div className="min-h-screen bg-slate-50 p-8 sm:p-20">
 <div className="max-w-7xl mx-auto">
 <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-20 animate-in fade-in slide-in-from-top-8 duration-500">
 <div className="space-y-4">
 <Link href="/" className="inline-flex items-center text-slate-400 hover:text-blue-600 transition-colors font-bold uppercase tracking-widest text-xs">
 <ArrowLeft size={16} className="mr-2" />
 Volver al Inicio
 </Link>
 <div className="flex items-center gap-4">
 <div className="bg-blue-600 p-4 rounded-3xl shadow-xl shadow-blue-500/40">
 <Sparkles size={32} className="text-white" />
 </div>
 <div>
 <h1 className="text-4xl sm:text-5xl font-black text-slate-900 uppercase tracking-tighter">
 Generador de Planes <br className="hidden sm:block" /> con <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Inteligencia Artificial</span>
 </h1>
 </div>
 </div>
 </div>

 {plan && (
 <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] shadow-xl border border-slate-100 ">
 <div className="bg-green-100 p-3 rounded-2xl text-green-600">
 <ShieldCheck size={24} />
 </div>
 <div>
 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documento Generado</p>
 <p className="font-bold text-slate-900 ">{plan.businessName}</p>
 </div>
 </div>
 )}
 </header>

 {/* Dynamic Content */}
 {!plan ? (
 <div className="py-12">
 <ConversationalForm onComplete={setPlan} />
 </div>
 ) : (
 <PlanViewer plan={plan} />
 )}

 {/* Footer Info */}
 <div className="mt-20 py-12 border-t border-slate-200 text-center space-y-4">
 <p className="text-slate-400 text-sm max-w-2xl mx-auto">
 Este plan ha sido generado dinámicamente utilizando modelos de IA avanzados y plantillas normativas vigentes. 
 Se recomienda la revisión periódica por parte de un profesional sanitario.
 </p>
 <div className="flex justify-center gap-6 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
 <span>SSL SECURE</span>
 <span>AI VALIDATED</span>
 <span>2024 COMPLIANCE</span>
 </div>
 </div>
 </div>
 </div>
 );
}
