"use client";

import React, { useState, useEffect } from "react";
import {
 CheckCircle2,
 XCircle,
 ArrowRight,
 RotateCcw,
 Loader2,
 Award,
 ShieldCheck,
 Brain,
 ChevronDown,
 ChevronUp
} from "lucide-react";

interface Question {
 id: string;
 question: string;
 options: string[];
}

interface ExamViewerProps {
 slug: string;
}

export default function ExamViewer({ slug }: ExamViewerProps) {
 const [course, setCourse] = useState<any>(null);
 const [questions, setQuestions] = useState<Question[]>([]);
 const [currentIndex, setCurrentIndex] = useState(0);
 const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
 const [loading, setLoading] = useState(true);
 const [submitting, setSubmitting] = useState(false);
 const [result, setResult] = useState<any>(null);
 const [submittedQuestions, setSubmittedQuestions] = useState<Question[]>([]);
 const [showBreakdown, setShowBreakdown] = useState(false);

 const fetchExam = async () => {
 setLoading(true);
 setResult(null);
 setCurrentIndex(0);
 setSelectedAnswers({});
 try {
 const res = await fetch(`/api/courses/exam/${slug}`);
 const data = await res.json();
 if (data.error) throw new Error(data.error);
 setCourse(data.course);
 
 if (data.alreadyPassed) {
 setResult(data.result);
 } else {
 setQuestions(data.questions);
 }
 } catch (err) {
 console.error("Error fetching exam:", err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchExam();
 }, [slug]);

 const handleSelect = (questionId: string, optionIndex: number) => {
 setSelectedAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
 };

 const nextQuestion = () => {
 if (currentIndex < questions.length - 1) {
 setCurrentIndex(currentIndex + 1);
 }
 };

 const prevQuestion = () => {
 if (currentIndex > 0) {
 setCurrentIndex(currentIndex - 1);
 }
 };

 const submitExam = async () => {
 setSubmitting(true);
 try {
 const answers = questions.map(q => ({
 questionId: q.id,
 selectedAnswer: selectedAnswers[q.id]
 }));

 // Guardar snapshot de preguntas antes de que se reseteen
 setSubmittedQuestions([...questions]);

 const res = await fetch("/api/courses/exam/submit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 courseId: course.id,
 answers
 })
 });

 const data = await res.json();
 setResult(data);
 setShowBreakdown(false);
 } catch (err) {
 console.error("Error submitting exam:", err);
 } finally {
 setSubmitting(false);
 }
 };

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center p-20 gap-4 text-slate-400">
 <Loader2 className="animate-spin" size={40} />
 <p className="font-bold uppercase tracking-widest text-[10px]">Preparando tu examen...</p>
 </div>
 );
 }

 if (result) {
 const passed = result.passed;
 const questionResults: { questionId: string; selectedAnswerIndex: number; correctAnswerIndex: number; isCorrect: boolean; correctAnswerText?: string | null }[] = result.questionResults || [];

 return (
 <div className="w-full max-w-2xl mx-auto space-y-6">
   {/* Tarjeta de resultado principal */}
   <div className={`bg-white rounded-3xl overflow-hidden shadow-2xl border-2 transition-all duration-700 ${
   passed ? "border-green-500/30" : "border-red-500/30"
   }`}>
   <div className={`p-10 text-center ${passed ? "bg-green-50/50" : "bg-red-50/50"}`}>
   <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-transform duration-700 scale-110 ${
   passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
   }`}>
   {passed ? <Award size={48} /> : <XCircle size={48} />}
   </div>
   <h2 className={`text-4xl font-black mb-2 uppercase tracking-tight ${passed ? "text-green-600" : "text-red-600"}`}>
   {passed ? "¡Felicidades!" : "Sigue intentando"}
   </h2>
   <p className="text-slate-500 font-medium">
   {passed
   ? "Has aprobado el examen con éxito. Tu certificación está lista."
   : "No has alcanzado el puntaje mínimo (80%) para aprobar."}
   </p>
   </div>

   <div className="p-10 bg-white">
   <div className="grid grid-cols-2 gap-6 mb-8">
   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Puntaje</p>
   <p className="text-3xl font-black text-slate-900">{Math.round(result.score)}%</p>
   </div>
   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Correctas</p>
   <p className="text-3xl font-black text-slate-900">{result.correctCount}/{result.totalQuestions}</p>
   </div>
   </div>

   <div className="flex gap-4">
   {!passed ? (
   <button
   onClick={fetchExam}
   className="flex-1 flex items-center justify-center gap-3 bg-slate-100 hover:bg-slate-200 p-5 rounded-2xl font-black text-slate-600 transition-all active:scale-95 uppercase tracking-widest text-xs"
   >
   <RotateCcw size={18} />
   Reintentar ahora
   </button>
   ) : result.certificateId ? (
   <a
   href={`/api/certificates/${result.certificateId}`}
   target="_blank"
   rel="noopener noreferrer"
   className="flex-1 bg-green-50 hover:bg-green-100 p-5 rounded-2xl border border-green-100 text-center transition-all active:scale-95 group"
   >
   <p className="text-green-600 font-black uppercase tracking-widest text-[10px] group-hover:scale-105 transition-transform">
   Certificación Obtenida ✓
   </p>
   </a>
   ) : (
   <div className="flex-1 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-center">
   <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Preparando Certificado...</p>
   </div>
   )}
   {passed && result.certificateId && (
   <a
   href={`/api/certificates/${result.certificateId}`}
   target="_blank"
   rel="noopener noreferrer"
   className="flex-3 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 p-5 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20 transition-all active:scale-95 uppercase tracking-widest text-xs"
   >
   Ver Certificado
   <ArrowRight size={18} />
   </a>
   )}
   </div>
   </div>
   </div>

   {/* Detalle de preguntas y respuestas */}
   {questionResults.length > 0 && submittedQuestions.length > 0 && (
   <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
   <button
   onClick={() => setShowBreakdown(prev => !prev)}
   className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors"
   >
   <div className="flex items-center gap-3">
   <Brain size={20} className="text-blue-600" />
   <span className="font-black text-slate-800 uppercase tracking-widest text-sm">
   Revisión de Respuestas
   </span>
   <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full uppercase tracking-wider">
   {questionResults.filter(r => r.isCorrect).length} correctas · {questionResults.filter(r => !r.isCorrect).length} incorrectas
   </span>
   </div>
   {showBreakdown ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
   </button>

   {showBreakdown && (
   <div className="divide-y divide-slate-100">
   {questionResults.map((qr, idx) => {
   const q = submittedQuestions.find(sq => sq.id === qr.questionId);
   if (!q) return null;

   // Validación defensiva: si correctAnswerIndex está fuera de rango,
   // intentamos localizar la respuesta correcta por texto (fallback del backend)
   let resolvedCorrectIdx = qr.correctAnswerIndex;
   if (resolvedCorrectIdx < 0 || resolvedCorrectIdx >= q.options.length) {
     if (qr.correctAnswerText) {
       resolvedCorrectIdx = q.options.findIndex((o: string) => o === qr.correctAnswerText);
     }
   }

   return (
   <div key={qr.questionId} className={`p-6 ${qr.isCorrect ? "bg-green-50/40" : "bg-red-50/40"}`}>
   {/* Número y pregunta */}
   <div className="flex items-start gap-3 mb-4">
   <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
   qr.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
   }`}>
   {idx + 1}
   </div>
   <p className="font-bold text-slate-800 leading-snug">{q.question}</p>
   </div>

   {/* Opciones */}
   <div className="space-y-2 ml-10">
   {q.options.map((option, optIdx) => {
   const isSelected = optIdx === qr.selectedAnswerIndex;
   const isCorrect = optIdx === resolvedCorrectIdx;

   let style = "bg-white border-slate-200 text-slate-600";
   if (isCorrect) style = "bg-green-100 border-green-400 text-green-800 font-bold";
   else if (isSelected && !isCorrect) style = "bg-red-100 border-red-400 text-red-700 font-bold";

   return (
   <div key={optIdx} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm ${style}`}>
   <div className="shrink-0">
   {isCorrect && <CheckCircle2 size={16} className="text-green-600" />}
   {isSelected && !isCorrect && <XCircle size={16} className="text-red-500" />}
   {!isCorrect && !isSelected && <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
   </div>
   <span>{option}</span>
   {isSelected && isCorrect && <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-green-700">Tu respuesta ✓</span>}
   {isSelected && !isCorrect && <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-red-600">Tu respuesta</span>}
   {!isSelected && isCorrect && <span className="ml-auto text-[10px] font-black uppercase tracking-wider text-green-700">Respuesta correcta</span>}
   </div>
   );
   })}
   </div>
   </div>
   );
   })}
   </div>
   )}
   </div>
   )}
 </div>
 );
 }

 const currentQuestion = questions[currentIndex];
 const progress = ((currentIndex + 1) / questions.length) * 100;

 return (
 <div className="w-full max-w-3xl mx-auto">
 <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl overflow-hidden shadow-2xl transition-all">
 {/* Progress Bar */}
 <div className="h-2 bg-slate-100 w-full overflow-hidden">
 <div 
 className="h-full bg-blue-600 transition-all duration-500 ease-out"
 style={{ width: `${progress}%` }}
 />
 </div>

 <div className="p-8 md:p-12">
 <header className="flex items-center justify-between mb-10">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
 <Brain size={24} />
 </div>
 <div>
 <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">Pregunta {currentIndex + 1} de {questions.length}</p>
 <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Evaluación Final</h3>
 </div>
 </div>
 <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 ">
 <span className="text-lg font-black text-slate-400">{Math.round(progress)}%</span>
 </div>
 </header>

 <div className="mb-10">
 <h2 className="text-2xl font-bold text-slate-800 leading-tight">
 {currentQuestion.question}
 </h2>
 </div>

 <div className="space-y-4 mb-12">
 {currentQuestion.options.map((option, index) => (
 <button
 key={index}
 onClick={() => handleSelect(currentQuestion.id, index)}
 className={`w-full group text-left p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
 selectedAnswers[currentQuestion.id] === index
 ? "border-blue-600 bg-blue-50/50 ring-4 ring-blue-500/5"
 : "border-slate-100 hover:border-blue-300 hover:bg-slate-50 "
 }`}
 >
 <div className="flex items-center gap-4 relative z-10">
 <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
 selectedAnswers[currentQuestion.id] === index
 ? "border-blue-600 bg-blue-600 text-white"
 : "border-slate-300 group-hover:border-blue-400"
 }`}>
 {selectedAnswers[currentQuestion.id] === index && <CheckCircle2 size={14} />}
 </div>
 <span className={`font-bold transition-colors ${
 selectedAnswers[currentQuestion.id] === index
 ? "text-blue-900 "
 : "text-slate-600 "
 }`}>
 {option}
 </span>
 </div>
 </button>
 ))}
 </div>

 <div className="flex items-center justify-between gap-6">
 <button
 onClick={prevQuestion}
 disabled={currentIndex === 0}
 className={`p-6 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 ${
 currentIndex === 0 
 ? "opacity-30 cursor-not-allowed text-slate-300" 
 : "bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 shadow-sm "
 }`}
 >
 Anterior
 </button>

 {currentIndex < questions.length - 1 ? (
 <button
 onClick={nextQuestion}
 disabled={selectedAnswers[currentQuestion.id] === undefined}
 className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs ${
 selectedAnswers[currentQuestion.id] === undefined
 ? "bg-slate-200 cursor-not-allowed shadow-none"
 : "bg-slate-900 hover:bg-black shadow-blue-500/10"
 }`}
 >
 Siguiente
 <ArrowRight size={18} />
 </button>
 ) : (
 <button
 onClick={submitExam}
 disabled={submitting || selectedAnswers[currentQuestion.id] === undefined}
 className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-12 py-5 rounded-2xl font-black text-white shadow-2xl transition-all active:scale-95 uppercase tracking-[0.2em] text-xs ${
 submitting || selectedAnswers[currentQuestion.id] === undefined
 ? "bg-slate-200 cursor-not-allowed shadow-none"
 : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/20"
 }`}
 >
 {submitting ? (
 <>
 <Loader2 className="animate-spin" size={18} />
 Calificando...
 </>
 ) : (
 <>
 Enviar Examen
 <ShieldCheck size={18} />
 </>
 )}
 </button>
 )}
 </div>
 </div>
 </div>
 
 <div className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
 <span className="text-blue-500">BPM ACADEMY</span> • EXAMEN DE CERTIFICACIÓN OFICIAL
 </div>
 </div>
 );
}
