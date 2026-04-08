export const dynamic = "force-dynamic";
import React from "react";
import { AdminService } from "@/lib/services/admin.service";
import BulkUsersClient from "@/components/admin/BulkUsersClient";

export default async function AdminBulkUsersPage() {
  const products = await AdminService.getCourseProducts();

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-700">
      <div>
        <h2 className="text-4xl font-black text-white mb-2 italic">
          Carga Masiva de Usuarios
        </h2>
        <p className="text-slate-500">
          Inscribe múltiples estudiantes en un curso. Tu cuenta quedará
          registrada como comprador y los cupos se sumarán automáticamente.
        </p>
      </div>

      <BulkUsersClient products={products as any} />
    </div>
  );
}
