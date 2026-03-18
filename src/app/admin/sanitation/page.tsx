import React from "react";
import { AdminService } from "@/lib/services/admin.service";
import { 
  ClipboardList, 
  FileText, 
  User, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  MoreVertical
} from "lucide-react";
import Link from "next/link";

export default async function AdminSanitationPage() {
  const plans = await AdminService.getAllSanitationPlans();

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 italic">Planes de Saneamiento</h2>
          <p className="text-slate-500">Supervisa todos los planes generados por la IA en la plataforma.</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-sm font-bold text-blue-400">{plans.length} Planes Generados</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 hover:border-blue-500/20 transition-all group relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] -z-10"></div>
            
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center">
                <FileText className="w-7 h-7 text-blue-400" />
              </div>
              <button className="p-2 hover:bg-white/5 rounded-xl transition-all">
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors uppercase tracking-tight">{plan.businessName}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Tipo: {plan.establishmentType}
              </p>
            </div>

            <div className="space-y-4 mb-10 pt-6 border-t border-white/5">
               <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500">
                    <User className="w-3.5 h-3.5" /> Propietario
                  </span>
                  <span className="font-bold text-slate-300">{(plan.owner as any)?.name}</span>
               </div>
               <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5" /> Generado el
                  </span>
                  <span className="font-bold text-slate-300">{new Date(plan.createdAt).toLocaleDateString()}</span>
               </div>
            </div>

            <Link 
              href={`/verify/${plan.certificateCode}`} 
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold transition-all group/btn"
            >
              Ver Documento <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}

        {plans.length === 0 && (
          <div className="col-span-full py-20 px-10 rounded-[3rem] border border-dashed border-white/10 bg-white/5 flex flex-col items-center text-center">
            <ClipboardList className="w-12 h-12 text-slate-600 mb-6" />
            <h3 className="text-xl font-bold text-slate-300">Sin planes registrados</h3>
            <p className="text-slate-500 mt-2 max-w-sm">
              Cuando los usuarios generen sus planes de saneamiento con la IA, aparecerán aquí.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
