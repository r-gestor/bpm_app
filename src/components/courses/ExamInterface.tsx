"use client";

import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Send, CheckCircle2, XCircle, Award } from "lucide-react";

interface ExamInterfaceProps {
 questions: any[];
 attemptId: string;
 onFinish: (result: any) => void;
}

export default function ExamInterface({ questions, attemptId, onFinish }: ExamInterfaceProps) {
 const [currentIndex, setCurrentIndex] = useState(0);
 const [answers, setAnswers] = useState<Record<string, number>>({});
 const [submitting, setSubmitting] = useState(false);

 const currentQuestion = questions[currentIndex];
 const isLast = currentIndex === questions.length - 1;

 const handleSelect = (optionIndex: number) => {
 setAnswers({ ...answers, [currentQuestion.id]: optionIndex });
 };

 const handleSubmit = async () => {
 setSubmitting(true);
 try {
 const respList = Object.entries(answers).map(([qId, val]) => ({
 questionId: qId,
 selectedAnswer: val,
 }));

 const res = await fetch("/api/exams/submit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ attemptId, answers: respList }),
 });
 const result = await res.json();
 onFinish(result);
 } catch (error) {
 console.error("Error submitting exam:", error);
 } finally {
 setSubmitting(false);
 }
 };

 return (
 <div className="max-w-3xl mx-auto">
 {/* Progress Bar */}
 <div className="mb-12">
 <div className="flex justify-between items-center mb-4">
 <span className="text-xs font-black uppercase tracking-widest text-slate-400">
 Pregunta {currentIndex + 1} de {questions.length}
 </span>
 <span className="text-xs font-black text-blue-600">
 {Math.round(((currentIndex + 1) / questions.length) * 100)}% Completado
 </span>
 </div>
 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 shadow-lg shadow-blue-500/20"
 style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
 ></div>
 </div>
 </div>

 {/* Question Card */}
 <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
 
 <h2 className="text-2xl font-black text-slate-900 mb-10 leading-snug">
 {currentQuestion.question}
 </h2>

 <div className="space-y-4">
 {currentQuestion.options.map((option: string, index: number) => {
 const isSelected = answers[currentQuestion.id] === index;
 return (
 <button
 key={index}
 onClick={() => handleSelect(index)}
 className={`w-full text-left p-6 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between group ${
 isSelected
 ? "border-blue-600 bg-blue-50/50 text-blue-700 "
 : "border-slate-100 hover:border-slate-200 text-slate-600 "
 }`}
 >
 <span className="font-bold">{option}</span>
 <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all ${
 isSelected ? "border-blue-600 bg-blue-600 shadow-md" : "border-slate-200 "
 }`}>
 {isSelected && <div className="h-2 w-2 bg-white rounded-full"></div>}
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Navigation */}
 <div className="flex items-center justify-between mt-12">
 <button
 onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
 disabled={currentIndex === 0}
 className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-all disabled:opacity-0"
 >
 <ArrowLeft size={20} />
 Anterior
 </button>

 {!isLast ? (
 <button
 onClick={() => setCurrentIndex(currentIndex + 1)}
 disabled={answers[currentQuestion.id] === undefined}
 className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black bg-slate-900 text-white transition-all hover:scale-105 shadow-xl disabled:opacity-50 disabled:hover:scale-100"
 >
 Siguiente
 <ArrowRight size={20} />
 </button>
 ) : (
 <button
 onClick={handleSubmit}
 disabled={submitting || answers[currentQuestion.id] === undefined}
 className="flex items-center gap-3 px-10 py-4 rounded-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 text-white transition-all hover:scale-110 shadow-2xl shadow-blue-500/30 disabled:opacity-50 disabled:hover:scale-100"
 >
 {submitting ? "Procesando..." : "Finalizar Examen"}
 <Send size={20} />
 </button>
 )}
 </div>
 </div>
 );
}
