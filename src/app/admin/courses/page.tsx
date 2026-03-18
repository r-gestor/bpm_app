import React from "react";
import { supabase } from "@/lib/supabase";
import { 
  BookOpen, 
  GraduationCap, 
  Users, 
  BarChart3, 
  MoreVertical,
  ArrowUpRight
} from "lucide-react";

export default async function AdminCoursesPage() {
  const { data: courses } = await supabase
    .from('courses')
    .select(`
      *,
      product:products(name),
      enrollments:enrollments(count)
    `);

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 italic">Catálogo Académico</h2>
          <p className="text-slate-500">Monitorea el progreso, inscritos y calificaciones de tus cursos.</p>
        </div>
        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-white transition-all shadow-xl shadow-blue-600/20 flex items-center gap-2">
           Nuevo Curso <ArrowUpRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(courses || []).map((course: any) => (
          <div key={course.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 hover:border-indigo-500/20 transition-all group">
             <div className="w-full md:w-32 h-32 rounded-3xl bg-gradient-to-br from-indigo-600/20 to-blue-600/20 flex items-center justify-center shrink-0 border border-indigo-500/10">
                <BookOpen className="w-12 h-12 text-indigo-400 group-hover:scale-110 transition-transform" />
             </div>
             <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{course.title}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest">{course.product?.name}</p>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-xl">
                    <MoreVertical className="w-5 h-5 text-slate-700" />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-4 py-6 border-t border-white/5">
                   <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <Users className="w-3 h-3" /> Inscritos
                      </p>
                      <p className="text-xl font-black text-white">{course.enrollments?.[0]?.count || 0}</p>
                   </div>
                   <div className="text-center border-x border-white/5">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <BarChart3 className="w-3 h-3" /> Promedio
                      </p>
                      <p className="text-xl font-black text-white">84%</p>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                        <GraduationCap className="w-3 h-3" /> Aprobado
                      </p>
                      <p className="text-xl font-black text-white">{course.passingScore}%</p>
                   </div>
                </div>

                <div className="pt-6">
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full italic"></div>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-2 font-mono italic text-right">Satisfacción del estudiante: 4.9/5.0</p>
                </div>
             </div>
          </div>
        ))}

        {(!courses || courses.length === 0) && (
          <div className="col-span-full py-20 px-10 rounded-[3rem] border border-dashed border-white/10 bg-white/5 flex flex-col items-center text-center">
            <BookOpen className="w-12 h-12 text-slate-600 mb-6" />
            <h3 className="text-xl font-bold text-slate-300">Catálogo vacío</h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              No se encontraron cursos registrados en la base de datos de Supabase.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
