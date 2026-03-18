"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Award } from "lucide-react";
import PdfCourseViewer from "@/components/courses/PdfCourseViewer";
import ExamViewer from "@/components/courses/ExamViewer";

export default function CourseContentPage() {
 const [showExam, setShowExam] = React.useState(false);
 const [certificateId, setCertificateId] = React.useState<string | null>(null);
 const slug = "manipulacion-alimentos";

 React.useEffect(() => {
 const checkCertificate = async () => {
 try {
 const res = await fetch(`/api/certificates/check/${slug}`);
 const data = await res.json();
 if (data.certificateId) setCertificateId(data.certificateId);
 } catch (err) {
 console.error("Error checking certificate:", err);
 }
 };
 checkCertificate();
 }, [slug]);

 return (
 <main className="min-h-screen bg-slate-50 transition-colors duration-500">
 {/* Background patterns */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
 <div className="absolute top-[60%] -right-[10%] w-[30%] h-[50%] bg-indigo-500/5 blur-[120px] rounded-full" />
 </div>

 <div className="relative z-10 container mx-auto px-6 pt-32 pb-12">
 <header className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
 <div className="flex items-center gap-6">
 <Link 
 href="/" 
 className="group bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all duration-300 active:scale-95"
 >
 <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
 </Link>
 <div>
 <div className="flex items-center gap-2 text-blue-600 mb-1">
 <BookOpen size={16} />
 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Plataforma de estudio</span>
 </div>
 <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">
 {showExam ? (certificateId ? "Resultados" : "Examen de") : "Módulos del"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Certificación</span>
 </h1>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row items-center gap-4">
 {certificateId && (
 <a
 href={`/api/certificates/${certificateId}`}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 bg-green-100 text-green-600 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-green-200 transition-all active:scale-95 border border-green-200 "
 >
 <Award size={16} />
 Descargar Certificado
 </a>
 )}
 
 <div className="flex bg-white p-1.5 rounded-2xl shadow-inner border border-slate-200 ">
 <button
 onClick={() => setShowExam(false)}
 className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
 !showExam 
 ? "bg-slate-900 text-white shadow-lg" 
 : "text-slate-400 hover:text-slate-600"
 }`}
 >
 Contenido
 </button>
 <button
 onClick={() => setShowExam(true)}
 className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
 showExam 
 ? "bg-slate-900 text-white shadow-lg" 
 : "text-slate-400 hover:text-slate-600"
 }`}
 >
 {certificateId ? "Certificación" : "Realizar Examen"}
 </button>
 </div>
 </div>
 </header>

 <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
 {showExam ? (
 <ExamViewer slug={slug} />
 ) : (
 <PdfCourseViewer />
 )}
 </section>
 
 <footer className="max-w-4xl mx-auto mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
 Sesión de estudio activa
 </div>
 <div>© 2026 BPM Academy • Todos los derechos reservados</div>
 </footer>
 </div>
 </main>
 );
}
