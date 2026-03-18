export const dynamic = 'force-dynamic';
import React from "react";
import { AdminService } from "@/lib/services/admin.service";
import { 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink,
  Hash,
  Filter
} from "lucide-react";

export default async function AdminPaymentsPage() {
  const payments = await AdminService.getAllPayments();

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DECLINED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle2 className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'DECLINED': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 italic">Control de Pagos</h2>
          <p className="text-slate-500">Monitoreo en tiempo real de transacciones y estados de facturación.</p>
        </div>
        <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-bold">
          <Filter className="w-5 h-5 text-slate-400" /> Filtrar Transacciones
        </button>
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Referencia / Comprador</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Producto</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Monto</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Estado</th>
                <th className="px-8 py-5 text-center">ID Wompi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                        <Hash className="w-5 h-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-sm font-mono text-blue-400 group-hover:text-blue-300 transition-colors uppercase">#{payment.id.split('-')[0]}</p>
                        <p className="text-xs text-slate-500">{(payment.buyer as any)?.name || 'Sin nombre'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white">{(payment.product as any)?.name}</p>
                    <p className="text-[10px] text-slate-600 uppercase tracking-tighter">Venta Directa</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-lg font-black text-white">${Number(payment.finalAmount).toLocaleString()}</p>
                    <p className="text-[10px] text-slate-600 font-mono">COP {payment.currency}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(payment.status)}`}>
                      {getStatusIcon(payment.status)}
                      {payment.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    {payment.transactionId ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-600">
                        {payment.transactionId}
                        <ExternalLink className="w-3.5 h-3.5 cursor-pointer hover:text-blue-400" />
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-800 uppercase italic">Pendiente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
