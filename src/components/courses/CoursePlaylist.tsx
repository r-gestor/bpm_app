"use client";

import React from "react";
import { CheckCircle2, Circle, Lock } from "lucide-react";

interface CoursePlaylistProps {
 course: any;
 currentVideoId: string;
 onSelectVideo: (videoId: string) => void;
 examUnlocked: boolean;
}

export default function CoursePlaylist({ course, currentVideoId, onSelectVideo, examUnlocked }: CoursePlaylistProps) {
 return (
 <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden sticky top-8">
 <div className="p-6 bg-slate-50 border-b border-slate-100 ">
 <h3 className="font-black text-slate-900 uppercase tracking-wider text-sm">
 Contenido del Curso
 </h3>
 </div>

 <div className="overflow-y-auto max-h-[calc(100vh-250px)]">
 {course.modules.map((module: any) => (
 <div key={module.id} className="border-b border-slate-100 last:border-0">
 <div className="px-6 py-4 bg-slate-50/50 ">
 <span className="text-xs font-bold text-slate-400 uppercase">Módulo {module.sortOrder}</span>
 <h4 className="font-bold text-slate-800 ">{module.title}</h4>
 </div>
 
 <div className="py-2">
 {module.videos.map((video: any) => {
 const isActive = video.id === currentVideoId;
 const isCompleted = video.progress?.[0]?.completed;

 return (
 <button
 key={video.id}
 onClick={() => onSelectVideo(video.id)}
 className={`w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-slate-50 text-left ${
 isActive ? "bg-blue-50/50 border-l-4 border-blue-600" : "border-l-4 border-transparent"
 }`}
 >
 <div className={isCompleted ? "text-green-500" : "text-slate-300"}>
 {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
 </div>
 <span className={`text-sm font-medium ${isActive ? "text-blue-600 font-bold" : "text-slate-600 "}`}>
 {video.title}
 </span>
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </div>

 {/* Exam Section */}
 <div className={`p-6 border-t border-slate-100 transition-colors ${
 examUnlocked ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-slate-50 "
 }`}>
 <button
 disabled={!examUnlocked}
 className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
 examUnlocked 
 ? "bg-white text-blue-600 hover:scale-105 shadow-xl" 
 : "text-slate-400 cursor-not-allowed"
 }`}
 >
 {!examUnlocked && <Lock size={16} />}
 Realizar Examen Final
 </button>
 {!examUnlocked && (
 <p className="text-[10px] text-center text-slate-400 mt-2 uppercase font-bold tracking-tighter">
 Completa todos los videos para desbloquear
 </p>
 )}
 </div>
 </div>
 );
}
