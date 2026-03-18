"use client";

import React, { useState } from "react";
import { Play, CheckCircle, Loader2 } from "lucide-react";

interface VideoPlayerProps {
 video: any;
 onProgressUpdate: () => void;
}

export default function VideoPlayer({ video, onProgressUpdate }: VideoPlayerProps) {
 const [updating, setUpdating] = useState(false);
 const isCompleted = video.progress?.[0]?.completed;

 const handleMarkAsCompleted = async () => {
 setUpdating(true);
 try {
 await fetch("/api/courses/progress", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ videoId: video.id, completed: true }),
 });
 onProgressUpdate();
 } catch (error) {
 console.error("Error updating progress:", error);
 } finally {
 setUpdating(false);
 }
 };

 return (
 <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 ">
 {/* Video Mock/Player Area */}
 <div className="aspect-video bg-black flex items-center justify-center relative group">
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
 <button className="relative z-10 bg-white/20 hover:bg-white/30 backdrop-blur-md p-6 rounded-full transition-all hover:scale-110 text-white">
 <Play size={48} fill="currentColor" />
 </button>
 <div className="absolute bottom-6 left-8 text-white">
 <h2 className="text-2xl font-bold">{video.title}</h2>
 </div>
 </div>

 {/* Controls / Info */}
 <div className="p-8 flex items-center justify-between">
 <div className="max-w-md">
 <p className="text-slate-500 text-sm italic">
 Visualiza este video completamente para poder marcarlo como completado.
 </p>
 </div>

 <button
 onClick={handleMarkAsCompleted}
 disabled={updating || isCompleted}
 className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all ${
 isCompleted
 ? "bg-green-50 text-green-600 "
 : "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow-lg shadow-blue-500/30"
 } disabled:opacity-50 disabled:hover:scale-100`}
 >
 {updating ? (
 <Loader2 className="animate-spin" size={20} />
 ) : isCompleted ? (
 <CheckCircle size={20} />
 ) : null}
 {isCompleted ? "Completado" : "Marcar como Completado"}
 </button>
 </div>
 </div>
 );
}
