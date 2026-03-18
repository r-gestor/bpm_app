export const dynamic = 'force-dynamic';
import React from "react";
import { AdminService } from "@/lib/services/admin.service";
import { Users, Search, Filter } from "lucide-react";
import UsersTableClient from "@/components/admin/UsersTableClient";

export default async function AdminUsersPage() {
  const users = await AdminService.getAllUsers();

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white mb-2 italic">Gestión de Usuarios</h2>
          <p className="text-slate-500">Administra los roles y estados de todos los miembros de la plataforma.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por email..."
              className="bg-slate-900/50 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all w-full md:w-64"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <Filter className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <UsersTableClient initialUsers={users} />
    </div>
  );
}
