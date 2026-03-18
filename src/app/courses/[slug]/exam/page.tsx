"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ExamInterface from "@/components/courses/ExamInterface";
import { CheckCircle2, XCircle, Award, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import Link from "next/link";

export default function ExamPage() {
 const { slug } = useParams();
 const router = useRouter();
 const [examData, setExamData] = useState<any>(null);
 const [result, setResult] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");

 const startExam = async () => {
 setLoading(true);
 setError("");
 try {
 // Primero obtenemos el ID del curso basándonos en el slug
 const courseRes = await fetch(`/api/courses/content/${slug}`);
 const { course } = await courseRes.json();

 if (!course) throw new Error("Curso no encontrado.");

 const res = await fetch("/api/exams/start", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ courseId: course.id }),
 });
 const data = await res.json();
 
 if (data.error) setError(data.error);
 else setExamData(data);
 } catch (err: any) {
 setError(err.message || "Error al iniciar el examen.");
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 startExam();
 }, [slug]);

 if (loading) return (
 <div className="h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 ">
 <RefreshCw className="animate-spin text-blue-600" size={48} />
 <p className="font-black text-slate-400 uppercase tracking-widest text-sm text-center">
 Preparando cuestionario aleatorio...
 </p>
 </div>
 );

 if (error) return (
 <div className="h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
 <div className="bg-red-50 p-12 rounded-[40px] border border-red-100 max-w-md">
 <XCircle className="text-red-500 mx-auto mb-6" size={64} />
 <h2 className="text-2xl font-black text-slate-900 mb-4 uppercase">Acceso Denegado</h2>
 <p className="text-slate-500 mb-8">{error}</p>
 <Link href={`/courses/${slug}/learn`} className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black transition-all hover:scale-105">
 <ArrowLeft size={20} />
 Volver al Curso
 </Link>
 </div>
 </div>
 );

 // Pantalla de Resultados
 if (result) {
 return (
 <div className="min-h-screen bg-slate-50 py-20 px-6">
 <div className="max-w-xl mx-auto text-center">
 <div className={`p-12 rounded-[50px] shadow-2xl border-2 mb-12 relative overflow-hidden ${
 result.passed 
 ? "bg-white border-green-500/20" 
 : "bg-white border-red-500/20"
 }`}>
 <div className={`absolute top-0 inset-x-0 h-2 ${result.passed ? "bg-green-500" : "bg-red-500"}`}></div>
 
 {result.passed ? (
 <Award className="text-yellow-500 mx-auto mb-8 animate-bounce" size={80} />
 ) : (
 <XCircle className="text-red-500 mx-auto mb-8" size={80} />
 )}

 <h1 className="text-5xl font-black text-slate-900 mb-4">
 {result.score}%
 </h1>
 <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">
 Tu Calificación Final
 </p>

 <h2 className={`text-3xl font-black mb-6 uppercase tracking-tight ${result.passed ? "text-green-600" : "text-red-600"}`}>
 {result.passed ? "¡Has Aprobado!" : "No has aprobado"}
 </h2>

 <p className="text-slate-500 mb-10 text-lg">
 Has respondido correctamente <strong>{result.correctAnswers}</strong> de <strong>{result.totalQuestions}</strong> preguntas.
 </p>

 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 {result.passed ? (
 <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-xl shadow-blue-500/20">
 <FileText size={20} />
 Ver Certificado
 </button>
 ) : (
 <button 
 onClick={() => {setResult(null); startExam();}}
 className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black flex items-center justify-center gap-3 transition-all hover:scale-105 shadow-xl"
 >
 <RefreshCw size={20} />
 Reintentar Examen
 </button>
 )}
 </div>
 </div>

 <Link href={`/courses/${slug}/learn`} className="text-slate-400 hover:text-slate-900 font-bold transition-colors">
 Volver al Panel del Curso
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen bg-slate-50 py-20 px-6">
 <ExamInterface 
 questions={examData.questions} 
 attemptId={examData.attemptId} 
 onFinish={setResult}
 />
 </div>
 );
}
