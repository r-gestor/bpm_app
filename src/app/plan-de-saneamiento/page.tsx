"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
 ShieldCheck,
 AlertTriangle,
 Store,
 Utensils,
 ShoppingBag,
 Warehouse,
 CheckCircle2,
 Droplets,
 Trash2,
 Bug,
 ClipboardCheck,
 ThermometerSnowflake,
 PackageCheck,
 Award,
 QrCode,
 ArrowRight,
 ShieldAlert,
 Wine,
 Music2
} from "lucide-react";
import Link from "next/link";
import AuthModal from "@/components/auth/AuthModal";
import CountdownBanner from "@/components/ui/CountdownBanner";

export default function SanitationLandingPage() {
 const { data: session } = useSession();
 const router = useRouter();
 const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

 const handleCTA = () => {
 if (!session) {
 setIsAuthModalOpen(true);
 } else {
 router.push("/sanitation/generate");
 }
 };

 const programs = [
 {
 title: "Suministro y calidad de agua potable",
 description: "Garantiza que el agua usada en el negocio sea apta para el consumo y la preparación de alimentos.",
 icon: <Droplets className="text-blue-500" />
 },
 {
 title: "Gestión de residuos sólidos",
 description: "Establece el manejo correcto de basuras y desechos para evitar contaminación.",
 icon: <Trash2 className="text-emerald-500" />
 },
 {
 title: "Control integral de plagas",
 description: "Define los procedimientos para prevenir y eliminar insectos, roedores y otras plagas.",
 icon: <Bug className="text-orange-500" />
 },
 {
 title: "Limpieza y desinfección",
 description: "Protocolos detallados para mantener instalaciones, equipos y utensilios en condiciones higiénicas.",
 icon: <ClipboardCheck className="text-purple-500" />
 },
 {
 title: "Control de temperaturas",
 description: "Procedimientos para conservar correctamente los alimentos y evitar su deterioro.",
 icon: <ThermometerSnowflake className="text-cyan-500" />
 },
 {
 title: "Verificación de calidad de materias primas",
 description: "Criterios para recibir y revisar los insumos que ingresan al negocio.",
 icon: <PackageCheck className="text-amber-500" />
 }
 ];

 return (
 <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-500/30">
 <CountdownBanner />
 {/* SECCIÓN 1 — Hero */}
 <section className="relative pt-44 pb-24 overflow-hidden border-b border-slate-200 ">
 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
 <div className="container mx-auto px-6 relative z-10 text-center">
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 text-xs font-black uppercase tracking-widest mb-8">
 <ShieldCheck className="w-4 h-4" /> Cumplimiento Normativo Garantizado
 </div>
 <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-none uppercase">
 Protege tu negocio con un <br />
 <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Plan de Saneamiento</span>
 </h1>
 <p className="text-slate-500 max-w-2xl mx-auto text-xl font-medium mb-12">
 El documento obligatorio exigido por la Secretaría de Salud para todo establecimiento que manipule alimentos en Colombia.
 </p>
 <button 
 onClick={handleCTA}
 className="group bg-blue-600 hover:bg-blue-700 text-white px-10 py-6 rounded-[2rem] font-black text-lg uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-blue-500/20 flex items-center gap-3 mx-auto"
 >
 Quiero mi Plan de Saneamiento
 <ArrowRight className="group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </section>

 {/* SECCIÓN 2 — ¿Qué es y por qué lo necesitas? */}
 <section className="py-24 bg-white ">
 <div className="container mx-auto px-6 max-w-5xl">
 <div className="grid md:grid-cols-2 gap-16 items-center">
 <div>
 <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">¿Qué es y por qué lo necesitas?</h2>
 <p className="text-slate-600 text-lg leading-relaxed mb-6">
 El Plan de Saneamiento es un documento técnico obligatorio que describe los procesos de higiene que tu negocio realiza día a día. Es la hoja de ruta que garantiza que los alimentos que vendes son seguros para el consumo humano.
 </p>
 <div className="space-y-4">
 <div className="flex items-start gap-4 p-4 rounded-3xl bg-red-500/5 border border-red-500/10">
 <ShieldAlert className="text-red-500 shrink-0 mt-1" />
 <p className="text-sm font-bold text-red-600 ">Sin este documento, tu negocio está expuesto a sanciones inmediatas y cierres preventivos durante inspecciones de la Secretaría de Salud.</p>
 </div>
 </div>
 </div>
 <div className="grid grid-cols-1 gap-4">
 {[
 "Sanciones y cierres temporales o definitivos",
 "Multas económicas elevadas por incumplimiento",
 "Pérdida de credibilidad ante clientes y entes de control"
 ].map((risk, i) => (
 <div key={i} className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 ">
 <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
 <AlertTriangle className="text-red-500" size={20} />
 </div>
 <span className="font-bold text-slate-700 ">{risk}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>

 {/* SECCIÓN 3 — ¿Quién debe tenerlo? */}
 <section className="py-24">
 <div className="container mx-auto px-6 text-center mb-16">
 <h2 className="text-3xl font-black uppercase tracking-tight">¿Quién debe tenerlo?</h2>
 <p className="text-slate-500 mt-2">Si tu negocio entra en estas categorías, la ley te exige tener el plan vigente.</p>
 </div>
 <div className="container mx-auto px-6">
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
 {[
 { name: "Restaurantes", icon: <Utensils size={32} /> },
 { name: "Comidas Rápidas", icon: <ShoppingBag size={32} /> },
 { name: "Fruvers", icon: <Droplets size={32} /> },
 { name: "Bodegas", icon: <Warehouse size={32} /> },
 { name: "Minimarkets", icon: <Store size={32} /> },
 { name: "Estancos", icon: <Wine size={32} /> },
 { name: "Discotecas", icon: <Music2 size={32} /> },
 ].map((item, i) => (
 <div key={i} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] text-center transition-all hover:border-blue-500/30 shadow-xl shadow-slate-200/50 ">
 <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
 {item.icon}
 </div>
 <h3 className="font-black text-sm uppercase tracking-wide leading-tight">{item.name}</h3>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* SECCIÓN 4 — ¿Qué incluye el plan? */}
 <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
 <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_30%_20%,#3b82f6_0%,transparent_50%)]"></div>
 <div className="container mx-auto px-6 relative z-10">
 <div className="max-w-3xl mx-auto text-center mb-20">
 <h2 className="text-3xl md:text-5xl font-black mb-6 uppercase tracking-tight">¿Qué incluye el plan?</h2>
 <p className="text-slate-400 text-lg">Entregamos un documento completo con los 6 programas técnicos exigidos por la norma.</p>
 </div>
 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
 {programs.map((program, i) => (
 <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-[2.5rem] hover:bg-white/10 transition-all">
 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
 {program.icon}
 </div>
 <h3 className="text-xl font-black mb-3 leading-tight">{program.title}</h3>
 <p className="text-slate-400 text-sm leading-relaxed">{program.description}</p>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* SECCIÓN 5 — Respaldo legal y profesional */}
 <section className="py-24">
 <div className="container mx-auto px-6 max-w-4xl bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden shadow-2xl">
 <div className="absolute top-0 right-0 p-12 opacity-10">
 <Award size={200} />
 </div>
 <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
 <div>
 <h2 className="text-3xl font-black mb-6 uppercase tracking-tight">Respaldo Legal y Profesional</h2>
 <p className="text-blue-100 mb-8 opacity-80">
 Tu plan no es solo un documento, es una garantía legal fundamentada en la normativa colombiana vigente.
 </p>
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <CheckCircle2 className="text-emerald-400" />
 <span className="font-bold text-sm tracking-wide">Firma de Profesional Autorizado</span>
 </div>
 <div className="flex items-center gap-3">
 <QrCode className="text-emerald-400" />
 <span className="font-bold text-sm tracking-wide">Código QR de Verificación</span>
 </div>
 </div>
 </div>
 <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 border border-white/20">
 <h4 className="font-black text-xs uppercase tracking-[0.2em] mb-4 text-blue-200">Normas Aplicables</h4>
 <ul className="space-y-3 font-mono text-sm">
 <li className="flex justify-between items-center border-b border-white/10 pb-2">
 <span>Resolución 2674</span>
 <span className="text-blue-200">2013</span>
 </li>
 <li className="flex justify-between items-center border-b border-white/10 pb-2">
 <span>Decreto 1500</span>
 <span className="text-blue-200">2007</span>
 </li>
 <li className="flex justify-between items-center pb-2">
 <span>Decreto 1686</span>
 <span className="text-blue-200">2012</span>
 </li>
 </ul>
 </div>
 </div>
 </div>
 </section>

 {/* SECCIÓN 6 — Precio */}
 <section className="py-24 bg-white ">
 <div className="container mx-auto px-6 text-center">
 <div className="max-w-xl mx-auto p-12 rounded-[3.5rem] border-4 border-blue-600 bg-white shadow-2xl relative">
 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-8 py-2 rounded-full font-black text-xs uppercase tracking-widest">
 Oferta Especial
 </div>
 <div className="mb-8">
 <span className="text-slate-400 text-2xl font-bold line-through block mb-2">$420,000</span>
 <span className="text-6xl md:text-7xl font-black text-blue-600 block leading-none">$350,000</span>
 <span className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-4 block">Pago único final</span>
 </div>
 <p className="text-slate-500 text-sm mb-10">
 ¿Tienes un código de descuento?<br />
 <span className="font-black text-blue-500">Ingrésalo al momento del pago y obtén un 10% adicional.</span>
 </p>
 <button 
 onClick={handleCTA}
 className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl active:scale-95"
 >
 Solicitar mi Plan Ahora
 </button>
 </div>
 </div>
 </section>

 {/* SECCIÓN 7 — Cierre / garantía */}
 <footer className="py-24 border-t border-slate-200 ">
 <div className="container mx-auto px-6 text-center">
 <div className="w-20 h-20 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-emerald-500">
 <CheckCircle2 size={40} />
 </div>
 <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Tu tranquilidad es nuestra prioridad</h2>
 <p className="text-slate-500 max-w-md mx-auto font-medium">
 Documento listo, firmado y verificable. Tu negocio cumpliendo con las normas sanitarias desde el primer día.
 </p>
 </div>
 </footer>

 <AuthModal 
 isOpen={isAuthModalOpen} 
 onClose={() => setIsAuthModalOpen(false)} 
 onSuccess={() => router.push("/sanitation/generate")}
 />
 </div>
 );
}
