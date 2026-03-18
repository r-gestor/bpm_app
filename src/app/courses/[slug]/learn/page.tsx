"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import VideoPlayer from "@/components/courses/VideoPlayer";
import CoursePlaylist from "@/components/courses/CoursePlaylist";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function LearnPage() {
 const { slug } = useParams();
 const [data, setData] = useState<any>(null);
 const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
 const [loading, setLoading] = useState(true);

 const fetchData = async () => {
 try {
 const res = await fetch(`/api/courses/content/${slug}`);
 const json = await res.json();
 setData(json);
 
 // Set first video by default if not set
 if (!currentVideoId && json.course?.modules[0]?.videos[0]) {
 setCurrentVideoId(json.course.modules[0].videos[0].id);
 }
 } catch (err) {
 console.error("Error fetching content:", err);
 } finally {
 setLoading(false);
 }
 };

 useEffect(() => {
 fetchData();
 }, [slug]);

 if (loading) return <div className="h-screen flex items-center justify-center">Cargando curso...</div>;
 if (!data?.course) return <div className="h-screen flex items-center justify-center text-red-500">Curso no encontrado</div>;

 const currentVideo = data.course.modules
 .flatMap((m: any) => m.videos)
 .find((v: any) => v.id === currentVideoId);

 return (
 <div className="min-h-screen bg-slate-50 p-8">
 <div className="max-w-7xl mx-auto">
 <header className="flex items-center justify-between mb-12">
 <div className="flex items-center gap-6">
 <Link href="/" className="bg-white p-3 rounded-xl shadow-md border border-slate-100 text-slate-500 hover:text-blue-600 transition-all">
 <ArrowLeft size={24} />
 </Link>
 <div>
 <div className="flex items-center gap-2 text-blue-600 mb-1">
 <BookOpen size={16} />
 <span className="text-[10px] font-black uppercase tracking-widest">Estudiando ahora</span>
 </div>
 <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
 {data.course.title}
 </h1>
 </div>
 </div>
 
 <div className="hidden sm:block">
 <div className="bg-white px-6 py-3 rounded-2xl shadow-lg border border-slate-100 ">
 <span className="text-xs font-bold text-slate-400 mr-2 uppercase tracking-wider text-[10px]">Progreso:</span>
 <span className="text-xl font-black text-blue-600">85%</span>
 </div>
 </div>
 </header>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
 <div className="lg:col-span-2 space-y-8">
 {currentVideo ? (
 <VideoPlayer 
 video={currentVideo} 
 onProgressUpdate={fetchData} 
 />
 ) : (
 <div className="aspect-video bg-black rounded-3xl flex items-center justify-center">
 <p className="text-white">Selecciona un video para comenzar</p>
 </div>
 )}
 
 <div className="prose max-w-none">
 <h3 className="text-xl font-bold mb-4">Acerca de esta lección</h3>
 <p className="text-slate-600 ">
 {currentVideo?.description || "En esta lección cubriremos los conceptos fundamentales necesarios para dominar el tema. Asegúrate de tomar notas y revisar los materiales complementarios si están disponibles."}
 </p>
 </div>
 </div>

 <aside className="lg:col-span-1">
 <CoursePlaylist 
 course={data.course}
 currentVideoId={currentVideoId || ""}
 onSelectVideo={setCurrentVideoId}
 examUnlocked={data.examUnlocked}
 />
 </aside>
 </div>
 </div>
 </div>
 );
}
