"use client";

import React, { useState, useEffect } from "react";
import { FileText, CheckCircle, Circle, ExternalLink, BookOpen, Loader2 } from "lucide-react";

interface PdfFile {
 name: string;
 path: string;
 id: string; // This will map to CourseVideo.id
}

const HARDCODED_PDFS = [
 { name: "1. Introducción", path: "/pdfs/1. Introduccion.pdf" },
 { name: "2. Higiene Alimentaria", path: "/pdfs/2. Higiene Alimentaria.pdf" },
 { name: "3. Enfermedades de Transmisión Alimentaria", path: "/pdfs/3. Enfermedades de Transmisión Alimentaria.pdf" },
 { name: "4. Conservación y Almacenamiento de Alimentos", path: "/pdfs/4. Conservación y Almacenamiento de Alimentos.pdf" },
 { name: "5. Limpieza e Higiene del Establecimiento", path: "/pdfs/5. Limpieza e Higiene del Establecimiento.pdf" },
 { name: "6. Higiene de los Manipuladores", path: "/pdfs/6. Higiene de los Manipuladores.pdf" },
 { name: "7. Contaminación de los Alimentos", path: "/pdfs/7. Contaminación de los Alimentos.pdf" },
 { name: "8. Buenas Prácticas de Manufactura y Sistema HACCP", path: "/pdfs/8. Buenas Prácticas de Manufactura y Sistema HACCP.pdf" },
];

export default function PdfCourseViewer() {
 const [courseData, setCourseData] = useState<any>(null);
 const [pdfFiles, setPdfFiles] = useState<PdfFile[]>([]);
 const [seenPdfs, setSeenPdfs] = useState<Record<string, boolean>>({});
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 const loadContent = async () => {
 try {
 // 1. Fetch course content (videos/lessons)
 const res = await fetch("/api/courses/content/manipulacion-alimentos");
 const json = await res.json();
 const data = json.course;
 setCourseData(data);

 if (data && data.videos) {
 // Sort videos by order and map to our hardcoded PDFs
 const sortedVideos = [...data.videos].sort((a, b) => (a.order || 0) - (b.order || 0));
 const mappedPdfs = HARDCODED_PDFS.map((pdf, index) => ({
 ...pdf,
 id: sortedVideos[index]?.id || `temp-${index}`
 }));
 setPdfFiles(mappedPdfs);

 // 2. Fetch progress from server
 const pRes = await fetch(`/api/courses/progress?courseId=${data.id}`);
 const pData = await pRes.json();
 
 const progressMap: Record<string, boolean> = {};
 if (Array.isArray(pData)) {
 pData.forEach((p: any) => {
 if (p.completed) progressMap[p.videoId] = true;
 });
 }
 setSeenPdfs(progressMap);
 }
 } catch (err) {
 console.error("Error loading course content:", err);
 } finally {
 setLoading(false);
 }
 };

 loadContent();
 }, []);

 const toggleSeen = async (videoId: string, e: React.MouseEvent) => {
 e.stopPropagation();
 if (!courseData) return;

 const isCurrentlySeen = !!seenPdfs[videoId];
 const newSeenPdfs = { ...seenPdfs, [videoId]: !isCurrentlySeen };
 
 // Optimistic UI update
 setSeenPdfs(newSeenPdfs);

 try {
 await fetch("/api/courses/progress", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 courseId: courseData.id,
 videoId: videoId,
 completed: !isCurrentlySeen,
 watchedSeconds: 0
 })
 });
 } catch (err) {
 console.error("Error saving progress:", err);
 // Revert on error
 setSeenPdfs(seenPdfs);
 }
 };

 const openPdf = (path: string) => {
 window.open(path, "_blank");
 };

 const progress = pdfFiles.length > 0 
 ? Math.round((Object.values(seenPdfs).filter(Boolean).length / pdfFiles.length) * 100)
 : 0;

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-20 gap-4">
 <Loader2 className="animate-spin text-blue-600" size={40} />
 <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando material de estudio...</p>
 </div>
 );
 }

 return (
 <div className="w-full max-w-4xl mx-auto p-4 md:p-8">
 <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
 <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <div className="flex items-center gap-2 text-blue-600 mb-2">
 <BookOpen size={18} />
 <span className="text-[10px] font-black uppercase tracking-[0.2em]">Material de Estudio</span>
 </div>
 <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
 Contenido del Curso
 </h2>
 <p className="text-slate-500 mt-2 text-sm font-medium">
 Explora los módulos y marca tu progreso a medida que avanzas.
 </p>
 </div>
 
 <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 ">
 <div className="text-right">
 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tu Progreso</p>
 <p className="text-2xl font-black text-blue-600 leading-none">{progress}%</p>
 </div>
 <div className="w-12 h-12 rounded-full border-4 border-slate-200 relative flex items-center justify-center">
 <svg className="absolute inset-0 w-full h-full -rotate-90">
 <circle
 cx="24"
 cy="24"
 r="20"
 fill="none"
 stroke="currentColor"
 strokeWidth="4"
 className="text-blue-600 transition-all duration-1000 ease-out"
 strokeDasharray={126}
 strokeDashoffset={126 - (126 * progress) / 100}
 strokeLinecap="round"
 />
 </svg>
 <span className="text-[10px] font-bold text-slate-600 ">
 {Object.values(seenPdfs).filter(Boolean).length}/{pdfFiles.length}
 </span>
 </div>
 </div>
 </div>

 <div className="divide-y divide-slate-100 ">
 {pdfFiles.map((pdf) => (
 <div
 key={pdf.id}
 onClick={() => openPdf(pdf.path)}
 className="group flex items-center justify-between p-6 hover:bg-slate-50/50 transition-all cursor-pointer relative overflow-hidden"
 >
 <div className="flex items-center gap-5 relative z-10">
 <div className={`p-4 rounded-2xl transition-all duration-300 ${
 seenPdfs[pdf.id] 
 ? "bg-green-50 text-green-600" 
 : "bg-blue-50 text-blue-600 group-hover:scale-110"
 }`}>
 <FileText size={24} />
 </div>
 <div>
 <h3 className={`font-bold transition-colors ${
 seenPdfs[pdf.id] ? "text-slate-400 line-through" : "text-slate-800 "
 }`}>
 {pdf.name}
 </h3>
 <div className="flex items-center gap-3 mt-1">
 <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Documento PDF</span>
 <span className="w-1 h-1 rounded-full bg-slate-300 " />
 <span className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 Click para abrir <ExternalLink size={10} />
 </span>
 </div>
 </div>
 </div>

 <button
 onClick={(e) => toggleSeen(pdf.id, e)}
 className={`relative z-10 p-2 rounded-xl transition-all duration-300 ${
 seenPdfs[pdf.id]
 ? "text-green-600 bg-green-50 scale-110 shadow-lg shadow-green-200 "
 : "text-slate-300 hover:text-blue-500 hover:bg-blue-50 "
 }`}
 title={seenPdfs[pdf.id] ? "Marcar como no leído" : "Marcar como leído"}
 >
 {seenPdfs[pdf.id] ? (
 <CheckCircle size={28} className="fill-current" />
 ) : (
 <Circle size={28} />
 )}
 </button>
 
 <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/0 to-blue-600/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
