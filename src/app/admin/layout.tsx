import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ClipboardList, 
  CreditCard, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  Menu
} from "lucide-react";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { icon: LayoutDashboard, label: "Vista General", href: "/admin" },
    { icon: Users, label: "Usuarios", href: "/admin/users" },
    { icon: Users, label: "Carga Masiva", href: "/admin/users/bulk" },
    { icon: BookOpen, label: "Cursos", href: "/admin/courses" },
    { icon: ClipboardList, label: "Saneamiento", href: "/admin/sanitation" },
    { icon: CreditCard, label: "Pagos", href: "/admin/payments" },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans flex overflow-hidden">
      {/* Sidebar Section */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-slate-950/50 backdrop-blur-2xl border-r border-white/5 z-50 transition-all duration-300 hidden lg:block">
        <div className="h-full flex flex-col p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12 px-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">BPM <span className="text-blue-500">Admin</span></span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {menuItems.map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="group flex items-center justify-between px-4 py-3.5 rounded-2xl hover:bg-white/5 transition-all outline-none"
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-slate-400 transition-all group-hover:translate-x-1" />
              </Link>
            ))}
          </nav>

          {/* User Profile / Logout */}
          <div className="pt-8 border-t border-white/5">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/5 hover:bg-red-500/10 text-red-400 transition-all">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-bold">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Section */}
      <main className="flex-1 lg:ml-72 min-h-screen relative">
        {/* Mobile Header */}
        <header className="lg:hidden h-20 bg-slate-950/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-40">
           <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">BPM <span className="text-blue-500">Salud</span></span>
          </div>
          <button className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Menu className="w-6 h-6 text-slate-400" />
          </button>
        </header>

        {/* Global Search / Info Bar (Optional) */}
        <div className="hidden lg:flex h-20 items-center justify-between px-10 border-b border-white/5">
           <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Panel de Control / <span className="text-blue-500">Dashboard</span></h1>
           <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-white">Administrador BPM</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Estado: Online</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
           </div>
        </div>

        <div className="p-6 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
