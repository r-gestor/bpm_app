export const dynamic = 'force-dynamic';
import React from "react";
import { AdminService } from "@/lib/services/admin.service";
import { 
  Users, 
  TrendingUp, 
  Award, 
  ClipboardCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingDown,
  Activity
} from "lucide-react";

export default async function AdminDashboard() {
  const stats = await AdminService.getDashboardStats();

  const statCards = [
    { 
      label: "Usuarios Totales", 
      value: stats.totalUsers, 
      icon: Users, 
      color: "blue",
      trend: "+12%",
      isSuccess: true 
    },
    { 
      label: "Ventas Totales", 
      value: `$${(stats.totalSales / 1000).toFixed(1)}k`, 
      icon: TrendingUp, 
      color: "emerald",
      trend: "+8.4%",
      isSuccess: true 
    },
    { 
      label: "Certificados", 
      value: stats.totalCertificates, 
      icon: Award, 
      color: "purple",
      trend: "+24%",
      isSuccess: true 
    },
    { 
      label: "Planes de Saneamiento", 
      value: stats.totalSanitationPlans, 
      icon: ClipboardCheck, 
      color: "amber",
      trend: "-2%",
      isSuccess: false 
    },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header Info */}
      <div className="max-w-xl">
        <h2 className="text-4xl font-black text-white mb-3">Buenos días, Admin</h2>
        <p className="text-slate-500">Aquí tienes el resumen de lo que ha sucedido en la plataforma las últimas 24 horas.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-[2rem] hover:border-blue-500/20 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-4 rounded-2xl bg-${stat.color}-500/10`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${stat.isSuccess ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {stat.isSuccess ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity / Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white italic">Rendimiento de Ventas</h3>
             </div>
             <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold transition-all focus:ring-1 focus:ring-blue-500 outline-none">
                <option>Últimos 7 días</option>
                <option>Último mes</option>
             </select>
          </div>
          
          {/* Gráfico Simulado */}
          <div className="h-64 flex items-end justify-between gap-2">
            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
              <div key={i} className="flex-1 group relative">
                <div 
                  className="w-full bg-gradient-to-t from-blue-600/20 to-blue-500/60 rounded-t-xl transition-all group-hover:to-blue-400 group-hover:scale-x-105 cursor-pointer" 
                  style={{ height: `${h}%` }}
                ></div>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  ${h}k
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
            <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
          </div>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-xl font-bold text-white mb-8 italic">Notificaciones</h3>
          <div className="space-y-6">
            {[
              { type: 'Pago', msg: 'Nuevo pago aprobado por $45.000', time: 'hace 2 min', color: 'emerald' },
              { type: 'Examen', msg: 'Estudiante "Juan Perez" aprobó el curso', time: 'hace 15 min', color: 'purple' },
              { type: 'Plan', msg: 'Nuevo plan generado: Carnicería El Toro', time: 'hace 1 hora', color: 'amber' },
              { type: 'Sistema', msg: 'Copia de seguridad completada', time: 'hace 3 horas', color: 'blue' }
            ].map((n, i) => (
              <div key={i} className="flex gap-4 group">
                <div className={`w-2 h-2 rounded-full bg-${n.color}-500 mt-2 shrink-0 group-hover:scale-150 transition-transform`}></div>
                <div>
                  <div className="flex justify-between gap-4 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{n.type}</span>
                    <span className="text-[10px] text-slate-700 font-mono">{n.time}</span>
                  </div>
                  <p className="text-sm text-slate-400 group-hover:text-white transition-colors">{n.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
