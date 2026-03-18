"use client";

import React, { useState } from "react";
import { 
 ClipboardCheck, 
 Bug, 
 Trash2, 
 UserCheck, 
 CalendarDays, 
 FileText, 
 ChevronRight,
 Printer,
 Download
} from "lucide-react";

interface PlanViewerProps {
 plan: any;
}

export default function PlanViewer({ plan }: PlanViewerProps) {
 const [activeSection, setActiveSection] = useState("cleaning");

 const sections = [
 { id: "cleaning", label: "Limpieza y Desinfección", icon: <ClipboardCheck />, content: plan.content.cleaning },
 { id: "pests", label: "Control de Plagas", icon: <Bug />, content: plan.content.pests },
 { id: "waste", label: "Manejo de Residuos", icon: <Trash2 />, content: plan.content.waste },
 { id: "hygiene", label: "Higiene del Personal", icon: <UserCheck />, content: plan.content.hygiene },
 { id: "schedule", label: "Cronograma Sugerido", icon: <CalendarDays />, content: plan.content.schedule },
 { id: "records", label: "Registros Sanitarios", icon: <FileText />, content: plan.content.records },
 ];

 const currentSection = sections.find(s => s.id === activeSection);

 return (
 <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 animate-in fade-in duration-700">
 {/* Sidebar Navigation */}
 <aside className="lg:col-span-1 space-y-3">
 {sections.map((s) => (
 <button
 key={s.id}
 onClick={() => setActiveSection(s.id)}
 className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all text-left group ${
 activeSection === s.id 
 ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20 translate-x-2" 
 : "bg-white text-slate-500 hover:bg-slate-50 "
 }`}
 >
 <div className={`${activeSection === s.id ? "text-white" : "text-blue-600"} transition-colors`}>
 {React.cloneElement(s.icon as React.ReactElement<{ size?: number }>, { size: 20 })}
 </div>
 <span className="text-sm font-bold flex-1">{s.label}</span>
 <ChevronRight size={16} className={`${activeSection === s.id ? "opacity-100" : "opacity-0"} group-hover:opacity-100 transition-opacity`} />
 </button>
 ))}

 <div className="pt-8 space-y-4">
 <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-200 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
 <Printer size={16} /> Imprimir Plan
 </button>
 <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">
 <Download size={16} /> Descargar PDF
 </button>
 </div>
 </aside>

 {/* Content Area */}
 <main className="lg:col-span-3">
 <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 p-12 min-h-[600px] relative overflow-hidden">
 {/* Watermark Decoration */}
 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32"></div>
 
 <div className="relative z-10">
 <header className="mb-12">
 <div className="flex items-center gap-4 text-blue-600 mb-4">
 {React.cloneElement(currentSection?.icon as React.ReactElement, { size: 32 })}
 <div className="h-1 flex-1 bg-slate-50 rounded-full">
 <div className="h-full bg-blue-600 w-24"></div>
 </div>
 </div>
 <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">
 {currentSection?.label}
 </h2>
 </header>

 <div className="prose max-w-none">
 {currentSection?.content.split('\n').map((line, i) => (
 <p key={i} className="text-slate-600 text-lg leading-relaxed mb-6">
 {line}
 </p>
 ))}
 </div>

 {/* Compliance Footer */}
 <div className="mt-20 pt-10 border-t border-slate-50 flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
 <span>Normativa: Resolución 2674 de 2013</span>
 <span className="text-blue-600/50">PLATAFORMA BPM HEALTH</span>
 </div>
 </div>
 </div>
 </main>
 </div>
 );
}
